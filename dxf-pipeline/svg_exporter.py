"""
svg_exporter.py
Converte DXF de perfil de alumínio em SVG otimizado para exibição no app mobile.

Funcionalidades:
  - Lê qualquer DXF gerado pelo dxf_generator.py
  - Exporta SVG limpo com viewBox automático + padding
  - Gera thumbnail PNG (opcional, requer Pillow + cairosvg)
  - Normaliza stroke, cores e layer de contorno
  - Adiciona grade técnica de fundo (opcional)
  - Calcula e embute metadados como atributos SVG data-*

Uso:
    python svg_exporter.py --input perfil.dxf --output perfil.svg
    python svg_exporter.py --input perfil.dxf --thumbnail  # gera também PNG 256x256
"""

from __future__ import annotations
import math
import os
from pathlib import Path
from typing import Optional
import ezdxf
from ezdxf.document import Drawing
import typer
from rich.console import Console

app  = typer.Typer(help="Exporta DXF de perfil de alumínio para SVG/PNG")
console = Console()

# ── Constantes visuais ─────────────────────────────────────────────────────────
PADDING_MM      = 8.0      # padding ao redor do perfil no SVG
STROKE_WIDTH    = 1.5      # largura do traço do contorno
COLOR_CONTORNO  = "#FF6B1A"  # laranja ALUPRO
COLOR_FILL      = "rgba(255,107,26,0.10)"
COLOR_EIXO      = "#FF6B1A"
COLOR_GRID      = "rgba(255,107,26,0.08)"
COLOR_BG        = "#0f1318"  # fundo escuro (padrão app)
GRID_STEP_MM    = 5.0      # passo da grade em mm
LAYER_CONTORNO  = "CONTORNO"
LAYER_EIXOS     = "EIXOS"


# ═══════════════════════════════════════════════════════════════════════════════
# LEITURA DO DXF
# ═══════════════════════════════════════════════════════════════════════════════

def _ler_entidades(doc: Drawing) -> dict:
    """
    Extrai polilinhas e linhas do modelspace.
    Retorna dict com listas de pontos por layer.
    """
    msp = doc.modelspace()
    entidades = {LAYER_CONTORNO: [], LAYER_EIXOS: []}

    for e in msp:
        layer = e.dxf.layer.upper()
        tipo  = e.dxftype()

        if tipo == "LWPOLYLINE":
            pts = [(v[0], v[1]) for v in e.vertices()]
            fechado = bool(e.dxf.flags & 1)
            entidades.setdefault(layer, []).append({
                "tipo": "polyline", "pts": pts, "fechado": fechado
            })

        elif tipo == "LINE":
            entidades.setdefault(layer, []).append({
                "tipo": "line",
                "pts": [(e.dxf.start.x, e.dxf.start.y),
                        (e.dxf.end.x,   e.dxf.end.y)]
            })

        elif tipo == "TEXT" or tipo == "MTEXT":
            txt = e.dxf.text if tipo == "TEXT" else e.text
            ins = e.dxf.insert
            entidades.setdefault("INFO", []).append({
                "tipo": "text", "texto": txt,
                "pts": [(ins.x, ins.y)]
            })

    return entidades


def _bounding_box(entidades: dict) -> tuple[float, float, float, float]:
    """Retorna (xmin, ymin, xmax, ymax) de todas as entidades."""
    xs, ys = [], []
    for layer_ents in entidades.values():
        for e in layer_ents:
            for x, y in e["pts"]:
                xs.append(x); ys.append(y)
    if not xs:
        return 0, 0, 100, 100
    return min(xs), min(ys), max(xs), max(ys)


# ═══════════════════════════════════════════════════════════════════════════════
# GERAÇÃO SVG
# ═══════════════════════════════════════════════════════════════════════════════

def _pts_para_d(pts: list[tuple], fechado: bool) -> str:
    """Converte lista de pontos em atributo 'd' de path SVG."""
    cmds = [f"M {pts[0][0]:.4f} {pts[0][1]:.4f}"]
    for x, y in pts[1:]:
        cmds.append(f"L {x:.4f} {y:.4f}")
    if fechado:
        cmds.append("Z")
    return " ".join(cmds)


