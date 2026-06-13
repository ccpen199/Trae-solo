import { create } from 'zustand'
import { apiGet, apiPost } from '@/utils/api'

interface OrderState {
  orders: any[]
  currentOrder: any | null
  currentTickets: any[]
  loading: boolean
  fetchOrders: (status?: string) => Promise<void>
  fetchOrderDetail: (id: number) => Promise<void>
  createOrder: (data: { showtimeId: number; seatIds: number[]; paymentMethod: 'direct' | 'credit' }) => Promise<any>
  requestRefund: (orderId: number, ticketId: number, reason: string, reasonCategory: string) => Promise<any>
}

const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  currentTickets: [],
  loading: false,

  fetchOrders: async (status) => {
    set({ loading: true })
    try {
      const q = status ? `?status=${status}` : ''
      const data = await apiGet<any>(`/orders${q}`)
      set({ orders: data || [], loading: false })
    } catch (e) {
      set({ loading: false })
    }
  },

  fetchOrderDetail: async (id) => {
    set({ loading: true })
    try {
      const data = await apiGet<any>(`/orders/${id}`)
      set({ currentOrder: data.order, currentTickets: data.tickets, loading: false })
    } catch (e) {
      set({ loading: false })
    }
  },

  createOrder: async (data) => {
    const result = await apiPost<any>('/orders', data)
    return result
  },

  requestRefund: async (orderId, ticketId, reason, reasonCategory) => {
    const result = await apiPost<any>(`/orders/${orderId}/refund`, { ticketId, reason, reasonCategory })
    return result
  },
}))

export default useOrderStore
