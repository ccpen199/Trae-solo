import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface BreedingState {
  breedings: any[]
  currentBreeding: any | null
  fetchBreedings: (filters?: any) => Promise<void>
  fetchBreeding: (id: number) => Promise<void>
  createBreeding: (data: any) => Promise<void>
  getMatches: (id: number) => Promise<any[]>
  createEscrow: (id: number, amount: number) => Promise<void>
  completeBreeding: (id: number) => Promise<void>
}

export const useBreedingStore = create<BreedingState>((set, get) => ({
  breedings: [],
  currentBreeding: null,

  fetchBreedings: async (filters?: any) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const data = await apiFetch(`/breeding${query}`)
    const r = data.data?.data || data.data || data
    set({ breedings: Array.isArray(r) ? r : [] })
  },

  fetchBreeding: async (id: number) => {
    const data = await apiFetch(`/breeding/${id}`)
    set({ currentBreeding: data.data?.data || data.data || data })
  },

  createBreeding: async (d: any) => {
    await apiFetch('/breeding', {
      method: 'POST',
      body: JSON.stringify(d),
    })
    await get().fetchBreedings()
  },

  getMatches: async (id: number) => {
    const data = await apiFetch(`/breeding/${id}/match`, {
      method: 'POST',
    })
    return data.data?.data || data.data || data
  },

  createEscrow: async (id: number, amount: number) => {
    await apiFetch(`/breeding/${id}/escrow`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  },

  completeBreeding: async (id: number) => {
    await apiFetch(`/breeding/${id}/complete`, {
      method: 'PUT',
    })
  },
}))
