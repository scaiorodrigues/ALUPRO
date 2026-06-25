// ─── Tipos principais do ALUPRO ───────────────────────────────────────────────

export interface Company {
  id: string
  name: string
  logo_url: string | null
  website: string | null
  updated_at: string
}

export interface ProductLine {
  id: string
  company_id: string
  name: string
  description: string | null
}

export interface Profile {
  id: string
  company_id: string
  line_id: string | null
  name: string
  weight_per_meter: number        // kg/m
  application: string | null
  drawing_url: string | null      // URL SVG/PNG no Supabase Storage
  technical_pdf: string | null
  tags: string[]
  popular: boolean
  description: string | null
  created_at: string
  updated_at: string
  // joins opcionais
  company?: Company
  line?: ProductLine
}

export interface SimilarProfile {
  profile_id: string
  similar_id: string
  score: number                   // 0–1
  similar?: Profile
}

export interface SearchHistoryItem {
  id: string
  user_id: string
  query: string
  searched_at: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string
  email: string
  is_admin: boolean
  approved: boolean
  created_at: string
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface ProfileFormData {
  name: string
  company_id: string
  line_id: string
  application: string
  weight_per_meter: number
  tags: string
  description: string
  popular: boolean
  drawing_url?: string
}
