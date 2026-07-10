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
  code: string | null
  weight_per_meter: number
  area_mm2: number | null
  application: string | null
  drawing_url: string | null
  dxf_url: string | null
  technical_pdf: string | null
  alloy: string | null
  surface: string | null
  tags: string[]
  popular: boolean
  description: string | null
  created_at: string
  updated_at: string
  company?: Company
  line?: ProductLine
}

export interface SimilarProfile {
  profile_id: string
  similar_id: string
  score: number
  similar?: Profile
}

export interface AppUser {
  id: string
  email: string
  is_admin: boolean
  approved: boolean
}

export interface ProfileFormData {
  name: string
  code: string
  company_id: string
  line_id: string
  application: string
  weight_per_meter: number
  area_mm2: number | null
  alloy: string
  surface: string
  tags: string
  description: string
  popular: boolean
  drawing_url?: string
}
