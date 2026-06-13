import { create } from 'zustand'
import { apiGet, apiPost } from '@/utils/api'

interface QueueState {
  queueId: string | null
  position: number
  status: 'idle' | 'waiting' | 'processing' | 'success' | 'failed'
  estimatedWait: number
  priorityWeight: number
  orderId: number | null
  joinQueue: (showtimeId: number, seatIds: number[]) => Promise<void>
  fetchStatus: () => Promise<void>
  boost: (type: 'member' | 'credit' | 'invite', value: number) => Promise<void>
  reset: () => void
}

const useQueueStore = create<QueueState>((set, get) => ({
  queueId: null,
  position: 0,
  status: 'idle',
  estimatedWait: 0,
  priorityWeight: 1.0,
  orderId: null,

  joinQueue: async (showtimeId, seatIds) => {
    try {
      const data = await apiPost<any>('/queue/join', { showtimeId, seatIds })
      set({
        queueId: data.queueId,
        position: data.position,
        estimatedWait: data.estimatedWait,
        priorityWeight: data.priorityWeight,
        status: 'waiting',
      })
    } catch (e: any) {
      set({ status: 'failed' })
      throw e
    }
  },

  fetchStatus: async () => {
    const { queueId } = get()
    if (!queueId) return
    try {
      const data = await apiGet<any>(`/queue/${queueId}/status`)
      set({
        position: data.position,
        status: data.status,
        estimatedWait: data.estimatedWait,
        priorityWeight: data.priorityWeight,
        orderId: data.orderId || null,
      })
    } catch (e) {}
  },

  boost: async (type, value) => {
    const { queueId } = get()
    if (!queueId) return
    try {
      const data = await apiPost<any>(`/queue/${queueId}/boost`, { type, value })
      set({ position: data.newPosition, priorityWeight: data.priority })
    } catch (e) {}
  },

  reset: () => {
    set({
      queueId: null,
      position: 0,
      status: 'idle',
      estimatedWait: 0,
      priorityWeight: 1.0,
      orderId: null,
    })
  },
}))

export default useQueueStore
