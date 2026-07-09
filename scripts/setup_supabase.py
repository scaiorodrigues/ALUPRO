import urllib.request, urllib.error, json, sys

SUPABASE_URL = "https://zpgonnhpokdxdljhflph.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZ29ubmhwb2tkeGRsamhmbHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU1NzQ5MywiZXhwIjoyMDk5MTMzNDkzfQ.kgt_AuPSMES6PvrknPhGs8r6QpPV4o_I_p-cgkLgA9g"

def rest(method, path, body=None):
    data = json.dumps(body).encode() if body else None
    req  = urllib.request.Request(
        f"{SUPABASE_URL}{path}", data=data, method=method,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read().decode()
            return r.status, json.loads(txt) if txt.strip() else {}
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

print("\n ALUPRO — Setup Supabase\n" + "="*40)

# 1. Testa
print("\n[1/4] Testando conexão...")
s, d = rest("GET", "/rest/v1/")
print(f"  {'✓ OK' if s==200 else f'✗ ERRO {s}: {str(d)[:80]}'}")
if s != 200: sys.exit(1)

# 2. Verifica tabelas
print("\n[2/4] Verificando tabelas...")
s, d = rest("GET", "/rest/v1/companies?limit=1")
if s == 200:
    print("  ✓ Schema já executado")
else:
    print("  ✗ Schema não encontrado")
    print("  → Execute manualmente: supabase.com/dashboard/project/zpgonnhpokdxdljhflph/sql/new")
    print("  → Cole o arquivo supabase/schema.sql do GitHub")

# 3. Cria usuário admin
print("\n[3/4] Criando usuário admin...")
s, d = rest("POST", "/auth/v1/admin/users", {
    "email": "admin@aluminio.com",
    "password": "Alupro@2026",
    "email_confirm": True,
    "user_metadata": {"role": "admin", "approved": True}
})
if s in [200, 201]:
    print("  ✓ Admin criado: admin@aluminio.com / Alupro@2026")
elif "already" in str(d).lower() or s == 422:
    print("  ✓ Admin já existe")
else:
    print(f"  ✗ Erro {s}: {str(d)[:100]}")

# 4. Cria bucket
print("\n[4/4] Criando bucket Storage...")
s, d = rest("POST", "/storage/v1/bucket", {
    "id": "profile-drawings",
    "name": "profile-drawings",
    "public": True,
    "file_size_limit": 5242880,
    "allowed_mime_types": ["image/png","image/jpeg","image/jpg","image/svg+xml","image/webp"]
})
if s in [200, 201]:
    print("  ✓ Bucket 'profile-drawings' criado")
elif "already" in str(d).lower():
    print("  ✓ Bucket já existe")
else:
    print(f"  ✗ Erro {s}: {str(d)[:100]}")

print("\n" + "="*40)
print("✅ Concluído!")
print("   Admin: admin@aluminio.com / Alupro@2026")
