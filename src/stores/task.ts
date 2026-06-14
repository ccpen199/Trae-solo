import { create } from 'zustand'

export interface Task {
  id: string
  publisher_id: string
  assignee_id: string | null
  title: string
  description: string
  category: 'physical' | 'online' | 'skill'
  tags: string[]
  bounty_type: 'coins' | 'cash'
  bounty_amount: number
  deadline: string
  geo_fence: Record<string, unknown>
  verify_rules: string[]
  status: 'open' | 'in_progress' | 'verifying' | 'completed' | 'disputed' | 'cancelled'
  exposure_weight: number
  view_count: number
  publisher_nickname: string
  publisher_avatar: string
  publisher_credit_level: string
  created_at: string
  updated_at: string
}

interface TaskFilters {
  category: string
  keyword: string
  tag: string
  sort: string
  page: number
  city: string
}

interface TaskState {
  tasks: Task[]
  currentTask: Task | null
  total: number
  page: number
  totalPages: number
  filters: TaskFilters
  loading: boolean
  fetchTasks: (filters?: Partial<TaskFilters>) => Promise<void>
  fetchTaskById: (id: string) => Promise<void>
  createTask: (data: Record<string, unknown>) => Promise<Task | null>
  acceptTask: (id: string) => Promise<boolean>
  completeTask: (id: string, evidence?: { type: string; data: string }[]) => Promise<boolean>
  rateTask: (id: string, data: { rating: number; comment: string; type: string }) => Promise<boolean>
  verifyTask: (id: string, data: { approved: boolean; comment: string }) => Promise<boolean>
  setFilters: (filters: Partial<TaskFilters>) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  total: 0,
  page: 1,
  totalPages: 0,
  filters: { category: '', keyword: '', tag: '', sort: 'hot', page: 1, city: '' },
  loading: false,

  fetchTasks: async (newFilters) => {
    const filters = { ...get().filters, ...newFilters }
    set({ loading: true, filters })
    try {
      const params = new URLSearchParams()
      params.set('page', String(filters.page))
      params.set('limit', '10')
      if (filters.category) params.set('category', filters.category)
      if (filters.keyword) params.set('keyword', filters.keyword)
      if (filters.tag) params.set('tag', filters.tag)
      if (filters.sort) params.set('sort', filters.sort)
      if (filters.city) params.set('city', filters.city)
      const res = await fetch(`/api/tasks?${params}`)
      const json = await res.json()
      if (json.success) {
        set({
          tasks: json.data.items,
          total: json.data.total,
          page: json.data.page,
          totalPages: json.data.totalPages,
        })
      }
    } catch {
      // ignore
    } finally {
      set({ loading: false })
    }
  },

  fetchTaskById: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/tasks/${id}`)
      const json = await res.json()
      if (json.success) {
        set({ currentTask: json.data })
      }
    } catch {
      // ignore
    } finally {
      set({ loading: false })
    }
  },

  createTask: async (data) => {
    const token = localStorage.getItem('token')
    if (!token) return null
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) return json.data
      return null
    } catch {
      return null
    }
  },

  acceptTask: async (id) => {
    const token = localStorage.getItem('token')
    if (!token) return false
    try {
      const res = await fetch(`/api/tasks/${id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      return json.success
    } catch {
      return false
    }
  },

  completeTask: async (id, evidence) => {
    const token = localStorage.getItem('token')
    if (!token) return false
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ evidence_list: evidence || [] }),
      })
      const json = await res.json()
      return json.success
    } catch {
      return false
    }
  },

  rateTask: async (id, data) => {
    const token = localStorage.getItem('token')
    if (!token) return false
    try {
      const res = await fetch(`/api/tasks/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: data.rating, comment: data.comment, type: data.type }),
      })
      const json = await res.json()
      return json.success
    } catch {
      return false
    }
  },

  verifyTask: async (id, data) => {
    const token = localStorage.getItem('token')
    if (!token) return false
    try {
      const res = await fetch(`/api/tasks/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approved: data.approved, comment: data.comment }),
      })
      const json = await res.json()
      return json.success
    } catch {
      return false
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }))
  },
}))
