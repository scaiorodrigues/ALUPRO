import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../types'

interface AuthState {
  user:       AppUser | null
  session:    any | null
  loading:    boolean
  isAdmin:    boolean
  setSession: (session: any) => void
  signIn:     (email: string, password: string) => Promise<void>
  signOut:    () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, session: null, loading: true, isAdmin: false,

  setSession: (session) => {
    const meta    = session?.user?.user_metadata ?? {}
    const isAdmin = meta.role === 'admin' || meta.is_admin === true
    set({
      session, isAdmin,
      loading: false,
      user: session?.user ? {
        id: session.user.id, email: session.user.email ?? '',
        is_admin: isAdmin, approved: meta.approved === true || isAdmin,
      } : null,
    })
  },

  signIn: async (email, password) => {
    // Demo mode — admin@aluminio.com / admin123
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
      const isAdmin = email === 'admin@aluminio.com' && password === 'admin123'
      if (!email || !password) throw new Error('Preencha email e senha.')
      set({
        loading: false, isAdmin,
        session: { user: { id: '1', email, user_metadata: { role: isAdmin ? 'admin' : 'user', approved: true } } },
        user: { id: '1', email, is_admin: isAdmin, approved: true },
      })
      return
    }
    set({ loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ loading: false }); throw error }
    get().setSession(data.session)
  },

  signOut: async () => {
    await supabase.auth.signOut().catch(() => {})
    set({ user: null, session: null, isAdmin: false, loading: false })
  },
}))
