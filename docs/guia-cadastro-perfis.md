# Guia de Cadastro de Perfis no ALUPRO

Como adicionar seus perfis de alumínio no banco de dados da forma correta
para funcionar no app Android.

---

## Visão Geral das Opções

| Método | Melhor para | Dificuldade |
|---|---|---|
| **A — Admin no app** | 1–10 perfis, uso cotidiano | ⭐ Fácil |
| **B — SQL Editor (Supabase)** | Primeiros dados, ajuste fino | ⭐⭐ Médio |
| **C — CSV Import** | Muitos perfis de uma vez (50+) | ⭐⭐ Médio |
| **D — Pipeline Python (DXF)** | Upload de desenho técnico real | ⭐⭐⭐ Avançado |

---

## Método A — Pelo App (recomendado para uso diário)

1. Abra o app e faça login como **admin@aluminio.com**
2. Toque na aba **🛡 Admin** na barra inferior
3. Toque no botão **+** (laranja, canto inferior direito)
4. Preencha os campos:

### Campos do formulário

| Campo | O que colocar | Exemplo |
|---|---|---|
| **Nome do Perfil** | Designação técnica do perfil | `T-3030` |
| **Aplicação** | Para que serve | `Estrutural / Energia Solar` |
| **Peso (kg/m)** | Peso por metro linear | `0.842` |
| **Tags** | Palavras-chave separadas por vírgula | `solar, rack, estrutural` |
| **Descrição** | Texto técnico completo | `Perfil em T para...` |
| **Imagem** | Foto ou desenho do perfil | PNG/JPG com fundo branco ou transparente |
| **Popular** | Marcar se for muito buscado | ✓ ou ✗ |

5. Toque em **ADICIONAR PERFIL**

> O perfil é salvo imediatamente no Supabase e aparece no app para todos.

---

## Método B — SQL Editor no Supabase (primeiros dados)

1. Acesse **supabase.com → seu projeto → SQL Editor**
2. Clique em **New query**
3. Use o template abaixo, adaptando com seus dados:

```sql
-- Substitua 'Brasal' pelo nome da sua empresa
INSERT INTO profiles (
  company_id,
  line_id,
  name,
  code,
  weight_per_meter,
  area_mm2,
  application,
  alloy,
  surface,
  tags,
  popular,
  description
)
SELECT
  c.id,
  l.id,
  'T-3030',                        -- Nome do perfil
  'BSL-T3030',                     -- Código interno
  0.842,                           -- Peso kg/m
  31.18,                           -- Área mm² (opcional)
  'Estrutural / Energia Solar',    -- Aplicação
  '6063-T5',                       -- Liga de alumínio
  'Anodizado natural',             -- Acabamento
  ARRAY['solar','estrutural'],     -- Tags (sem acento)
  true,                            -- Popular?
  'Descrição técnica completa...'  -- Descrição
FROM companies c
JOIN product_lines l ON l.company_id = c.id
WHERE c.name = 'Brasal'
  AND l.name = 'Solar'
LIMIT 1;
```

4. Clique em **Run**
5. Verifique em **Table Editor → profiles**

---

## Método C — Importar CSV (muitos perfis de uma vez)

### Formato do arquivo CSV

Crie um arquivo `perfis.csv` com esta estrutura:

```
name,code,weight_per_meter,area_mm2,application,alloy,surface,tags,popular,description
T-3030,BSL-T3030,0.842,31.18,Estrutural / Solar,6063-T5,Anodizado natural,"solar,rack,estrutural",true,Perfil em T para painel solar
U-40x40,BSL-U4040,1.124,41.63,Guias e Trilhos,6063-T5,Anodizado natural,"industrial,guia",true,Canal U para trilhos
L-30x30,BSL-L3030,0.487,18.04,Acabamento,6063-T5,Anodizado,arquitetonico,false,Cantoneira para acabamento
```

