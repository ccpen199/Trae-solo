import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface AdoptionState {
  adoptions: any[]
  stats: any
  currentAdoption: any | null
  filingRecord: any | null
  fetchAdoptions: (filters?: any) => Promise<void>
  fetchAdoption: (id: number) => Promise<void>
  createAdoption: (data: any) => Promise<void>
  applyAdoption: (id: number, data: any) => Promise<void>
  reviewApplication: (adoptionId: number, applicationId: number, status: string) => Promise<void>
  confirmHandover: (id: number, applicantId: number) => Promise<void>
  fetchFilingRecord: (adoptionId: number) => Promise<void>
}

export const useAdoptionStore = create<AdoptionState>((set, get) => ({
  adoptions: [],
  stats: null,
  currentAdoption: null,
  filingRecord: null,

  fetchAdoptions: async (filters?: any) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const data = await apiFetch(`/adoption${query}`)
    const result = data.data?.data || data.data || data
    if (result.list && result.stats) {
      set({ adoptions: result.list, stats: result.stats })
    } else {
      set({ adoptions: Array.isArray(result) ? result : [] })
    }
  },

  fetchAdoption: async (id: number) => {
    const data = await apiFetch(`/adoption/${id}`)
    set({ currentAdoption: data.data?.data || data.data || data })
  },

  createAdoption: async (data: any) => {
    await apiFetch('/adoption', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    await get().fetchAdoptions()
  },

  applyAdoption: async (id: number, data: any) => {
    await apiFetch(`/adoption/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    await get().fetchAdoption(id)
  },

  reviewApplication: async (adoptionId: number, applicationId: number, status: string) => {
    await apiFetch(`/adoption/${adoptionId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, application_id: applicationId }),
    })
    await get().fetchAdoption(adoptionId)
  },

  confirmHandover: async (id: number, applicantId: number) => {
    await apiFetch(`/adoption/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ applicant_id: applicantId }),
    })
    await get().fetchAdoption(id)
  },

  fetchFilingRecord: async (adoptionId: number) => {
    const data = await apiFetch(`/adoption/${adoptionId}/flow`)
    set({ filingRecord: data.data?.data || data.data || data })
  },
}))
