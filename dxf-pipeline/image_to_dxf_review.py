"""
image_to_dxf_review.py — Caminho C
Pipeline com revisão humana: AI propõe dimensões, usuário confirma/corrige,
só então gera o DXF final e opcionalmente faz upload ao Supabase.

Uso:
    python image_to_dxf_review.py --input foto.png
"""

from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.table import Table

from image_to_dxf import extrair_dimensoes_via_ai, dados_para_dimensions, exibir_resultado
from dxf_generator import ProfileDimensions, gerar_dxf_de_dimensoes
from dotenv import load_dotenv

load_dotenv()
app = typer.Typer(help="Pipeline com revisão humana para geração de DXF")
console = Console()

TIPOS_VALIDOS = ["T", "U", "L", "H", "C", "F"]


def revisar_dimensoes(dados_ai: dict) -> dict:
    """
    Apresenta as dimensões sugeridas pela AI e permite ao usuário
    confirmar ou corrigir cada campo interativamente.
    """
    console.print(Panel("[bold]Revisão das dimensões extraídas pela AI[/bold]
"
                        "Pressione Enter para aceitar o valor sugerido.", expand=False))

    def pedir(campo: str, valor_ai, tipo=float, obrigatorio=True) -> any:
        sugestao = f"[dim]{valor_ai}[/dim]" if valor_ai is not None else "[dim]não informado[/dim]"
        label = f"  {campo} {sugestao}"
        while True:
            entrada = Prompt.ask(label, default="" if valor_ai is None else str(valor_ai))
            if not entrada and not obrigatorio:
                return None
            if not entrada and obrigatorio:
                console.print("[red]Campo obrigatório.[/red]")
                continue
            try:
                return tipo(entrada)
            except ValueError:
                console.print(f"[red]Valor inválido para {tipo.__name__}.[/red]")

    revisado = {}

    # Tipo
    tipo_ai = dados_ai.get("tipo", "T")
    while True:
        tipo = Prompt.ask(f"  tipo [{'/'.join(TIPOS_VALIDOS)}]", default=tipo_ai).upper()
        if tipo in TIPOS_VALIDOS:
            revisado["tipo"] = tipo
            break
        console.print(f"[red]Tipo inválido. Use: {TIPOS_VALIDOS}[/red]")

    revisado["largura_total"]    = pedir("largura_total (mm)", dados_ai.get("largura_total"))
    revisado["altura_total"]     = pedir("altura_total (mm)",  dados_ai.get("altura_total"))
    revisado["espessura_parede"] = pedir("espessura_parede (mm)", dados_ai.get("espessura_parede"))

    if revisado["tipo"] == "H":
        revisado["espessura_mesa"] = pedir("espessura_mesa (mm)", dados_ai.get("espessura_mesa"), obrigatorio=False)
    if revisado["tipo"] == "C":
        revisado["aba_superior"] = pedir("aba_superior (mm)", dados_ai.get("aba_superior"), obrigatorio=False)
        revisado["aba_inferior"] = pedir("aba_inferior (mm)", dados_ai.get("aba_inferior"), obrigatorio=False)

    revisado["raio_canto"] = pedir("raio_canto (mm, 0=vivo)", dados_ai.get("raio_canto", 0.0), obrigatorio=False) or 0.0
    revisado["confianca"]  = 1.0  # revisado pelo humano = confiança máxima
    revisado["notas"]      = dados_ai.get("notas", []) + ["revisado_manualmente"]

    return revisado


@app.command()
def revisar(
    input: str = typer.Option(..., "--input", "-i", help="Caminho da imagem"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Caminho do DXF"),
    skip_ai: bool = typer.Option(False, "--skip-ai", help="Pular AI e inserir dimensões manualmente"),
    upload: bool = typer.Option(False, "--upload", "-u", help="Fazer upload para Supabase após gerar"),
):
    """Pipeline com revisão humana: AI propõe → usuário confirma → DXF gerado."""
    console.print(Panel("[bold orange1]ALUPRO — Revisão de Perfil[/bold orange1]", expand=False))

    if not Path(input).exists():
        console.print(f"[red]Arquivo não encontrado: {input}[/red]")
        raise typer.Exit(1)

    # 1. Extração AI (ou manual)
    if skip_ai:
        dados_ai = {
            "tipo": "T", "largura_total": 30.0, "altura_total": 60.0,
            "espessura_parede": 3.0, "confianca": 0.0, "notas": ["inserido_manualmente"]
        }
        console.print("[yellow]Modo manual — insira as dimensões abaixo:[/yellow]")
    else:
        console.print("[cyan]→ Extraindo dimensões via Vision AI...[/cyan]")
        try:
            dados_ai = extrair_dimensoes_via_ai(input)
            confianca = dados_ai.get("confianca", 0)
            cor = "green" if confianca >= 0.8 else "yellow" if confianca >= 0.6 else "red"
            console.print(f"[{cor}]  Confiança AI: {confianca:.0%}[/{cor}]")
        except Exception as e:
            console.print(f"[red]Erro na AI: {e}. Entrando em modo manual.[/red]")
            dados_ai = {"tipo": "T", "largura_total": None, "altura_total": None,
                        "espessura_parede": None, "confianca": 0.0, "notas": []}

    # 2. Revisão humana
    dados_revisados = revisar_dimensoes(dados_ai)
    dims = dados_para_dimensions(dados_revisados)

    # 3. Confirmação final
    console.print("\n[bold]Dimensões finais:[/bold]")
    table = Table(show_header=False)
    table.add_row("Tipo",     dims.tipo)
    table.add_row("Largura",  f"{dims.largura_total} mm")
    table.add_row("Altura",   f"{dims.altura_total} mm")
    table.add_row("Espessura",f"{dims.espessura_parede} mm")
    table.add_row("Peso est.", f"[bold green]{dims.peso_kg_m} kg/m[/bold green]")
    console.print(table)

    if not Confirm.ask("\nConfirmar e gerar DXF?", default=True):
        console.print("[yellow]Cancelado.[/yellow]")
        raise typer.Exit(0)

    # 4. Geração DXF
    caminho_saida = output or f"perfil_{dims.tipo}_{dims.largura_total:.0f}x{dims.altura_total:.0f}_rev.dxf"
    gerar_dxf_de_dimensoes(dims, caminho_saida)
    console.print(f"[green]✓ DXF salvo: {caminho_saida}[/green]")
    exibir_resultado(dims, caminho_saida)

    # 5. Upload opcional
    if upload:
        try:
            from supabase_uploader import fazer_upload
            url = fazer_upload(caminho_saida, dims)
            console.print(f"[green]✓ Upload Supabase: {url}[/green]")
        except ImportError:
            console.print("[yellow]supabase_uploader não configurado.[/yellow]")
        except Exception as e:
            console.print(f"[red]Erro no upload: {e}[/red]")


if __name__ == "__main__":
    app()
