# ALUPRO — Primeiros Passos

## 1. Configurar o banco de dados Supabase

Acesse: https://supabase.com/dashboard/project/zpgonnhpokdxdljhflph/sql/new

Cole e execute o arquivo: `supabase/schema.sql`

Depois crie o bucket de imagens:
- Vá em Storage → New bucket
- Nome: `profile-drawings`
- Marque como **Public**
- Clique em Create

## 2. Criar conta no Expo

Acesse expo.dev → Sign up → use o GitHub para facilitar

Me passe o username após criar.

## 3. Gerar o APK

Com o username do Expo, rode no terminal:

```bash
# Clone o projeto
git clone https://github.com/scaiorodrigues/ALUPRO.git
cd ALUPRO/app

# Instale dependências
npm install

# Login no Expo
npx eas-cli login

# Gere o APK (demora ~10 minutos, roda na nuvem)
npx eas-cli build --platform android --profile preview

# Expo vai gerar um link de download do APK
```

## 4. Instalar o APK no celular

- Baixe o APK pelo link que o Expo vai gerar
- No Android: Configurações → Segurança → Fontes desconhecidas → Ativar
- Abra o arquivo APK baixado
- Login: admin@aluminio.com / admin123

## 5. Cadastrar seus perfis

Com o app instalado, vá na aba Admin e use o botão + para adicionar perfis.
Veja o guia completo em: docs/guia-cadastro-perfis.md
