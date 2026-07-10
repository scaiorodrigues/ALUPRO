import { supabase } from '../supabase'
import { MOCK_COMPANIES } from '../mockData'
import type { Company, ProductLine } from '../../types'

const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL

export async function getCompanies(): Promise<Company[]> {
  if (IS_DEMO) return MOCK_COMPANIES
  const { data, error } = await supabase
    .from('companies').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function getProductLines(companyId?: string): Promise<ProductLine[]> {
  let q = supabase.from('product_lines').select('*').order('name')
  if (companyId) q = q.eq('company_id', companyId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
