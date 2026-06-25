"""
image_to_dxf.py — Caminho B
Pipeline automático: imagem/foto → Vision AI → dimensões → DXF paramétrico.

Uso:
    python image_to_dxf.py --input foto.png --output perfil.dxf
    python image_to_dxf.py --input foto.png  # salva como perfil_<tipo>.dxf
"""

from __future__ import annotations
import anthropic
import base64
import json
import os
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from dxf_generator import DXFGenerator, ProfileDimensions, gerar_dxf_de_dimensoes
from dotenv import load_dotenv

load_dotenv()
app = typer.Typer(help="Pipeline imagem → DXF para perfis de alumínio")
console = Console()

PROMPT_EXTRACAO = """
Você é um especialista em perfis de alumínio industriais.
Analise esta imagem de um perfil de alumínio e extraia as dimensões técnicas.

Retorne APENAS um JSON válido, sem texto antes ou depois, com esta estrutura:

{
  "tipo": "T",
  "largura_total": 30.0,
  "altura_total": 60.0,
  "espessura_parede": 3.0,
  "espessura_mesa": null,
  "aba_superior": null,
  "aba_inferior": null,
  "raio_canto": 0.0,
  "unidade": "mm",
  "confianca": 0.85,
  "notas": ["cotas legíveis", "desenho técnico limpo"]
}

Tipos válidos: T, U, L, H, C, F
- T: perfil em T (aba horizontal + alma vertical central)
- U: canal em U (dois flancos + base)
- L: cantoneira (dois flancos em ângulo reto)
- H: perfil H ou I (duas mesas + alma central)
- C: perfil C (alma vertical + aba sup + aba inf, pode ser assimétrico)
- F: perfil F (alma + duas abas no mesmo lado)

Regras:
- Se a imagem não tiver cotas, estime pelas proporções visuais
- espessura_mesa: só para tipo H (espessura das mesas horizontal)
- aba_superior/aba_inferior: só para tipo C assimétrico
- confianca: 0.0 (nenhuma certeza) a 1.0 (certeza total)
- Se não conseguir identificar o tipo, use "tipo": "DESCONHECIDO"
"""

MIN_CONFIANCA = float(os.getenv("MIN_CONFIDENCE", "0.65"))


def carregar_imagem_base64(caminho: str) -> tuple[str, str]:
    """Carrega imagem e retorna (base64, media_type)."""
    path = Path(caminho)
    ext = path.suffix.lower()
    tipos = {".png": "image/png", ".jpg": "image/jpeg",
             ".jpeg": "image/jpeg", ".webp": "image/webp"}
    media_type = tipos.get(ext, "image/png")
    with open(caminho, "rb") as f:
        return base64.b64encode(f.read()).decode(), media_type


def extrair_dimensoes_via_ai(caminho_imagem: str) -> dict:
    """Chama Claude Vision e extrai dimensões da imagem."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    img_b64, media_type = carregar_imagem_base64(caminho_imagem)

    console.print("[cyan]→ Enviando imagem para Vision AI...[/cyan]")

    resposta = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": media_type, "data": img_b64}
                },
                {"type": "text", "text": PROMPT_EXTRACAO}
            ]
        }]
    )

    texto = resposta.content[0].text.strip()
    # Remove possíveis marcadores de código
    if texto.startswith("```"):
        texto = texto.split("```")[1]
        if texto.startswith("json"):
            texto = texto[4:]
    return json.loads(texto.strip())


def dados_para_dimensions(dados: dict) -> ProfileDimensions:
    """Converte o dict da AI em ProfileDimensions."""
    return ProfileDimensions(
        tipo=dados["tipo"],
        largura_total=float(dados["largura_total"]),
        altura_total=float(dados["altura_total"]),
        espessura_parede=float(dados["espessura_parede"]),
        espessura_mesa=dados.get("espessura_mesa"),
        aba_superior=dados.get("aba_superior"),
        aba_inferior=dados.get("aba_inferior"),
        raio_canto=float(dados.get("raio_canto", 0.0)),
        confianca=float(dados.get("confianca", 0.0)),
        fonte="ai",
        notas=dados.get("notas", []),
    )


def exibir_resultado(dims: ProfileDimensions, caminho_dxf: str):
    table = Table(show_header=True, header_style="bold orange1")
    table.add_column("Campo", style="bold")
    table.add_column("Valor")
    table.add_row("Tipo", dims.tipo)
    table.add_row("Largura total", f"{dims.largura_total} mm")
    table.add_row("Altura total", f"{dims.altura_total} mm")
    table.add_row("Espessura parede", f"{dims.espessura_parede} mm")
    table.add_row("Área seção", f"{dims.area_secao_mm2:.2f} mm²")
    table.add_row("Peso estimado", f"[bold green]{dims.peso_kg_m} kg/m[/bold green]")
    table.add_row("Confiança AI", f"{dims.confianca * 100:.0f}%")
    table.add_row("DXF gerado", f"[bold]{caminho_dxf}[/bold]")
    if dims.notas:
        table.add_row("Notas", " | ".join(dims.notas))
    console.print(table)


@app.command()
def converter(
    input: str  = typer.Option(..., "--input",  "-i", help="Caminho da imagem (PNG, JPG, WEBP)"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Caminho do DXF de saída"),
    verbose: bool = typer.Option(False, "--verbose", "-v"),
):
    """Pipeline automático: imagem → Vision AI → DXF paramétrico."""
    console.print(Panel("[bold orange1]ALUPRO — Pipeline Imagem → DXF[/bold orange1]", expand=False))

    if not Path(input).exists():
        console.print(f"[red]Arquivo não encontrado: {input}[/red]")
        raise typer.Exit(1)

    try:
        dados = extrair_dimensoes_via_ai(input)
    except json.JSONDecodeError as e:
        console.print(f"[red]Erro ao parsear resposta da AI: {e}[/red]")
        raise typer.Exit(1)

    if verbose:
        console.print_json(json.dumps(dados, ensure_ascii=False, indent=2))

    if dados.get("tipo") == "DESCONHECIDO":
        console.print("[yellow]⚠ AI não conseguiu identificar o tipo do perfil.[/yellow]")
        raise typer.Exit(1)

    dims = dados_para_dimensions(dados)

    if dims.confianca < MIN_CONFIANCA:
        console.print(f"[yellow]⚠ Confiança baixa ({dims.confianca:.0%}). "
                      f"Use image_to_dxf_review.py para revisão manual.[/yellow]")
        raise typer.Exit(1)

    caminho_saida = output or f"perfil_{dims.tipo}_{dims.largura_total:.0f}x{dims.altura_total:.0f}.dxf"
    console.print(f"[cyan]→ Gerando DXF paramétrico ({dims.tipo})...[/cyan]")

    gerar_dxf_de_dimensoes(dims, caminho_saida)
    console.print(f"[green]✓ DXF gerado com sucesso![/green]")
    exibir_resultado(dims, caminho_saida)


if __name__ == "__main__":
    app()
