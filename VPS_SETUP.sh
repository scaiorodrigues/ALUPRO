#!/bin/bash
# ══════════════════════════════════════════════════════════
# ALUPRO — Setup completo da VPS Hostinger KVM 2
# Execute como root na VPS via SSH
# Ubuntu 20.04 / 22.04 / 24.04
# ══════════════════════════════════════════════════════════

set -e
DOMAIN="fromtech.com.br"      # SEU DOMÍNIO
REPO="https://github.com/scaiorodrigues/ALUPRO.git"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    ALUPRO — Setup VPS Hostinger KVM 2   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Atualiza o sistema ──────────────────────────────────
echo "→ [1/8] Atualizando sistema..."
apt update -qq && apt upgrade -y -qq

# ── 2. Instala dependências ───────────────────────────────
echo "→ [2/8] Instalando dependências..."
apt install -y -qq \
  nginx certbot python3-certbot-nginx \
  python3 python3-pip python3-venv \
  git curl wget unzip ufw \
  supervisor

# ── 3. Instala Node.js 20 ─────────────────────────────────
echo "→ [3/8] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs -qq
node --version

# ── 4. Clone do repositório ───────────────────────────────
echo "→ [4/8] Clonando repositório ALUPRO..."
cd /var/www
[ -d "ALUPRO" ] && rm -rf ALUPRO
git clone $REPO ALUPRO
cd ALUPRO

# ── 5. Setup do pipeline Python ───────────────────────────
echo "→ [5/8] Configurando pipeline Python..."
cd /var/www/ALUPRO/dxf-pipeline
python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
pip install -q fastapi uvicorn python-multipart

# Cria a API FastAPI do pipeline
cat > /var/www/ALUPRO/dxf-pipeline/api.py << 'PYEOF'
"""
api.py — API REST do pipeline ALUPRO
Recebe imagens e devolve DXF + SVG + dimensões
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import tempfile, os, shutil
from pathlib import Path

app = FastAPI(title="ALUPRO Pipeline API", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def health():
    return {"status": "ok", "service": "ALUPRO Pipeline API"}

@app.post("/pipeline/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Recebe imagem, retorna dimensões extraídas pela Vision AI"""
    try:
        suffix = Path(file.filename).suffix or ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        from image_to_dxf import extrair_dimensoes_via_ai
        dados = extrair_dimensoes_via_ai(tmp_path)
        os.unlink(tmp_path)
        return JSONResponse(dados)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pipeline/generate-dxf")
async def generate_dxf(file: UploadFile = File(...)):
    """Recebe imagem, gera DXF e SVG, retorna URLs"""
    try:
        suffix = Path(file.filename).suffix or ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        from image_to_dxf import extrair_dimensoes_via_ai, dados_para_dimensions
        from dxf_generator import gerar_dxf_de_dimensoes
        from svg_exporter import salvar_svg

        dados = extrair_dimensoes_via_ai(tmp_path)
        if dados.get("confianca", 0) < 0.5:
            raise HTTPException(status_code=422,
                detail=f"Confiança baixa ({dados.get('confianca')}). Envie imagem mais clara.")

        dims = dados_para_dimensions(dados)
        out_dir = Path(tempfile.mkdtemp())
        dxf_path = str(out_dir / f"perfil_{dims.tipo}.dxf")
        svg_path = str(out_dir / f"perfil_{dims.tipo}.svg")

        gerar_dxf_de_dimensoes(dims, dxf_path)
        salvar_svg(dxf_path, svg_path)
        os.unlink(tmp_path)

        return JSONResponse({
            "tipo":             dims.tipo,
            "largura_mm":       dims.largura_total,
            "altura_mm":        dims.altura_total,
            "espessura_mm":     dims.espessura_parede,
            "peso_kg_m":        dims.peso_kg_m,
            "area_mm2":         dims.area_secao_mm2,
            "confianca":        dims.confianca,
            "dxf_path":         dxf_path,
            "svg_path":         svg_path,
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
PYEOF

deactivate

# ── 6. Configura Nginx ────────────────────────────────────
echo "→ [6/8] Configurando Nginx..."

# Site principal (fromtech.com.br)
cat > /etc/nginx/sites-available/fromtech << NGINXEOF
server {
    listen 80;
    server_name fromtech.com.br www.fromtech.com.br;
    root /var/www/ALUPRO/site;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 80;
    server_name api.fromtech.com.br;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 120s;
        client_max_body_size 10M;
    }
}

server {
    listen 80;
    server_name app.fromtech.com.br;
    root /var/www/ALUPRO/admin-panel;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/fromtech /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 7. Configura Supervisor (mantém a API rodando) ────────
echo "→ [7/8] Configurando Supervisor..."
cat > /etc/supervisor/conf.d/alupro-api.conf << SUPEOF
[program:alupro-api]
command=/var/www/ALUPRO/dxf-pipeline/venv/bin/uvicorn api:app --host 127.0.0.1 --port 8000
directory=/var/www/ALUPRO/dxf-pipeline
autostart=true
autorestart=true
stderr_logfile=/var/log/alupro-api.err.log
stdout_logfile=/var/log/alupro-api.out.log
environment=ANTHROPIC_API_KEY="SUA_KEY_AQUI",SUPABASE_URL="https://zpgonnhpokdxdljhflph.supabase.co",SUPABASE_KEY="sb_publishable_yTDVBh7i8CsYFl8hN0S5KQ_CTFPPAKS"
SUPEOF

supervisorctl reread && supervisorctl update
supervisorctl start alupro-api

# ── 8. Configura Firewall ─────────────────────────────────
echo "→ [8/8] Configurando firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              ✅ VPS configurada!                     ║"
echo "║                                                      ║"
echo "║  Próximo passo — SSL (rode após apontar o DNS):     ║"
echo "║                                                      ║"
echo "║  certbot --nginx -d fromtech.com.br                 ║"
echo "║          -d www.fromtech.com.br                     ║"
echo "║          -d api.fromtech.com.br                     ║"
echo "║          -d app.fromtech.com.br                     ║"
echo "║                                                      ║"
echo "║  Status da API:                                      ║"
echo "║  curl http://localhost:8000/                         ║"
echo "╚══════════════════════════════════════════════════════╝"
