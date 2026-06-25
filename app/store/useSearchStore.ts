import { create } from 'zustand'

interface SearchState {
  query:        string
  history:      string[]
  setQuery:     (q: string) => void
  addHistory:   (q: string) => void
  clearHistory: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '', history: [],
  setQuery:     (q) => set({ query: q }),
  addHistory:   (q) => {
    const t = q.trim(); if (!t) return
    set(s => ({ history: [t, ...s.history.filter(h => h !== t)].slice(0, 8) }))
  },
  clearHistory: () => set({ history: [] }),
}))
