import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://zpgonnhpokdxdljhflph.supabase.co'

const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_yTDVBh7i8CsYFl8hN0S5KQ_CTFPPAKS'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export const SUPABASE_STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/profile-drawings`
