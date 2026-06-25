import { supabase } from '../supabase'
import { MOCK_COMPANIES } from '../mockData'
import type { Company } from '../../types'

const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL

export async function getCompanies(): Promise<Company[]> {
  if (IS_DEMO) return MOCK_COMPANIES
  const { data, error } = await supabase
    .from('companies').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
