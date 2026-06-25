"""
supabase_uploader.py
Faz upload do DXF gerado para o Supabase Storage
e registra o perfil na tabela 'profiles'.
"""

from __future__ import annotations
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from dxf_generator import ProfileDimensions

load_dotenv()


def _get_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise EnvironmentError("SUPABASE_URL e SUPABASE_KEY precisam estar no .env")
    return create_client(url, key)


def fazer_upload(caminho_dxf: str, dims: ProfileDimensions, bucket: str | None = None) -> str:
    """
    Faz upload do DXF para o Supabase Storage.
    Retorna a URL pública do arquivo.
    """
    client = _get_client()
    bucket = bucket or os.getenv("SUPABASE_BUCKET", "profile-drawings")

    caminho = Path(caminho_dxf)
    storage_path = f"dxf/{caminho.name}"

    with open(caminho_dxf, "rb") as f:
        client.storage.from_(bucket).upload(
            path=storage_path,
            file=f.read(),
            file_options={"content-type": "application/dxf", "upsert": "true"}
        )

    url = client.storage.from_(bucket).get_public_url(storage_path)
    return url


def registrar_perfil(dims: ProfileDimensions, drawing_url: str, company_id: str | None = None) -> dict:
    """
    Insere ou atualiza o perfil na tabela 'profiles' do Supabase.
    Retorna o registro inserido.
    """
    client = _get_client()

    payload = {
        "name": f"{dims.tipo}-{dims.largura_total:.0f}x{dims.altura_total:.0f}",
        "weight_per_meter": dims.peso_kg_m,
        "drawing_url": drawing_url,
        "tags": [dims.tipo.lower(), "gerado_pipeline"],
        "popular": False,
    }
    if company_id:
        payload["company_id"] = company_id

    resultado = client.table("profiles").insert(payload).execute()
    return resultado.data[0] if resultado.data else {}


def pipeline_upload_completo(
    caminho_dxf: str,
    dims: ProfileDimensions,
    company_id: str | None = None,
) -> dict:
    """
    Upload + registro na tabela em uma chamada.
    Retorna dict com url e registro do banco.
    """
    url = fazer_upload(caminho_dxf, dims)
    registro = registrar_perfil(dims, url, company_id)
    return {"url": url, "registro": registro}
