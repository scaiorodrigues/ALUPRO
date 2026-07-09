#!/bin/bash
# ══════════════════════════════════════════════════════════
# ALUPRO — Script de setup completo para gerar o APK
# Execute este script no seu computador (não na VPS)
# Requisitos: Node.js 18+ instalado
# ══════════════════════════════════════════════════════════

set -e
echo ""
echo "╔══════════════════════════════════════╗"
echo "║     ALUPRO — Setup do APK Android    ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Verifica Node.js
echo "→ Verificando Node.js..."
node --version || { echo "ERRO: Node.js não encontrado. Instale em nodejs.org"; exit 1; }

# 2. Clone ou atualiza o repo
if [ -d "ALUPRO" ]; then
  echo "→ Atualizando repositório..."
  cd ALUPRO && git pull
else
  echo "→ Clonando repositório..."
  git clone https://github.com/scaiorodrigues/ALUPRO.git
  cd ALUPRO
fi

# 3. Instala dependências do app
echo "→ Instalando dependências..."
cd app
npm install

# 4. Instala EAS CLI
echo "→ Instalando EAS CLI..."
npm install -g eas-cli

# 5. Login no Expo
echo ""
echo "→ Fazendo login no Expo..."
echo "   (vai abrir o navegador — use sua conta scaiorodrigues)"
echo ""
eas login

# 6. Inicializa o projeto EAS (vincula ao Expo)
echo "→ Inicializando projeto EAS..."
eas init --id alupro --non-interactive 2>/dev/null || eas init

# 7. Gera o APK
echo ""
echo "╔══════════════════════════════════════╗"
echo "║     Gerando APK — aguarde ~10 min    ║"
echo "╚══════════════════════════════════════╝"
echo ""
eas build --platform android --profile preview --non-interactive

echo ""
echo "✅ Build finalizado!"
echo "   Acesse expo.dev/accounts/scaiorodrigues/projects/alupro/builds"
echo "   para baixar o APK"
