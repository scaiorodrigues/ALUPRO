#!/bin/bash
# ══════════════════════════════════════════════════════════════
# ALUPRO — Setup automático VPS Hostinger KVM 2 / Ubuntu 24.04
# Execute como root: bash <(curl -fsSL https://raw.githubusercontent.com/scaiorodrigues/ALUPRO/main/VPS_SETUP.sh)
# ══════════════════════════════════════════════════════════════

set -e

# ── Cores ──────────────────────────────────────────────────────
GRN='\033[0;32m'; ORG='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'; BLD='\033[1m'
ok()  { echo -e "${GRN}✓${NC} $1"; }
inf() { echo -e "${ORG}→${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
echo -e "${BLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLD}║   ALUPRO — Setup VPS Ubuntu 24.04 KVM 2    ║${NC}"
echo -e "${BLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Verifica root
[ "$EUID" -ne 0 ] && err "Execute como root: sudo bash vps_install.sh"

DOMAIN="fromtech.com.br"
REPO="https://github.com/scaiorodrigues/ALUPRO.git"
API_PORT=8000
SUPABASE_URL="https://zpgonnhpokdxdljhflph.supabase.co"
SUPABASE_KEY="sb_publishable_yTDVBh7i8CsYFl8hN0S5KQ_CTFPPAKS"

# ── 1. Sistema ─────────────────────────────────────────────────
inf "[1/9] Atualizando sistema Ubuntu 24.04..."
export DEBIAN_FRONTEND=noninteractive
apt update -qq && apt upgrade -y -qq
ok "Sistema atualizado"

# ── 2. Dependências ────────────────────────────────────────────
inf "[2/9] Instalando dependências..."
apt install -y -qq \
  nginx certbot python3-certbot-nginx \
  python3 python3-pip python3-venv python3-dev \
  git curl wget unzip ufw \
  supervisor build-essential \
  libssl-dev libffi-dev \
  libopencv-dev python3-opencv
ok "Dependências instaladas"

# ── 3. Node.js 20 ─────────────────────────────────────────────
inf "[3/9] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
apt install -y nodejs -qq
ok "Node.js $(node --version) instalado"

# ── 4. Clone do repositório ────────────────────────────────────
inf "[4/9] Clonando repositório ALUPRO..."
mkdir -p /var/www
cd /var/www
[ -d "ALUPRO" ] && { inf "Atualizando repo existente..."; cd ALUPRO && git pull; } \
                || git clone $REPO ALUPRO
ok "Repositório clonado em /var/www/ALUPRO"

# ── 5. Pipeline Python + API FastAPI ───────────────────────────
inf "[5/9] Configurando pipeline Python..."
cd /var/www/ALUPRO/dxf-pipeline
python3 -m venv venv
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
pip install -q fastapi "uvicorn[standard]" python-multipart aiofiles

# API FastAPI
cat > /var/www/ALUPRO/dxf-pipeline/api.py << 'PYEOF'
"""ALUPRO Pipeline API — FastAPI"""
import os, tempfile, shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

app = FastAPI(title="ALUPRO Pipeline API", version="1.0.0",
    description="Converte imagens de perfis de alumínio em DXF/SVG via Vision AI")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

API_TOKEN = os.getenv("API_TOKEN", "alupro-api-2026")

def verify_token(x_api_token: str = Header(default="")):
    if x_api_token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido")

@app.get("/")
def health():
    return {"status": "ok", "service": "ALUPRO Pipeline API", "version": "1.0.0"}

@app.get("/health")
def healthcheck():
    return {"status": "healthy"}

@app.post("/analyze", dependencies=[Depends(verify_token)])
async def analyze(file: UploadFile = File(..., description="Imagem do perfil (PNG/JPG/SVG)")):
    """Analisa imagem e retorna dimensões extraídas pela Vision AI"""
    suffix = Path(file.filename or "img.png").suffix or ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        from image_to_dxf import extrair_dimensoes_via_ai
        dados = extrair_dimensoes_via_ai(tmp_path)
        return JSONResponse({"success": True, "data": dados})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)

