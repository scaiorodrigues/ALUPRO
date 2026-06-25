# ALUPRO — App Mobile

Aplicativo React Native para busca e visualização de perfis de alumínio.

## Requisitos

- Node.js 20+
- Expo CLI: `npm install -g expo-cli eas-cli`
- Android Studio (para emulador) ou dispositivo físico

## Instalação

```bash
cd app
npm install
cp .env.example .env   # preencha com suas credenciais Supabase
npx expo start
```

## Build Android

```bash
# Preview (APK para teste)
eas build --platform android --profile preview

# Produção (AAB para Play Store)
eas build --platform android --profile production
```

## Estrutura

```
app/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/             # Telas de autenticação
│   ├── (app)/              # Telas principais (requerem login)
│   └── _layout.tsx         # Layout raiz
├── components/             # Componentes reutilizáveis
├── lib/                    # Supabase, queries, utilitários
├── store/                  # Zustand stores
├── types/                  # Tipos TypeScript
└── assets/                 # Imagens, fontes
```

## Credenciais de Admin (demo)

```
Email: admin@aluminio.com
Senha: admin123
```
