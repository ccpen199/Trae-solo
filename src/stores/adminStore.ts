import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface AdminState {
  reviewQueue: any[]
  supervisionData: any
  filings: any[]
  users: any[]
  fetchReviewQueue: () => Promise<void>
  reviewContent: (id: number, result: string, reason: string) => Promise<void>
  fetchSupervision: () => Promise<void>
  fetchFilings: () => Promise<void>
  syncFiling: () => Promise<void>
  fetchUsers: () => Promise<void>
  updateUser: (id: number, data: any) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  reviewQueue: [],
  supervisionData: null,
  filings: [],
  users: [],

  fetchReviewQueue: async () => {
    const data = await apiFetch('/admin/review-queue')
    set({ reviewQueue: data.data || data })
  },

  reviewContent: async (id: number, result: string, reason: string) => {
    await apiFetch(`/admin/review/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ result, reason }),
    })
    await get().fetchReviewQueue()
  },

  fetchSupervision: async () => {
    const data = await apiFetch('/admin/supervision')
    set({ supervisionData: data.data || data })
  },

  fetchFilings: async () => {
    const data = await apiFetch('/admin/filing')
    set({ filings: data.data || data })
  },

  syncFiling: async () => {
    await apiFetch('/admin/filing/sync', {
      method: 'POST',
    })
    await get().fetchFilings()
  },

  fetchUsers: async () => {
    const data = await apiFetch('/admin/users')
    set({ users: data.data || data })
  },

  updateUser: async (id: number, data: any) => {
    await apiFetch(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    await get().fetchUsers()
  },
}))