@app.post("/generate", dependencies=[Depends(verify_token)])
async def generate(file: UploadFile = File(...)):
    """Gera DXF + SVG a partir da imagem do perfil"""
    suffix = Path(file.filename or "img.png").suffix or ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        from image_to_dxf import extrair_dimensoes_via_ai, dados_para_dimensions
        from dxf_generator import gerar_dxf_de_dimensoes
        from svg_exporter import salvar_svg

        dados = extrair_dimensoes_via_ai(tmp_path)
        conf  = float(dados.get("confianca", 0))
        if conf < 0.5:
            raise HTTPException(status_code=422,
                detail=f"Confiança muito baixa ({conf:.0%}). Envie imagem mais nítida com o perfil centralizado.")

        dims    = dados_para_dimensions(dados)
        out_dir = Path(tempfile.mkdtemp())
        dxf_p   = str(out_dir / f"perfil_{dims.tipo}.dxf")
        svg_p   = str(out_dir / f"perfil_{dims.tipo}.svg")
        gerar_dxf_de_dimensoes(dims, dxf_p)
        salvar_svg(dxf_p, svg_p)

        return JSONResponse({"success": True, "data": {
            "tipo":         dims.tipo,
            "largura_mm":   dims.largura_total,
            "altura_mm":    dims.altura_total,
            "espessura_mm": dims.espessura_parede,
            "peso_kg_m":    dims.peso_kg_m,
            "area_mm2":     dims.area_secao_mm2,
            "confianca":    conf,
            "svg_content":  Path(svg_p).read_text(),
        }})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)
PYEOF

deactivate
ok "Pipeline Python + API configurados"

