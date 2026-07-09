-- ============================================================
-- ALUPRO — Schema completo do banco de dados
-- Execute no Supabase: Dashboard → SQL Editor → New query
-- Cole todo o conteúdo e clique em Run
-- ============================================================

-- ── Extensões ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ── 1. EMPRESAS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  website     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 2. LINHAS DE PRODUTO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS product_lines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 3. PERFIS DE ALUMÍNIO ──────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID REFERENCES companies(id) ON DELETE SET NULL,
  line_id          UUID REFERENCES product_lines(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  code             TEXT,                        -- código interno ex: "T-3030-B"
  weight_per_meter DECIMAL(8,4),               -- kg/m
  area_mm2         DECIMAL(10,4),              -- área da seção em mm²
  application      TEXT,                       -- ex: "Estrutural / Energia Solar"
  drawing_url      TEXT,                       -- URL SVG/PNG no Storage
  dxf_url          TEXT,                       -- URL do arquivo DXF original
  technical_pdf    TEXT,                       -- URL do PDF técnico
  alloy            TEXT DEFAULT '6063-T5',    -- liga de alumínio
  surface          TEXT DEFAULT 'Anodizado',  -- acabamento superficial
  tags             TEXT[] DEFAULT '{}',
  popular          BOOLEAN DEFAULT FALSE,
  active           BOOLEAN DEFAULT TRUE,
  description      TEXT,
  search_vector    TSVECTOR,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 4. PERFIS SIMILARES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS similar_profiles (
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  similar_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score       DECIMAL(5,4) DEFAULT 0.5,      -- 0.0 a 1.0
  PRIMARY KEY (profile_id, similar_id)
);

-- ── 5. HISTÓRICO DE BUSCAS ────────────────────────────────
CREATE TABLE IF NOT EXISTS search_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query       TEXT NOT NULL,
  result_count INT DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. VISUALIZAÇÕES (ranking popular) ────────────────────
CREATE TABLE IF NOT EXISTS profile_views (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id     UUID,
  viewed_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 7. FAVORITOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, profile_id)
);

-- ══════════════════════════════════════════════════════════
-- ÍNDICES
-- ══════════════════════════════════════════════════════════

-- Full-text search
CREATE INDEX IF NOT EXISTS profiles_fts_idx
  ON profiles USING GIN(search_vector);

-- Busca por empresa e linha
CREATE INDEX IF NOT EXISTS profiles_company_idx ON profiles(company_id);
CREATE INDEX IF NOT EXISTS profiles_line_idx    ON profiles(line_id);
CREATE INDEX IF NOT EXISTS profiles_popular_idx ON profiles(popular) WHERE popular = TRUE;
CREATE INDEX IF NOT EXISTS profiles_active_idx  ON profiles(active)  WHERE active  = TRUE;

-- Views para ranking
CREATE INDEX IF NOT EXISTS views_profile_idx ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS views_date_idx    ON profile_views(viewed_at DESC);

-- ══════════════════════════════════════════════════════════
-- FUNÇÃO: atualiza search_vector automaticamente
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(unaccent(NEW.name), '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(unaccent(NEW.code), '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(unaccent(NEW.application), '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(unaccent(NEW.description), '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profile_search
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_search_vector();

-- ══════════════════════════════════════════════════════════
-- FUNÇÃO: atualizar updated_at em companies
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════

ALTER TABLE companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lines   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE similar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views   ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites       ENABLE ROW LEVEL SECURITY;

-- Leitura pública (perfis ativos, empresas, linhas, similares)
CREATE POLICY "leitura_publica_companies"
  ON companies FOR SELECT USING (true);

CREATE POLICY "leitura_publica_lines"
  ON product_lines FOR SELECT USING (true);

CREATE POLICY "leitura_publica_profiles"
  ON profiles FOR SELECT USING (active = true);

CREATE POLICY "leitura_publica_similar"
  ON similar_profiles FOR SELECT USING (true);

CREATE POLICY "leitura_publica_views"
  ON profile_views FOR SELECT USING (true);

-- Escrita de views (usuários logados ou anônimos com user_id nulo)
CREATE POLICY "inserir_views"
  ON profile_views FOR INSERT WITH CHECK (true);

-- Search history: usuário vê e insere apenas os próprios
CREATE POLICY "search_history_own"
  ON search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Favoritos: usuário gerencia os próprios
CREATE POLICY "favorites_own"
  ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin: escrita total via service_role (não precisa de policy extra)
-- A chave service_role ignora RLS — use apenas no backend/pipeline Python

-- ══════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ══════════════════════════════════════════════════════════
-- Execute separadamente no Dashboard → Storage → New Bucket:
--   Nome: profile-drawings
--   Public: SIM
--   Allowed MIME types: image/png, image/jpeg, image/svg+xml, image/webp
--   Max file size: 5MB

-- ══════════════════════════════════════════════════════════
-- DADOS INICIAIS — Empresas e Linhas
-- ══════════════════════════════════════════════════════════

INSERT INTO companies (name, website) VALUES
  ('Brasal',  'https://www.brasal.com.br'),
  ('Hydro',   'https://www.hydro.com/br'),
  ('Albrás',  'https://www.albras.net'),
  ('Alcoa',   'https://www.alcoa.com/brazil'),
  ('Novelis', 'https://www.novelis.com/pt-br')
ON CONFLICT (name) DO NOTHING;

-- Linhas padrão para Brasal (adapte para sua realidade)
INSERT INTO product_lines (company_id, name, description)
SELECT c.id, l.name, l.description FROM companies c,
  (VALUES
    ('Solar',           'Perfis para montagem de painéis solares fotovoltaicos'),
    ('Industrial',      'Perfis para estruturas e automação industrial'),
    ('Arquitetônica',   'Perfis para fachadas, esquadrias e acabamentos'),
    ('Construção Civil','Perfis para janelas, portas e divisórias'),
    ('Automotiva',      'Perfis para carroçarias e estruturas veiculares')
  ) AS l(name, description)
WHERE c.name = 'Brasal'
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- VIEW ÚTIL: perfis com ranking de popularidade
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW profiles_ranked AS
SELECT
  p.*,
  c.name  AS company_name,
  c.logo_url AS company_logo,
  pl.name AS line_name,
  COALESCE(v.view_count, 0) AS view_count
FROM profiles p
LEFT JOIN companies     c  ON c.id  = p.company_id
LEFT JOIN product_lines pl ON pl.id = p.line_id
LEFT JOIN (
  SELECT profile_id, COUNT(*) AS view_count
  FROM profile_views
  WHERE viewed_at > now() - INTERVAL '30 days'
  GROUP BY profile_id
) v ON v.profile_id = p.id
WHERE p.active = true;
