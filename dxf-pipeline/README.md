# Pipeline: Imagem → DXF

Converte fotos ou imagens de perfis de alumínio em arquivos DXF precisos,
usando Vision AI para extrair dimensões e um gerador paramétrico para
reconstruir a geometria limpa.

## Fluxo

```
Imagem / Foto / PDF
        │
        ▼
  Vision AI (Claude)
  extrai dimensões e tipo
        │
        ▼
  Gerador Paramétrico
  constrói geometria exata
        │
        ▼
  Limpeza geométrica
  snap de ângulos / paralelas
        │
        ▼
  DXF limpo + SVG preview
        │
        ▼
  Upload Supabase Storage
```

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `image_to_dxf.py` | Pipeline automático completo (Caminho B) |
| `image_to_dxf_review.py` | Pipeline com revisão humana (Caminho C) |
| `geometry_cleaner.py` | Snap de ângulos, paralelismo, normalização |
| `dxf_generator.py` | Gerador paramétrico para tipos T, U, L, H, C, F |
| `supabase_uploader.py` | Upload do DXF/SVG para Supabase Storage |

## Tipos de Perfil Suportados

| Tipo | Seção | Parâmetros |
|---|---|---|
| T | Perfil em T | largura_aba, altura_alma, espessura |
| U | Perfil em U / Canal | largura, altura, espessura |
| L | Cantoneira / Ângulo | largura_h, altura_v, espessura |
| H | Perfil H / I | largura, altura, espessura_alma, espessura_mesa |
| C | Perfil C / U assimétrico | largura, altura, espessura, aba_sup, aba_inf |
| F | Perfil F | largura, altura, espessura, aba |

## Precisão e Limitações

- **Entrada ideal:** screenshot de PDF técnico ou DXF original renderizado
- **Entrada boa:** scan de desenho técnico em 300+ DPI com cotas visíveis  
- **Entrada ruim:** foto com distorção de perspectiva (resultado impreciso)
- **Confiança mínima:** pipeline rejeita automaticamente resultados com score < 0.6

## Estimativa de Peso

Com a geometria gerada, o módulo calcula automaticamente:

```
área_seção (mm²) × densidade_Al (2.70 g/cm³) × fator_conversão = kg/m
```
