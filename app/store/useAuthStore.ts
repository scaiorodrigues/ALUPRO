import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../types'

interface AuthState {
  user:     AppUser | null
  session:  any | null
  loading:  boolean
  isAdmin:  boolean
  setSession: (session: any) => void
  signIn:   (email: string, password: string) => Promise<void>
  signOut:  () => Promise<void>
  refresh:  () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:    null,
  session: null,
  loading: true,
  isAdmin: false,

  setSession: (session) => {
    const meta    = session?.user?.user_metadata ?? {}
    const isAdmin = meta.role === 'admin' || meta.is_admin === true
    set({
      session,
      isAdmin,
      user: session?.user
        ? {
            id:         session.user.id,
            email:      session.user.email ?? '',
            is_admin:   isAdmin,
            approved:   meta.approved === true || isAdmin,
            created_at: session.user.created_at ?? '',
          }
        : null,
      loading: false,
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ loading: false }); throw error }
    get().setSession(data.session)
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isAdmin: false, loading: false })
  },

  refresh: async () => {
    const { data } = await supabase.auth.getSession()
    get().setSession(data.session)
  },
}))
