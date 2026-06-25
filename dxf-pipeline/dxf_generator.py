"""
dxf_generator.py
Gerador paramétrico de perfis de alumínio em DXF.
Recebe um dicionário de dimensões e tipo, devolve um arquivo DXF limpo.
"""

from __future__ import annotations
import ezdxf
from ezdxf.document import Drawing
from ezdxf import units
from dataclasses import dataclass, field
from typing import Optional
import math


@dataclass
class ProfileDimensions:
    """Dimensões normalizadas de um perfil, em milímetros."""
    tipo: str                          # T | U | L | H | C | F
    largura_total: float               # mm — bounding box X
    altura_total: float                # mm — bounding box Y
    espessura_parede: float            # mm — espessura principal
    espessura_mesa: Optional[float] = None    # mm — para H/I
    aba_superior: Optional[float] = None      # mm — para C assimétrico
    aba_inferior: Optional[float] = None      # mm — para C assimétrico
    raio_canto: float = 0.0            # mm — arredondamento (0 = canto vivo)
    confianca: float = 1.0             # 0–1 score da extração
    fonte: str = "manual"              # "ai" | "manual" | "dxf_original"
    notas: list[str] = field(default_factory=list)

    @property
    def area_secao_mm2(self) -> float:
        """Área aproximada da seção transversal em mm²."""
        t = self.espessura_parede
        w = self.largura_total
        h = self.altura_total
        tipo = self.tipo.upper()

        if tipo == "T":
            return w * t + (h - t) * t
        elif tipo == "U":
            return 2 * h * t + (w - 2 * t) * t
        elif tipo == "L":
            return w * t + (h - t) * t
        elif tipo == "H":
            tm = self.espessura_mesa or t
            return 2 * w * tm + (h - 2 * tm) * t
        elif tipo == "C":
            sa = self.aba_superior or t
            si = self.aba_inferior or t
            return h * t + sa * t + si * t
        elif tipo == "F":
            return h * t + w * t + (w / 2) * t
        return w * t  # fallback

    @property
    def peso_kg_m(self) -> float:
        """Peso por metro linear em kg/m (densidade Al = 2,70 g/cm³)."""
        area_cm2 = self.area_secao_mm2 / 100.0
        return round(area_cm2 * 2.70 / 1000 * 1000, 4)  # kg/m