# ── 6. Site placeholder ────────────────────────────────────────
inf "[6/9] Criando site placeholder..."
mkdir -p /var/www/ALUPRO/site
cat > /var/www/ALUPRO/site/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FromTech — Tecnologia para o Setor Industrial</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#090c0f;color:#dde4ef;font-family:'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .card{text-align:center;padding:48px 32px;max-width:480px}
  .logo{font-size:48px;font-weight:900;color:#FF6B1A;letter-spacing:4px;margin-bottom:8px}
  .sub{font-size:16px;color:#5e6e88;margin-bottom:32px}
  .badge{display:inline-block;background:rgba(255,107,26,.12);border:1px solid #FF6B1A;border-radius:20px;padding:8px 20px;color:#FF6B1A;font-size:13px;font-weight:600;margin-bottom:48px}
  h1{font-size:28px;font-weight:700;margin-bottom:12px}
  p{color:#8496b0;line-height:1.7;font-size:15px}
  .coming{margin-top:40px;font-size:12px;color:#38424f;letter-spacing:2px;text-transform:uppercase}
</style>
</head>
<body>
<div class="card">
  <div class="logo">FROMTECH</div>
  <div class="sub">Tecnologia e Dados para o Setor Industrial</div>
  <div class="badge">🚀 Em construção</div>
  <h1>Estamos chegando</h1>
  <p>Desenvolvemos soluções digitais para a indústria do alumínio e metalurgia. Nosso app <strong style="color:#FF6B1A">ALUPRO</strong> está em fase final de desenvolvimento.</p>
  <div class="coming">fromtech.com.br · 2026</div>
</div>
</body>
</html>
HTMLEOF
ok "Site placeholder criado"

# ── 7. Nginx ───────────────────────────────────────────────────
inf "[7/9] Configurando Nginx..."
cat > /etc/nginx/sites-available/alupro << NGINXEOF
# fromtech.com.br — Site principal
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root /var/www/ALUPRO/site;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
    location ~* \.(js|css|png|jpg|jpeg|svg|ico|woff2|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    access_log /var/log/nginx/site.access.log;
    error_log  /var/log/nginx/site.error.log;
}

# api.fromtech.com.br — Pipeline Python
server {
    listen 80;
    server_name api.${DOMAIN};
    client_max_body_size 20M;
    location / {
        proxy_pass         http://127.0.0.1:${API_PORT};
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
    access_log /var/log/nginx/api.access.log;
    error_log  /var/log/nginx/api.error.log;
}

# app.fromtech.com.br — Painel admin web (futuro)
server {
    listen 80;
    server_name app.${DOMAIN};
    root /var/www/ALUPRO/admin-panel;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
}
NGINXEOF

mkdir -p /var/www/ALUPRO/admin-panel
echo "<h1>Admin panel — em breve</h1>" > /var/www/ALUPRO/admin-panel/index.html

ln -sf /etc/nginx/sites-available/alupro /etc/nginx/sites-enabled/alupro
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configurado"

# ── 8. Supervisor ──────────────────────────────────────────────
inf "[8/9] Configurando Supervisor (mantém API sempre rodando)..."
cat > /etc/supervisor/conf.d/alupro-api.conf << SUPEOF
[program:alupro-api]
command=/var/www/ALUPRO/dxf-pipeline/venv/bin/uvicorn api:app --host 127.0.0.1 --port ${API_PORT} --workers 2
directory=/var/www/ALUPRO/dxf-pipeline
user=root
autostart=true
autorestart=true
startretries=5
stderr_logfile=/var/log/alupro-api.err.log
stdout_logfile=/var/log/alupro-api.out.log
environment=
    ANTHROPIC_API_KEY="COLE_SUA_KEY_AQUI",
    SUPABASE_URL="${SUPABASE_URL}",
    SUPABASE_KEY="${SUPABASE_KEY}",
    SUPABASE_SERVICE_KEY="COLE_SERVICE_ROLE_KEY_AQUI",
    API_TOKEN="alupro-api-2026"
SUPEOF

supervisorctl reread
supervisorctl update
supervisorctl start alupro-api 2>/dev/null || true
ok "Supervisor configurado"

# ── 9. Firewall ────────────────────────────────────────────────
inf "[9/9] Configurando firewall UFW..."
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'
ok "Firewall configurado (SSH + HTTP + HTTPS liberados)"

# ── Resultado ──────────────────────────────────────────────────
echo ""
echo -e "${BLD}${GRN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLD}${GRN}║              ✅ VPS configurada!                    ║${NC}"
echo -e "${BLD}${GRN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLD}Serviços ativos:${NC}"
echo "  🌐 Site:   http://${DOMAIN}"
echo "  🔌 API:    http://api.${DOMAIN}"
echo "  🛡 Admin:  http://app.${DOMAIN}"
echo ""
echo -e "${BLD}${ORG}Próximos passos:${NC}"
echo ""
echo "  1. Aponte o DNS do domínio para este IP: ${BLD}31.97.19.180${NC}"
echo "     (No painel da Hostinger → Domínios → DNS)"
echo "     Registro A:  @              → 31.97.19.180"
echo "     Registro A:  api            → 31.97.19.180"
echo "     Registro A:  app            → 31.97.19.180"
echo "     Registro A:  www            → 31.97.19.180"
echo ""
echo "  2. Após DNS propagar (até 24h), instale SSL:"
echo "     ${BLD}certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d api.${DOMAIN} -d app.${DOMAIN}${NC}"
echo ""
echo "  3. Teste a API agora:"
echo "     ${BLD}curl http://31.97.19.180/health${NC} (via IP direto)"
echo ""
echo -e "${BLD}Status dos serviços:${NC}"
systemctl is-active nginx     && echo "  ✓ Nginx: ativo"    || echo "  ✗ Nginx: inativo"
systemctl is-active supervisor && echo "  ✓ Supervisor: ativo" || echo "  ✗ Supervisor: inativo"
sleep 2
curl -s http://127.0.0.1:${API_PORT}/health && echo "  ✓ API Python: respondendo" || echo "  ⚠ API Python: iniciando..."
echo ""
