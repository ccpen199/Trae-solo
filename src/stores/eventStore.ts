import { create } from 'zustand'
import { apiGet } from '@/utils/api'

interface Event {
  id: number
  organizerId: number
  title: string
  category: 'concert' | 'drama' | 'talkshow' | 'other'
  description: string
  venue: string
  poster: string
  status: string
  createdAt: string
}

interface Showtime {
  id: number
  eventId: number
  startTime: string
  saleStartTime: string
  presaleStartTime: string | null
  totalSeats: number
  availableSeats: number
  status: string
}

interface EventState {
  events: Event[]
  currentEvent: Event | null
  showtimes: Showtime[]
  total: number
  loading: boolean
  fetchEvents: (params?: { category?: string; keyword?: string; page?: number }) => Promise<void>
  fetchEventDetail: (id: number) => Promise<void>
}

const useEventStore = create<EventState>((set) => ({
  events: [],
  currentEvent: null,
  showtimes: [],
  total: 0,
  loading: false,

  fetchEvents: async (params) => {
    set({ loading: true })
    try {
      let q = ''
      if (params?.category) q += `category=${params.category}&`
      if (params?.keyword) q += `keyword=${encodeURIComponent(params.keyword)}&`
      if (params?.page) q += `page=${params.page}&`
      const data = await apiGet<any>(`/events?${q}`)
      set({ events: data.events, total: data.total, loading: false })
    } catch (e: any) {
      set({ loading: false })
    }
  },

  fetchEventDetail: async (id) => {
    set({ loading: true })
    try {
      const data = await apiGet<any>(`/events/${id}`)
      set({ currentEvent: data.event, showtimes: data.showtimes, loading: false })
    } catch (e) {
      set({ loading: false })
    }
  },
}))

export default useEventStore
