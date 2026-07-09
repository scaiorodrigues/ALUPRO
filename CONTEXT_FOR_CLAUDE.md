# Contexto para Claude — ALUPRO

Cole este arquivo ao iniciar uma nova sessão para retomar o desenvolvimento.

---

## Projeto
App mobile B2B de catálogo de perfis de alumínio industrial.
Repositório: https://github.com/scaiorodrigues/ALUPRO

## Stack
- Mobile: React Native + Expo Router (Expo username: scaiorodrigues)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Pipeline: Python + FastAPI + Vision AI
- Infra: VPS Hostinger KVM 2 Ubuntu 24.04 + Nginx + Supervisor
- Domínio: fromtech.com.br

## Infraestrutura
- VPS IP: 31.97.19.180
- SSH: ssh root@31.97.19.180
- Supabase projeto: zpgonnhpokdxdljhflph.supabase.co
- Credenciais: armazenadas no .env local (não versionado)

## Status (2026-07-09)
- App React Native: completo
- Pipeline Python: completo e rodando na VPS
- Nginx + Supervisor: configurados e ativos
- Schema SQL: pronto em supabase/schema.sql (não executado)
- DNS fromtech.com.br: NÃO apontado para VPS ainda
- SSL: pendente (aguarda DNS)
- APK: não gerado ainda

## Próximos passos em ordem
1. DNS no hpanel.hostinger.com (4 registros A para 31.97.19.180)
2. Certbot SSL após DNS propagar
3. Schema SQL no Supabase SQL Editor
4. Bucket profile-drawings no Supabase Storage
5. EAS Build para gerar APK Android
6. Cadastrar perfis pelo app (aba Admin)

## Estrutura do repositório
```
ALUPRO/
├── app/              # React Native completo
├── dxf-pipeline/     # Pipeline Python imagem→DXF
├── supabase/         # Schema SQL + seed + storage policies
├── docs/             # Guias e arquitetura
├── STATUS.md         # Status detalhado
├── PRIMEIROS_PASSOS.md
├── SETUP_APK.sh / .bat
└── VPS_SETUP.sh      # Script de setup da VPS (já executado)
```

## Comandos úteis

### VPS
```bash
# Status dos serviços
systemctl status nginx
supervisorctl status
curl http://localhost:8000/health

# Logs da API
tail -f /var/log/alupro-api.err.log

# Atualizar código da VPS
cd /var/www/ALUPRO && git pull
supervisorctl restart alupro-api
```

### APK
```bash
cd ALUPRO/app
eas login    # usuario: scaiorodrigues
eas build --platform android --profile preview
```

### DNS (verificar propagação)
```bash
dig fromtech.com.br +short
# Deve retornar: 31.97.19.180
```