### Regras do CSV
- Tags: sem acento, minúsculas, separadas por vírgula dentro de aspas
- popular: `true` ou `false`
- weight_per_meter: use ponto como separador decimal
- Salve em UTF-8

### Como importar

1. Abra o terminal no diretório do arquivo
2. Use o script Python incluído no projeto:

```bash
cd dxf-pipeline
pip install -r requirements.txt
python import_csv.py --file perfis.csv --company "Brasal" --line "Solar"
```

---

## Método D — Pipeline Python com DXF ou imagem

Para converter um desenho técnico em DXF e cadastrar automaticamente:

```bash
cd dxf-pipeline

# Se tiver o DXF original:
python svg_exporter.py --input perfil.dxf --output perfil.svg
# Depois suba o SVG manualmente pelo app (Método A)

# Se tiver apenas foto/imagem:
python image_to_dxf_review.py --input foto_perfil.jpg --upload
# O pipeline extrai dimensões via IA, você confirma, e já sobe no Supabase
```

---

## Como fazer upload das imagens corretamente

### Formato ideal da imagem

| Critério | Recomendado |
|---|---|
| Formato | **SVG** (vetorial) ou PNG |
| Fundo | **Transparente** ou branco |
| Tamanho | Mínimo 400×400px |
| Peso do arquivo | Máximo 2MB |
| Cor do perfil | Preto ou cinza escuro no fundo claro |

### Preparando a imagem no seu computador

**Se tiver o DXF no SolidWorks ou Inventor:**
1. Abra o arquivo DXF
2. Exporte como PNG em vista superior (planta)
3. Fundo branco, escala 1:1
4. Resolução mínima 400×400px

**Se tiver apenas o catálogo em PDF:**
1. Abra o PDF
2. Dê zoom no desenho do perfil
3. Print Screen ou use Snipping Tool (Windows) / Screenshot (Mac)
4. Salve como PNG

**Se quiser gerar SVG automaticamente:**
Use o pipeline: `python image_to_dxf.py --input foto.png --output perfil.dxf`
O SVG gerado pode ser enviado direto pelo app.

---

## Estrutura de dados — o que cada campo significa

```
profiles
├── name              → Nome técnico: "T-3030", "U-40x40", "L-30x30x3"
├── code              → Código interno da empresa: "BSL-T3030"
├── company_id        → Qual empresa fabrica (referência)
├── line_id           → Qual linha de produto (referência)
├── weight_per_meter  → Peso em kg por metro linear
├── area_mm2          → Área da seção transversal em mm²
├── application       → Uso principal: "Estrutural / Solar"
├── alloy             → Liga: "6063-T5", "6061-T6", "1100-O"
├── surface           → Acabamento: "Anodizado", "Pintado", "Natural"
├── tags              → Array: ["solar", "rack", "estrutural"]
├── drawing_url       → URL da imagem no Supabase Storage
├── dxf_url           → URL do arquivo DXF original
├── technical_pdf     → URL do PDF da ficha técnica
├── popular           → Aparece na seção "Mais Populares"
├── active            → false = oculto no app (não deletado)
└── description       → Texto técnico completo
```

---

## Checklist para cadastrar seu catálogo completo

- [ ] Criar o projeto no Supabase e rodar `supabase/schema.sql`
- [ ] Criar o bucket `profile-drawings` no Storage (público)
- [ ] Ajustar a lista de empresas na tabela `companies`
- [ ] Ajustar as linhas de produto na tabela `product_lines`
- [ ] Cadastrar perfis (Método A, B ou C)
- [ ] Fazer upload das imagens pelo app (admin) ou pelo pipeline
- [ ] Verificar que os perfis aparecem no app
- [ ] Marcar os mais buscados como `popular = true`

---

## Supabase — onde encontrar suas credenciais

1. Acesse **supabase.com** e abra seu projeto
2. Vá em **Settings → API**
3. Copie:
   - **Project URL** → vai em `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** → vai em `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → use apenas no pipeline Python (nunca no app)
