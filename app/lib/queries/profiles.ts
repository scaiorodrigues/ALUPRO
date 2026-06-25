import { supabase } from '../supabase'
import type { Profile, ProfileFormData } from '../../types'

// ─── Leitura ───────────────────────────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*), line:product_lines(*)')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*), line:product_lines(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getPopularProfiles(limit = 10): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('popular', true)
    .order('name')
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .or(
      `name.ilike.%${query}%,` +
      `application.ilike.%${query}%`
    )
    .order('name')
    .limit(40)
  if (error) throw error
  return data ?? []
}

export async function getSimilarProfiles(profileId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('similar_profiles')
    .select('similar:profiles!similar_id(*, company:companies(*))')
    .eq('profile_id', profileId)
    .order('score', { ascending: false })
    .limit(5)
  if (error) throw error
  return (data ?? []).map((r: any) => r.similar).filter(Boolean)
}

// ─── Escrita (admin) ──────────────────────────────────────────────────────────

export async function createProfile(payload: Partial<ProfileFormData>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(id: string, payload: Partial<ProfileFormData>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
}

// ─── Upload de imagem (Storage) ───────────────────────────────────────────────

export async function uploadDrawing(
  uri: string,
  profileName: string
): Promise<string> {
  const ext      = uri.split('.').pop() ?? 'png'
  const filename = `${profileName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${ext}`
  const path     = `dxf/${filename}`

  const response = await fetch(uri)
  const blob     = await response.blob()
  const buffer   = await blob.arrayBuffer()

  const { error } = await supabase.storage
    .from('profile-drawings')
    .upload(path, buffer, {
      contentType: `image/${ext}`,
      upsert: true,
    })
  if (error) throw error

  const { data } = supabase.storage
    .from('profile-drawings')
    .getPublicUrl(path)

  return data.publicUrl
}
