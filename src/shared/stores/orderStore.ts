import { create } from 'zustand'
import type { SwapOrder, Reservation, Package as PackageType } from '@shared/types'
import { mockOrders, mockReservations, mockPackages } from '@mock/data'

interface OrderStore {
  orders: SwapOrder[]
  reservations: Reservation[]
  packages: PackageType[]
  currentOrder: SwapOrder | null
  addOrder: (order: SwapOrder) => void
  completeOrder: (orderId: string) => void
  addReservation: (reservation: Reservation) => void
  cancelReservation: (reservationId: string) => void
  useReservation: (reservationId: string) => void
  getActiveReservation: () => Reservation | undefined
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: mockOrders,
  reservations: mockReservations,
  packages: mockPackages,
  currentOrder: null,
  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
      currentOrder: order,
    })),
  completeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.order_id === orderId
          ? { ...o, status: 'completed', completed_at: new Date().toISOString() }
          : o
      ),
      currentOrder: null,
    })),
  addReservation: (reservation) =>
    set((state) => ({
      reservations: [reservation, ...state.reservations],
    })),
  cancelReservation: (reservationId) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.reservation_id === reservationId ? { ...r, status: 'expired' } : r
      ),
    })),
  useReservation: (reservationId) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.reservation_id === reservationId ? { ...r, status: 'used' } : r
      ),
    })),
  getActiveReservation: () =>
    get().reservations.find(
      (r) => r.status === 'active' && new Date(r.expire_time) > new Date()
    ),
}))
