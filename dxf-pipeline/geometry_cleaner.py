"""
geometry_cleaner.py
Limpeza e normalização de geometria extraída de imagens.
Aplica snap de ângulos, paralelismo forçado e normalização de comprimentos.
"""

from __future__ import annotations
import numpy as np
from typing import List, Tuple
import math

Point = Tuple[float, float]


# Ângulos canônicos para snap (graus)
ANGULOS_SNAP = [0, 45, 90, 135, 180, -45, -90, -135, -180]


def snap_angulo(angulo_deg: float, tolerancia: float = 5.0) -> float | None:
    """
    Retorna o ângulo canônico mais próximo se dentro da tolerância,
    ou None se o segmento deve ser mantido como está.
    """
    for a in ANGULOS_SNAP:
        if abs(angulo_deg - a) < tolerancia:
            return float(a)
    return None


def angulo_segmento(p1: Point, p2: Point) -> float:
    """Ângulo em graus do segmento p1→p2."""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    return math.degrees(math.atan2(dy, dx))


def comprimento_segmento(p1: Point, p2: Point) -> float:
    return math.hypot(p2[0] - p1[0], p2[1] - p1[1])


def mover_ponto_em_angulo(p1: Point, angulo_deg: float, dist: float) -> Point:
    rad = math.radians(angulo_deg)
    return (p1[0] + dist * math.cos(rad), p1[1] + dist * math.sin(rad))


def limpar_poligono(
    pontos: List[Point],
    tolerancia_angulo: float = 5.0,
    tolerancia_comprimento: float = 0.5,
    escala_mm_por_px: float = 1.0,
) -> List[Point]:
    """
    Recebe lista de pontos (contorno bruto, em pixels ou mm),
    aplica snap de ângulos e devolve contorno limpo.

    Args:
        pontos: Lista de (x, y)
        tolerancia_angulo: Graus de tolerância para snap
        tolerancia_comprimento: mm de tolerância para normalizar comprimentos iguais
        escala_mm_por_px: Fator de escala pixels → mm (1.0 se já em mm)

    Returns:
        Lista de pontos corrigidos
    """
    if len(pontos) < 3:
        return pontos

    pts = [(x * escala_mm_por_px, y * escala_mm_por_px) for x, y in pontos]
    resultado = [pts[0]]

    for i in range(len(pts)):
        p1 = resultado[-1]
        p2 = pts[(i + 1) % len(pts)]

        ang = angulo_segmento(p1, p2)
        dist = comprimento_segmento(p1, p2)

        ang_snap = snap_angulo(ang, tolerancia_angulo)
        if ang_snap is not None:
            p2_corrigido = mover_ponto_em_angulo(p1, ang_snap, dist)
        else:
            p2_corrigido = p2

        resultado.append(p2_corrigido)

    return resultado[:-1]  # remove ponto duplicado (fecha no início)


def normalizar_comprimentos(
    pontos: List[Point],
    tolerancia: float = 1.0
) -> List[Point]:
    """
    Agrupa segmentos com comprimentos muito próximos e normaliza para a média.
    Útil quando a escala do desenho não é exata.
    """
    comprimentos = []
    for i in range(len(pontos)):
        p1 = pontos[i]
        p2 = pontos[(i + 1) % len(pontos)]
        comprimentos.append(comprimento_segmento(p1, p2))

    # Agrupa comprimentos próximos
    grupos: list[list[float]] = []
    usados = [False] * len(comprimentos)
    for i, c in enumerate(comprimentos):
        if usados[i]:
            continue
        grupo = [c]
        usados[i] = True
        for j in range(i + 1, len(comprimentos)):
            if not usados[j] and abs(comprimentos[j] - c) <= tolerancia:
                grupo.append(comprimentos[j])
                usados[j] = True
        grupos.append(grupo)

    # Mapeia comprimento original → média do grupo
    media_map = {}
    for grupo in grupos:
        media = sum(grupo) / len(grupo)
        for v in grupo:
            media_map[round(v, 6)] = media

    # Reconstrói pontos com comprimentos normalizados
    resultado = [pontos[0]]
    for i in range(len(pontos)):
        p1 = resultado[-1]
        p2 = pontos[(i + 1) % len(pontos)]
        ang = angulo_segmento(p1, p2)
        dist_orig = comprimento_segmento(p1, p2)
        dist_norm = media_map.get(round(dist_orig, 6), dist_orig)
        resultado.append(mover_ponto_em_angulo(p1, ang, dist_norm))

    return resultado[:-1]


def calcular_simetria(pontos: List[Point], tolerancia: float = 0.5) -> dict:
    """Verifica simetria em X e Y do polígono."""
    pts = np.array(pontos)
    cx = (pts[:, 0].max() + pts[:, 0].min()) / 2
    cy = (pts[:, 1].max() + pts[:, 1].min()) / 2

    # Simetria em X: reflete e compara conjunto de pontos
    refletido_x = np.column_stack([2 * cx - pts[:, 0], pts[:, 1]])
    refletido_y = np.column_stack([pts[:, 0], 2 * cy - pts[:, 1]])

    def conjuntos_similares(a, b, tol):
        for pa in a:
            if not any(np.linalg.norm(pa - pb) < tol for pb in b):
                return False
        return True

    return {
        "simetria_x": conjuntos_similares(pts, refletido_x, tolerancia),
        "simetria_y": conjuntos_similares(pts, refletido_y, tolerancia),
        "centro": (cx, cy),
    }


def calcular_area(pontos: List[Point]) -> float:
    """Área do polígono pela fórmula de Shoelace (mm²)."""
    n = len(pontos)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += pontos[i][0] * pontos[j][1]
        area -= pontos[j][0] * pontos[i][1]
    return abs(area) / 2.0


def pipeline_limpeza(
    pontos_brutos: List[Point],
    tolerancia_angulo: float = 5.0,
    escala_mm_por_px: float = 1.0,
) -> dict:
    """
    Pipeline completo de limpeza. Retorna dict com pontos limpos e métricas.
    """
    p1 = limpar_poligono(pontos_brutos, tolerancia_angulo, escala_mm_por_px=escala_mm_por_px)
    p2 = normalizar_comprimentos(p1)
    simetria = calcular_simetria(p2)
    area = calcular_area(p2)

    pts = np.array(p2)
    w = float(pts[:, 0].max() - pts[:, 0].min())
    h = float(pts[:, 1].max() - pts[:, 1].min())

    return {
        "pontos": p2,
        "n_vertices": len(p2),
        "largura_mm": round(w, 3),
        "altura_mm": round(h, 3),
        "area_mm2": round(area, 3),
        "peso_estimado_kg_m": round(area / 100 * 2.70 / 1000 * 1000, 4),
        **simetria,
    }
