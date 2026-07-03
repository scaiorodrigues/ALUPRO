-- ============================================================
-- ALUPRO — Exemplo de inserção de perfis no banco
-- Adapte com seus dados reais antes de executar
-- ============================================================

-- Busca o ID da empresa Brasal (substitua pelo nome real)
DO $$
DECLARE
  v_company_id UUID;
  v_line_solar  UUID;
  v_line_ind    UUID;
BEGIN

  SELECT id INTO v_company_id FROM companies WHERE name = 'Brasal';
  SELECT id INTO v_line_solar  FROM product_lines WHERE name = 'Solar'      AND company_id = v_company_id;
  SELECT id INTO v_line_ind    FROM product_lines WHERE name = 'Industrial'  AND company_id = v_company_id;

  -- Perfil T-3030
  INSERT INTO profiles (
    company_id, line_id, name, code,
    weight_per_meter, area_mm2,
    application, alloy, surface,
    tags, popular, description
  ) VALUES (
    v_company_id, v_line_solar, 'T-3030', 'BSL-T3030',
    0.842, 31.18,
    'Estrutural / Energia Solar',
    '6063-T5', 'Anodizado natural',
    ARRAY['solar','estrutural','rack','t-slot'],
    true,
    'Perfil em T para montagem de painéis solares fotovoltaicos. Alta resistência mecânica e excelente relação peso/resistência. Compatível com fixadores M6 e M8.'
  ) ON CONFLICT DO NOTHING;

  -- Perfil U-40x40
  INSERT INTO profiles (
    company_id, line_id, name, code,
    weight_per_meter, area_mm2,
    application, alloy, surface,
    tags, popular, description
  ) VALUES (
    v_company_id, v_line_ind, 'U-40x40', 'BSL-U4040',
    1.124, 41.63,
    'Guias e Trilhos',
    '6063-T5', 'Anodizado natural',
    ARRAY['industrial','guia','trilho','canal'],
    true,
    'Perfil em U para aplicações industriais, ideal para guias lineares, trilhos e estruturas de suporte modulares.'
  ) ON CONFLICT DO NOTHING;

END $$;
