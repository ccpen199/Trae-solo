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

export const useBreedingStore = create<BreedingState>((set) => ({
  breedings: [],
  currentBreeding: null,

  fetchBreedings: async (filters?: any) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const data = await apiFetch(`/breedings${query}`)
    set({ breedings: data.breedings || data })
  },

  fetchBreeding: async (id: number) => {
    const data = await apiFetch(`/breedings/${id}`)
    set({ currentBreeding: data.breeding || data })
  },

  createBreeding: async (data: any) => {
    await apiFetch('/breedings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getMatches: async (id: number) => {
    const data = await apiFetch(`/breedings/${id}/matches`)
    return data.matches || data
  },

  createEscrow: async (id: number, amount: number) => {
    await apiFetch(`/breedings/${id}/escrow`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  },

  completeBreeding: async (id: number) => {
    await apiFetch(`/breedings/${id}/complete`, {
      method: 'POST',
    })
  },
}))
