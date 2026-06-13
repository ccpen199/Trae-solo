import { create } from 'zustand'
import { apiGet, apiPost } from '@/utils/api'

interface OrganizerState {
  organizer: any | null
  application: any | null
  events: any[]
  loading: boolean
  applyOrganizer: (data: { companyName: string; license: string; contactName: string; contactPhone: string; documents: string[] }) => Promise<any>
  fetchOrganizer: () => Promise<void>
  fetchOrganizerEvents: () => Promise<void>
}

const useOrganizerStore = create<OrganizerState>((set, get) => ({
  organizer: null,
  application: null,
  events: [],
  loading: false,

  applyOrganizer: async (data) => {
    return await apiPost<any>('/organizers/apply', data)
  },

  fetchOrganizer: async () => {
    set({ loading: true })
    try {
      const data = await apiGet<any>('/organizers/me')
      if (data) {
        set({ organizer: data.organizer, application: data.application, loading: false })
      } else {
        set({ organizer: null, application: null, loading: false })
      }
    } catch (e) {
      set({ loading: false })
    }
  },

  fetchOrganizerEvents: async () => {
    try {
      const { organizer } = get()
      if (!organizer) return
      let q = ''
      const data = await apiGet<any>(`/events?${q}`)
      set({ events: data.events || [] })
    } catch (e) {}
  },
}))

export default useOrganizerStore
