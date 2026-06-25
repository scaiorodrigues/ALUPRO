# Arquitetura — ALUPRO

## Stack Completa

| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo SDK 52 + Expo Router |
| Estado | Zustand + TanStack Query |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Pipeline DXF | Python 3.11 + ezdxf + Vision AI (Claude) |
| CI/CD | GitHub Actions + EAS Build |

## Banco de Dados (PostgreSQL / Supabase)

```sql
CREATE TABLE profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID REFERENCES companies(id),
  line_id          UUID REFERENCES product_lines(id),
  name             TEXT NOT NULL,
  weight_per_meter DECIMAL(8,4),
  application      TEXT,
  drawing_url      TEXT,
  technical_pdf    TEXT,
  tags             TEXT[],
  search_vector    TSVECTOR,
  popular          BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  logo_url   TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_lines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name       TEXT NOT NULL
);
```

## Segurança RLS

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso_aprovados" ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL AND
       (SELECT raw_user_meta_data->>'approved'
        FROM auth.users WHERE id = auth.uid()) = 'true');
```

## Pipeline DXF

```
Imagem → Vision AI → Dimensões JSON → Gerador Paramétrico → DXF → Supabase Storage
```

Ver detalhes em [dxf-pipeline/README.md](../dxf-pipeline/README.md).