def _grade_svg(xmin, ymin, xmax, ymax, step=GRID_STEP_MM) -> str:
    """Gera linhas de grade técnica em SVG."""
    linhas = []
    x = math.floor(xmin / step) * step
    while x <= xmax:
        linhas.append(
            f'<line x1="{x:.2f}" y1="{ymin:.2f}" '
            f'x2="{x:.2f}" y2="{ymax:.2f}" '
            f'stroke="{COLOR_GRID}" stroke-width="0.4"/>'
        )
        x += step
    y = math.floor(ymin / step) * step
    while y <= ymax:
        linhas.append(
            f'<line x1="{xmin:.2f}" y1="{y:.2f}" '
            f'x2="{xmax:.2f}" y2="{y:.2f}" '
            f'stroke="{COLOR_GRID}" stroke-width="0.4"/>'
        )
        y += step
    return "\n  ".join(linhas)


def gerar_svg(
    caminho_dxf: str,
    fundo_escuro: bool = True,
    grade: bool = True,
    largura_px: Optional[int] = None,
    altura_px:  Optional[int] = None,
) -> str:
    """
    Lê o DXF e retorna o SVG como string.

    Args:
        caminho_dxf:  Caminho do arquivo .dxf
        fundo_escuro: True = fundo #0f1318 (padrão app), False = transparente
        grade:        Exibe grade técnica de fundo
        largura_px:   Fixa largura do SVG em px (opcional)
        altura_px:    Fixa altura do SVG em px (opcional)

    Returns:
        String SVG completa
    """
    doc = ezdxf.readfile(caminho_dxf)
    entidades = _ler_entidades(doc)
    xmin, ymin, xmax, ymax = _bounding_box(entidades)

    # Aplica padding
    x0 = xmin - PADDING_MM
    y0 = ymin - PADDING_MM
    vw = (xmax - xmin) + 2 * PADDING_MM
    vh = (ymax - ymin) + 2 * PADDING_MM

    # SVG espelha Y (DXF y+ para cima, SVG y+ para baixo)
    def tx(x): return x - x0
    def ty(y): return vh - (y - y0)   # espelha

    def transform_pts(pts):
        return [(tx(x), ty(y)) for x, y in pts]

    # Dimensões do SVG
    w_attr = f'width="{largura_px}"'  if largura_px else 'width="100%"'
    h_attr = f'height="{altura_px}"'  if altura_px  else 'height="100%"'
    bg     = f'<rect width="{vw:.4f}" height="{vh:.4f}" fill="{COLOR_BG}"/>'              if fundo_escuro else ""

    # Grade
    grade_svg = ""
    if grade:
        # Adapta coordenadas da grade para o sistema SVG espelhado
        grade_svg = f'<g id="grade" opacity="1">{_grade_svg(0, 0, vw, vh)}</g>'

    # ── Contorno ────────────────────────────────────────────────────────────────
    paths_contorno = []
    for e in entidades.get(LAYER_CONTORNO, []):
        pts_t = transform_pts(e["pts"])
        if e["tipo"] == "polyline":
            d = _pts_para_d(pts_t, e.get("fechado", True))
            paths_contorno.append(
                f'<path d="{d}" '
                f'fill="{COLOR_FILL}" '
                f'stroke="{COLOR_CONTORNO}" '
                f'stroke-width="{STROKE_WIDTH}" '
                f'stroke-linejoin="miter" '
                f'stroke-linecap="square"/>'
            )
        elif e["tipo"] == "line" and len(pts_t) == 2:
            x1, y1 = pts_t[0]; x2, y2 = pts_t[1]
            paths_contorno.append(
                f'<line x1="{x1:.4f}" y1="{y1:.4f}" '
                f'x2="{x2:.4f}" y2="{y2:.4f}" '
                f'stroke="{COLOR_CONTORNO}" stroke-width="{STROKE_WIDTH}"/>'
            )

    # ── Eixos ───────────────────────────────────────────────────────────────────
    paths_eixos = []
    for e in entidades.get(LAYER_EIXOS, []):
        if e["tipo"] == "line" and len(e["pts"]) == 2:
            pts_t = transform_pts(e["pts"])
            x1, y1 = pts_t[0]; x2, y2 = pts_t[1]
            paths_eixos.append(
                f'<line x1="{x1:.4f}" y1="{y1:.4f}" '
                f'x2="{x2:.4f}" y2="{y2:.4f}" '
                f'stroke="{COLOR_EIXO}" stroke-width="0.6" '
                f'stroke-dasharray="4 3" opacity="0.5"/>'
            )

    # ── Metadados DXF (lê variáveis de header) ──────────────────────────────────
    nome = Path(caminho_dxf).stem
    dim_w = round(xmax - xmin, 2)
    dim_h = round(ymax - ymin, 2)

    svg = f"""<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {vw:.4f} {vh:.4f}"
  {w_attr} {h_attr}
  data-perfil="{nome}"
  data-largura-mm="{dim_w}"
  data-altura-mm="{dim_h}"
  role="img"
  aria-label="Desenho técnico do perfil {nome}">

  <title>Perfil {nome}</title>
  <desc>Largura: {dim_w}mm | Altura: {dim_h}mm</desc>

  <!-- Fundo -->
  {bg}

  <!-- Grade técnica -->
  {grade_svg}

  <!-- Eixos de simetria -->
  <g id="eixos">
    {"\n    ".join(paths_eixos)}
  </g>

  <!-- Contorno do perfil -->
  <g id="contorno">
    {"\n    ".join(paths_contorno)}
  </g>

</svg>"""
    return svg


