# ALUPRO — App de Análise de Perfis de Alumínio

Aplicativo mobile B2B para busca, visualização e comparação de perfis de alumínio industriais.

## 📱 Baixar o APK (Android)

**[→ Instalar última build](https://expo.dev/accounts/scaiorodrigues/projects/alupro/builds/dabaa5cd-a3f5-4e91-b62b-35f5ab3579b5)**

Abra o link pelo navegador do celular Android e toque em *Install*. Será necessário
permitir a instalação de apps de fontes desconhecidas.

| | |
|---|---|
| Build | `dabaa5cd-a3f5-4e91-b62b-35f5ab3579b5` |
| Perfil | `preview` (APK, distribuição interna) |
| Inclui | Ícone ALUPRO "A" + tela de diagnóstico de erro |

> Builds anteriores ficam listadas em
> [expo.dev/accounts/scaiorodrigues/projects/alupro/builds](https://expo.dev/accounts/scaiorodrigues/projects/alupro/builds)

## Stack
- **Mobile:** React Native + Expo + Expo Router
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Pipeline DXF:** Python 3.11+ (imagem → DXF via Vision AI)

## Estrutura do Repositório

```
ALUPRO/
├── dxf-pipeline/          # Pipeline imagem → DXF
│   ├── image_to_dxf.py        # Caminho B: Vision AI extrai dimensões → DXF paramétrico
│   ├── image_to_dxf_review.py # Caminho C: com revisão humana antes de salvar
│   ├── geometry_cleaner.py    # Limpeza e snap geométrico de contornos
│   ├── dxf_generator.py       # Gerador paramétrico por tipo (T, U, L, H, C, F)
│   ├── supabase_uploader.py   # Upload do DXF gerado para o Supabase Storage
│   └── requirements.txt
├── docs/
│   ├── arquitetura.md         # Arquitetura geral do sistema
│   └── handoff.md             # Documento de handoff para desenvolvimento
└── app/                       # (em desenvolvimento) React Native
```

## Início Rápido — Pipeline DXF

```bash
cd dxf-pipeline
pip install -r requirements.txt

# Caminho B: automático
python image_to_dxf.py --input foto_perfil.png --output perfil.dxf

# Caminho C: com revisão humana
python image_to_dxf_review.py --input foto_perfil.png
```

## Configuração

Copie `.env.example` para `.env` e preencha:

```
ANTHROPIC_API_KEY=sk-...
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-anon-key
```

## Documentação
- [Arquitetura completa](docs/arquitetura.md)
- [Pipeline DXF — detalhes](dxf-pipeline/README.md)
- [Handoff para desenvolvimento](docs/handoff.md)

---
> Desenvolvido por [@scaiorodrigues](https://github.com/scaiorodrigues)