class DXFGenerator:
    """
    Gera arquivos DXF a partir de ProfileDimensions.
    Todas as coordenadas em milímetros. Origem (0, 0) no canto inferior esquerdo.
    """

    LAYER_CONTORNO = "CONTORNO"
    LAYER_EIXOS    = "EIXOS"
    LAYER_INFO     = "INFO"

    def __init__(self, dims: ProfileDimensions):
        self.d = dims
        self.doc: Drawing = ezdxf.new(dxfversion="R2010")
        self.doc.units = units.MM
        self._setup_layers()
        self.msp = self.doc.modelspace()

    def _setup_layers(self):
        layers = self.doc.layers
        layers.add(self.LAYER_CONTORNO, color=7)   # branco/preto
        layers.add(self.LAYER_EIXOS,    color=1)   # vermelho — eixos de simetria
        layers.add(self.LAYER_INFO,     color=3)   # verde — anotações

    def _polyline(self, pontos: list[tuple], fechado=True):
        """Adiciona LWPOLYLINE no layer CONTORNO."""
        self.msp.add_lwpolyline(
            pontos, close=fechado,
            dxfattribs={"layer": self.LAYER_CONTORNO, "lineweight": 50}
        )

    def _eixo(self, p1: tuple, p2: tuple):
        """Linha de eixo de simetria."""
        self.msp.add_line(
            p1, p2,
            dxfattribs={"layer": self.LAYER_EIXOS, "linetype": "CENTER"}
        )

    def _texto(self, ponto: tuple, texto: str, altura=2.5):
        """Texto informativo."""
        self.msp.add_text(
            texto, height=altura,
            dxfattribs={"layer": self.LAYER_INFO, "insert": ponto}
        )

    # ── GERADORES POR TIPO ─────────────────────────────────────────────────────

    def _gerar_T(self):
        d = self.d
        w, h, t = d.largura_total, d.altura_total, d.espessura_parede
        cx = w / 2

        pts = [
            (0, h),           (w, h),
            (w, h - t),       (cx + t/2, h - t),
            (cx + t/2, 0),    (cx - t/2, 0),
            (cx - t/2, h - t),(0, h - t),
        ]
        self._polyline(pts)
        # Eixos
        self._eixo((cx, -5), (cx, h + 5))
        self._texto((w + 2, h/2), f"T {w:.0f}x{h:.0f}x{t:.0f}")

    def _gerar_U(self):
        d = self.d
        w, h, t = d.largura_total, d.altura_total, d.espessura_parede

        pts = [
            (0, 0),   (0, h),
            (t, h),   (t, t),
            (w - t, t),(w - t, h),
            (w, h),   (w, 0),
        ]
        self._polyline(pts)
        cx = w / 2
        self._eixo((cx, -5), (cx, h + 5))
        self._texto((w + 2, h/2), f"U {w:.0f}x{h:.0f}x{t:.0f}")

    def _gerar_L(self):
        d = self.d
        w, h, t = d.largura_total, d.altura_total, d.espessura_parede

        pts = [
            (0, 0),   (w, 0),
            (w, t),   (t, t),
            (t, h),   (0, h),
        ]
        self._polyline(pts)
        self._texto((w + 2, h/2), f"L {w:.0f}x{h:.0f}x{t:.0f}")

    def _gerar_H(self):
        d = self.d
        w, h, t = d.largura_total, d.altura_total, d.espessura_parede
        tm = d.espessura_mesa or t
        cx = w / 2
        cy = h / 2

        pts = [
            (0, 0),        (w, 0),
            (w, tm),       (cx + t/2, tm),
            (cx + t/2, h - tm),(w, h - tm),
            (w, h),        (0, h),
            (0, h - tm),   (cx - t/2, h - tm),
            (cx - t/2, tm),(0, tm),
        ]
        self._polyline(pts)
        self._eixo((cx, -5), (cx, h + 5))
        self._eixo((-5, cy), (w + 5, cy))
        self._texto((w + 2, h/2), f"H {w:.0f}x{h:.0f}x{t:.0f}")

    def _gerar_C(self):
        d = self.d
        w, h, t = d.largura_total, d.altura_total, d.espessura_parede
        sa = d.aba_superior or w * 0.6
        si = d.aba_inferior or w * 0.6

        pts = [
            (0, 0),    (si, 0),
            (si, t),   (t, t),
            (t, h - t),(sa, h - t),
            (sa, h),   (0, h),
        ]
        self._polyline(pts)
        self._texto((w + 2, h/2), f"C {w:.0f}x{h:.0f}x{t:.0f}")

    def _gerar_F(self):
        d = self.d
        w, h, t = d.largura_total, d.altura_total, d.espessura_parede

        pts = [
            (0, 0),    (w, 0),
            (w, t),    (t, t),
            (t, h/2 + t/2),(w * 0.7, h/2 + t/2),
            (w * 0.7, h/2 - t/2),(t, h/2 - t/2),
            (t, h - t),(0, h - t),
        ]
        self._polyline(pts)
        self._texto((w + 2, h/2), f"F {w:.0f}x{h:.0f}x{t:.0f}")

    # ── INTERFACE PÚBLICA ──────────────────────────────────────────────────────

    def gerar(self) -> Drawing:
        """Gera a geometria no DXF e devolve o documento."""
        tipo = self.d.tipo.upper()
        geradores = {
            "T": self._gerar_T,
            "U": self._gerar_U,
            "L": self._gerar_L,
            "H": self._gerar_H,
            "C": self._gerar_C,
            "F": self._gerar_F,
        }
        if tipo not in geradores:
            raise ValueError(f"Tipo '{tipo}' não suportado. Use: {list(geradores)}")
        geradores[tipo]()

        # Anotação de peso
        self._texto(
            (0, -8),
            f"Peso: {self.d.peso_kg_m} kg/m  |  Área: {self.d.area_secao_mm2:.1f} mm²",
            altura=2.0
        )
        return self.doc

    def salvar(self, caminho: str) -> str:
        """Gera e salva o DXF. Retorna o caminho do arquivo."""
        self.gerar()
        self.doc.saveas(caminho)
        return caminho


def gerar_dxf_de_dimensoes(dims: ProfileDimensions, caminho_saida: str) -> str:
    """Função de conveniência para gerar DXF direto de dimensões."""
    gen = DXFGenerator(dims)
    return gen.salvar(caminho_saida)


# ── TESTE LOCAL ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    exemplos = {
        "T": ProfileDimensions(tipo="T", largura_total=30, altura_total=60, espessura_parede=3.0),
        "U": ProfileDimensions(tipo="U", largura_total=40, altura_total=40, espessura_parede=3.0),
        "L": ProfileDimensions(tipo="L", largura_total=30, altura_total=30, espessura_parede=3.0),
        "H": ProfileDimensions(tipo="H", largura_total=40, altura_total=80, espessura_parede=3.0, espessura_mesa=4.0),
    }

    tipo = sys.argv[1].upper() if len(sys.argv) > 1 else "T"
    dims = exemplos.get(tipo, exemplos["T"])
    saida = f"perfil_{tipo}_teste.dxf"
    gerar_dxf_de_dimensoes(dims, saida)
    print(f"✓ {saida} gerado | {dims.peso_kg_m} kg/m")
