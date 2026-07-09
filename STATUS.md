# ALUPRO — Status do Projeto

**Última atualização:** 2026-07-09

---

## ✅ Concluído

### App Mobile (`app/`)
- Expo Router com todas as telas: Login, Home, Busca, Detalhe, Admin
- Painel Admin com CRUD, menu de edição inline e FAB
- Integração Supabase (modo demo offline quando sem credenciais)
- Upload de imagem de perfil pelo app
- Busca em tempo real com TanStack Query
- SVG gerado automaticamente por tipo de perfil (T, U, L, H, C, F)

### Pipeline Python (`dxf-pipeline/`)
- `image_to_dxf.py` — Vision AI extrai dimensões → DXF automático
- `image_to_dxf_review.py` — com revisão humana antes de salvar
- `dxf_generator.py` — gerador paramétrico por tipo
- `geometry_cleaner.py` — snap de ângulos e limpeza
- `svg_exporter.py` — DXF → SVG otimizado para o app
- `supabase_uploader.py` — upload direto para Supabase Storage
- `import_csv.py` — importação em lote de perfis via CSV
- `api.py` — API FastAPI expondo o pipeline via HTTP

### Banco de Dados
- Schema SQL completo em `supabase/schema.sql`
- Tabelas: profiles, companies, product_lines, similar_profiles,
  search_history, profile_views, favorites
- RLS, triggers full-text search, view profiles_ranked
- Credenciais no `.env` (não versionado)

### VPS Hostinger KVM 2 — Ubuntu 24.04
- IP: `31.97.19.180`
- Nginx: ativo na porta 80
- API Python (FastAPI + Uvicorn): Supervisor porta 8000
- Docker/Traefik: removido e desabilitado
- Firewall UFW: SSH + HTTP + HTTPS liberados
- Site: `http://31.97.19.180` respondendo
- API: `http://31.97.19.180:8000/health` respondendo

---

## ⏳ Pendente

| # | Tarefa | Como |
|---|---|---|
| 1 | **Configurar DNS** | hpanel.hostinger.com → Domínios → fromtech.com.br → DNS Zone |
| 2 | **Ativar SSL** | `certbot --nginx -d fromtech.com.br -d www.fromtech.com.br -d api.fromtech.com.br -d app.fromtech.com.br` |
| 3 | **Rodar schema SQL** | supabase.com → SQL Editor → colar `supabase/schema.sql` → Run |
| 4 | **Criar bucket Storage** | Supabase → Storage → New bucket → `profile-drawings` → Public |
| 5 | **Gerar APK** | `eas build --platform android --profile preview` |
| 6 | **Instalar APK** | Baixar link gerado pelo Expo e instalar no Android |
| 7 | **Cadastrar perfis** | App → aba Admin → botão + |

---

## DNS — Registros necessários

No hpanel.hostinger.com → Domínios → fromtech.com.br → Zona DNS:

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| A | `@` | `31.97.19.180` | 3600 |
| A | `www` | `31.97.19.180` | 3600 |
| A | `api` | `31.97.19.180` | 3600 |
| A | `app` | `31.97.19.180` | 3600 |

Verificar propagação: `dig fromtech.com.br +short` (deve retornar o IP da VPS)

---

## Arquitetura Final

```
fromtech.com.br     → Site institucional (Nginx → /var/www/ALUPRO/site)
api.fromtech.com.br → Pipeline Python    (Nginx → Uvicorn :8000)
app.fromtech.com.br → Painel admin web   (futuro)

APK Android → React Native + Expo
           → Supabase (banco + auth + storage)
           → api.fromtech.com.br (pipeline DXF)
```

---

## Infraestrutura

| Serviço | Endereço | Status |
|---|---|---|
| VPS | `31.97.19.180` | ✅ Ativo |
| Site | `http://31.97.19.180` | ✅ Respondendo |
| API | `http://31.97.19.180:8000` | ✅ Respondendo |
| Domínio | `fromtech.com.br` | ⏳ DNS não apontado |
| SSL | `https://fromtech.com.br` | ⏳ Aguarda DNS |
| Supabase | Projeto configurado | ⏳ Schema não executado |
| APK | — | ⏳ Não gerado |

---

## Como retomar o desenvolvimento

Abra uma nova sessão com o Claude e forneça:
1. Este arquivo `STATUS.md`
2. O link do repositório: `github.com/scaiorodrigues/ALUPRO`
3. O que deseja fazer

As credenciais ficam no `.env` local e no `eas.json` — nunca versionadas.
