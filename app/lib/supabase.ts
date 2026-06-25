import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const SUPABASE_URL  = Constants.expoConfig?.extra?.supabaseUrl
  ?? process.env.EXPO_PUBLIC_SUPABASE_URL
  ?? ''

const SUPABASE_KEY  = Constants.expoConfig?.extra?.supabaseAnonKey
  ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[Supabase] Credenciais não configuradas — operando em modo demo.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