def salvar_svg(
    caminho_dxf: str,
    caminho_svg: Optional[str] = None,
    **kwargs
) -> str:
    """Gera e salva o SVG. Retorna o caminho do arquivo salvo."""
    caminho_svg = caminho_svg or Path(caminho_dxf).with_suffix(".svg")
    svg = gerar_svg(caminho_dxf, **kwargs)
    Path(caminho_svg).write_text(svg, encoding="utf-8")
    return str(caminho_svg)


def gerar_thumbnail_png(
    caminho_svg: str,
    caminho_png: Optional[str] = None,
    tamanho: int = 256,
) -> str:
    """
    Converte SVG em PNG quadrado (thumbnail para o app).
    Requer: pip install cairosvg
    """
    try:
        import cairosvg
    except ImportError:
        raise ImportError(
            "cairosvg é necessário para gerar PNG.\n"
            "Instale com: pip install cairosvg"
        )
    caminho_png = caminho_png or Path(caminho_svg).with_suffix(".png")
    cairosvg.svg2png(
        url=str(caminho_svg),
        write_to=str(caminho_png),
        output_width=tamanho,
        output_height=tamanho,
    )
    return str(caminho_png)


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

@app.command()
def exportar(
    input:      str  = typer.Option(...,   "--input",     "-i", help="Arquivo .dxf de entrada"),
    output:     Optional[str] = typer.Option(None,  "--output",    "-o", help="Arquivo .svg de saída"),
    thumbnail:  bool = typer.Option(False, "--thumbnail",  "-t", help="Gerar também PNG 256x256"),
    tam_thumb:  int  = typer.Option(256,   "--thumb-size",       help="Tamanho do thumbnail em px"),
    sem_fundo:  bool = typer.Option(False, "--transparent",       help="Fundo transparente (default: escuro)"),
    sem_grade:  bool = typer.Option(False, "--no-grid",           help="Omite grade técnica"),
    largura:    Optional[int] = typer.Option(None,  "--width",  "-W", help="Largura SVG em px"),
    altura:     Optional[int] = typer.Option(None,  "--height", "-H", help="Altura SVG em px"),
):
    """Exporta DXF de perfil de alumínio para SVG (e opcionalmente PNG)."""
    if not Path(input).exists():
        console.print(f"[red]Arquivo não encontrado: {input}[/red]")
        raise typer.Exit(1)

    console.print(f"[cyan]→ Lendo DXF: {input}[/cyan]")
    caminho_svg = salvar_svg(
        input, output,
        fundo_escuro=not sem_fundo,
        grade=not sem_grade,
        largura_px=largura,
        altura_px=altura,
    )
    tamanho = Path(caminho_svg).stat().st_size
    console.print(f"[green]✓ SVG salvo: {caminho_svg} ({tamanho:,} bytes)[/green]")

    if thumbnail:
        try:
            caminho_png = gerar_thumbnail_png(caminho_svg, tamanho=tam_thumb)
            console.print(f"[green]✓ Thumbnail PNG: {caminho_png}[/green]")
        except ImportError as e:
            console.print(f"[yellow]⚠ {e}[/yellow]")

if __name__ == "__main__":
    app()
