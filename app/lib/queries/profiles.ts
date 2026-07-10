import { supabase } from '../supabase'
import { MOCK_PROFILES } from '../mockData'
import type { Profile, ProfileFormData } from '../../types'

const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL

// ── READ ──────────────────────────────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  if (IS_DEMO) return MOCK_PROFILES
  const { data, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*), line:product_lines(*)')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (IS_DEMO) return MOCK_PROFILES.find(p => p.id === id) ?? null
  const { data, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*), line:product_lines(*)')
    .eq('id', id).single()
  if (error) throw error
  return data
}

export async function getPopularProfiles(limit = 6): Promise<Profile[]> {
  if (IS_DEMO) return MOCK_PROFILES.filter(p => p.popular).slice(0, limit)
  const { data, error } = await supabase
    .from('profiles').select('*, company:companies(*)')
    .eq('popular', true).order('name').limit(limit)
  if (error) throw error
  return data ?? []
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (IS_DEMO) {
    const q = query.toLowerCase()
    return MOCK_PROFILES.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.application?.toLowerCase().includes(q) ||
      p.company?.name.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  // Tenta full-text search primeiro (usa search_vector com pesos A/B/C)
  const { data: fts, error: ftsErr } = await supabase
    .from('profiles')
    .select('*, company:companies(*), line:product_lines(*)')
    .textSearch('search_vector', query, { type: 'websearch', config: 'portuguese' })
    .eq('active', true)
    .order('name')
    .limit(40)

  if (!ftsErr && fts && fts.length > 0) return fts

  // Fallback: ilike para termos curtos ou sem match no FTS
  const { data, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*), line:product_lines(*)')
    .or(`name.ilike.%${query}%,application.ilike.%${query}%,code.ilike.%${query}%`)
    .eq('active', true)
    .order('name')
    .limit(40)
  if (error) throw error
  return data ?? []
}

export async function getProfilesByCompany(companyId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*), line:product_lines(*)')
    .eq('company_id', companyId)
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getSimilarProfiles(profileId: string): Promise<Profile[]> {
  if (IS_DEMO) {
    const p = MOCK_PROFILES.find(x => x.id === profileId)
    if (!p) return []
    return MOCK_PROFILES
      .filter(x => x.id !== profileId && (x.line_id === p.line_id || x.company_id === p.company_id))
      .slice(0, 4)
  }
  const { data, error } = await supabase
    .from('similar_profiles')
    .select('similar:profiles!similar_id(*, company:companies(*))')
    .eq('profile_id', profileId).order('score', { ascending: false }).limit(5)
  if (error) throw error
  return (data ?? []).map((r: any) => r.similar).filter(Boolean)
}

// ── WRITE (admin) ─────────────────────────────────────────────────────────────

export async function createProfile(payload: Partial<ProfileFormData>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateProfile(id: string, payload: Partial<ProfileFormData>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles').update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
}

export async function uploadDrawing(uri: string, profileName: string): Promise<string> {
  const ext      = uri.split('.').pop() ?? 'png'
  const filename = `${profileName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${ext}`
  const response = await fetch(uri)
  const blob     = await response.blob()
  const buffer   = await blob.arrayBuffer()
  const { error } = await supabase.storage
    .from('profile-drawings').upload(`dxf/${filename}`, buffer, { contentType: `image/${ext}`, upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('profile-drawings').getPublicUrl(`dxf/${filename}`)
  return data.publicUrl
}
