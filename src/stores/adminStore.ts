import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface AdminState {
  reviewQueue: any[]
  supervisionData: any
  filingRecords: any[]
  users: any[]
  fetchReviewQueue: () => Promise<void>
  reviewContent: (id: number, result: string, reason: string) => Promise<void>
  fetchSupervision: () => Promise<void>
  fetchFilings: () => Promise<void>
  syncFiling: (id: number) => Promise<void>
  fetchUsers: () => Promise<void>
  updateUser: (id: number, data: any) => Promise<void>
}

export const useAdminStore = create<AdminState>((set) => ({
  reviewQueue: [],
  supervisionData: null,
  filingRecords: [],
  users: [],

  fetchReviewQueue: async () => {
    const data = await apiFetch('/admin/reviews')
    set({ reviewQueue: data.reviews || data })
  },

  reviewContent: async (id: number, result: string, reason: string) => {
    await apiFetch(`/admin/reviews/${id}`, {
      method: 'POST',
      body: JSON.stringify({ result, reason }),
    })
  },

  fetchSupervision: async () => {
    const data = await apiFetch('/admin/supervision')
    set({ supervisionData: data })
  },

  fetchFilings: async () => {
    const data = await apiFetch('/admin/filings')
    set({ filingRecords: data.filings || data })
  },

  syncFiling: async (id: number) => {
    await apiFetch(`/admin/filings/${id}/sync`, {
      method: 'POST',
    })
  },

  fetchUsers: async () => {
    const data = await apiFetch('/admin/users')
    set({ users: data.users || data })
  },

  updateUser: async (id: number, data: any) => {
    await apiFetch(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}))
