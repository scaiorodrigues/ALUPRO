import { supabase } from '../supabase'
import type { Profile } from '../../types'

export async function getFavorites(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('profile:profiles(*, company:companies(*), line:product_lines(*))')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((r: any) => r.profile).filter(Boolean)
}

export async function getFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('profile_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((r: any) => r.profile_id)
}

export async function addFavorite(userId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, profile_id: profileId })
  if (error && !error.message.includes('duplicate')) throw error
}

export async function removeFavorite(userId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('profile_id', profileId)
  if (error) throw error
}
