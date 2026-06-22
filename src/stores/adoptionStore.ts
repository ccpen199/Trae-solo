import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface AdoptionState {
  adoptions: any[]
  currentAdoption: any | null
  fetchAdoptions: (filters?: any) => Promise<void>
  fetchAdoption: (id: number) => Promise<void>
  createAdoption: (data: any) => Promise<void>
  applyAdoption: (id: number, data: any) => Promise<void>
  confirmHandover: (id: number) => Promise<void>
}

export const useAdoptionStore = create<AdoptionState>((set) => ({
  adoptions: [],
  currentAdoption: null,

  fetchAdoptions: async (filters?: any) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const data = await apiFetch(`/adoptions${query}`)
    set({ adoptions: data.adoptions || data })
  },

  fetchAdoption: async (id: number) => {
    const data = await apiFetch(`/adoptions/${id}`)
    set({ currentAdoption: data.adoption || data })
  },

  createAdoption: async (data: any) => {
    await apiFetch('/adoptions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  applyAdoption: async (id: number, data: any) => {
    await apiFetch(`/adoptions/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  confirmHandover: async (id: number) => {
    await apiFetch(`/adoptions/${id}/handover`, {
      method: 'POST',
    })
  },
}))
