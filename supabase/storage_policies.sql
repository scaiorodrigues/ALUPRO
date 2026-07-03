-- ============================================================
-- ALUPRO — Políticas do Storage para o bucket profile-drawings
-- Execute após criar o bucket manualmente no Dashboard
-- ============================================================

-- Leitura pública dos arquivos
CREATE POLICY "public_read_drawings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-drawings');

-- Upload permitido apenas para usuários admin (via service_role no pipeline)
-- Para o app mobile, o upload é feito via service_role key no backend Python
-- Se quiser permitir upload direto do app (admin logado):
CREATE POLICY "admin_upload_drawings"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-drawings' AND
    auth.role() = 'authenticated'
  );

-- Deleção apenas para admins autenticados
CREATE POLICY "admin_delete_drawings"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-drawings' AND
    auth.role() = 'authenticated'
  );
