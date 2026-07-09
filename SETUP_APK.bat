@echo off
echo.
echo ╔══════════════════════════════════════╗
echo ║     ALUPRO — Setup do APK Android    ║
echo ╚══════════════════════════════════════╝
echo.

echo Verificando Node.js...
node --version
if %errorlevel% neq 0 (
  echo ERRO: Node.js nao encontrado. Instale em nodejs.org
  pause
  exit /b 1
)

echo Clonando repositorio...
git clone https://github.com/scaiorodrigues/ALUPRO.git
cd ALUPRO\app

echo Instalando dependencias...
npm install

echo Instalando EAS CLI...
npm install -g eas-cli

echo.
echo Fazendo login no Expo...
echo (vai abrir o navegador)
echo.
eas login

echo Inicializando projeto EAS...
eas init

echo.
echo Gerando APK (aguarde 10 minutos)...
eas build --platform android --profile preview

echo.
echo APK gerado! Acesse expo.dev para baixar.
pause
