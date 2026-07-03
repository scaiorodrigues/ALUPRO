"""
import_csv.py
Importa perfis de alumínio a partir de um arquivo CSV para o Supabase.

Uso:
    python import_csv.py --file perfis.csv --company "Brasal" --line "Solar"
    python import_csv.py --file perfis.csv  # sem filtro de empresa/linha
"""

import csv
import os
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich.progress import track
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
app     = typer.Typer()
console = Console()


def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        console.print("[red]Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env[/red]")
        raise typer.Exit(1)
    return create_client(url, key)


def get_or_create_company(sb, name: str) -> str:
    r = sb.table("companies").select("id").eq("name", name).single().execute()
    if r.data:
        return r.data["id"]
    r = sb.table("companies").insert({"name": name}).select("id").single().execute()
    return r.data["id"]


def get_or_create_line(sb, company_id: str, name: str) -> str:
    r = sb.table("product_lines").select("id")        .eq("company_id", company_id).eq("name", name).single().execute()
    if r.data:
        return r.data["id"]
    r = sb.table("product_lines")        .insert({"company_id": company_id, "name": name}).select("id").single().execute()
    return r.data["id"]


@app.command()
def importar(
    file:    str           = typer.Option(..., "--file",    "-f", help="Caminho do CSV"),
    company: Optional[str] = typer.Option(None, "--company", "-c", help="Nome da empresa padrão"),
    line:    Optional[str] = typer.Option(None, "--line",    "-l", help="Nome da linha padrão"),
    dry_run: bool          = typer.Option(False, "--dry-run",      help="Simula sem inserir"),
):
    """Importa perfis de alumínio de um CSV para o Supabase."""
    sb = get_supabase()

    company_id = get_or_create_company(sb, company) if company else None
    line_id    = get_or_create_line(sb, company_id, line) if (company_id and line) else None

    rows = list(csv.DictReader(open(file, encoding="utf-8")))
    console.print(f"[cyan]→ {len(rows)} perfis encontrados no CSV[/cyan]")

    ok = err = 0
    table = Table("Nome", "Peso", "Status", show_header=True, header_style="bold")

    for row in track(rows, description="Importando..."):
        tags_raw = row.get("tags", "")
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

        payload = {
            "name":             row.get("name", "").strip(),
            "code":             row.get("code", "").strip() or None,
            "weight_per_meter": float(row.get("weight_per_meter", 0) or 0),
            "area_mm2":         float(row.get("area_mm2", 0) or 0) or None,
            "application":      row.get("application", "").strip() or None,
            "alloy":            row.get("alloy", "6063-T5").strip(),
            "surface":          row.get("surface", "Anodizado").strip(),
            "tags":             tags,
            "popular":          str(row.get("popular", "false")).lower() == "true",
            "description":      row.get("description", "").strip() or None,
            "company_id":       row.get("company_id") or company_id,
            "line_id":          row.get("line_id") or line_id,
        }

        if not payload["name"]:
            table.add_row("—", "—", "[red]Nome vazio, pulado[/red]")
            err += 1
            continue

        if dry_run:
            table.add_row(payload["name"], str(payload["weight_per_meter"]), "[yellow]DRY RUN[/yellow]")
            ok += 1
            continue

        try:
            sb.table("profiles").insert(payload).execute()
            table.add_row(payload["name"], str(payload["weight_per_meter"]), "[green]✓[/green]")
            ok += 1
        except Exception as e:
            table.add_row(payload["name"], "—", f"[red]{str(e)[:40]}[/red]")
            err += 1

    console.print(table)
    console.print(f"\n[green]✓ {ok} perfis importados[/green]  [red]✗ {err} erros[/red]")
    if dry_run:
        console.print("[yellow]Modo DRY RUN — nenhum dado foi inserido.[/yellow]")

if __name__ == "__main__":
    app()
