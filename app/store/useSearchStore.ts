import { create } from 'zustand'

const MAX_HISTORY = 8

interface SearchState {
  query:    string
  history:  string[]
  setQuery: (q: string) => void
  addHistory: (q: string) => void
  clearHistory: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query:   '',
  history: [],

  setQuery: (q) => set({ query: q }),

  addHistory: (q) => {
    const term = q.trim()
    if (!term) return
    set((s) => ({
      history: [term, ...s.history.filter((h) => h !== term)].slice(0, MAX_HISTORY),
    }))
  },

  clearHistory: () => set({ history: [] }),
}))
