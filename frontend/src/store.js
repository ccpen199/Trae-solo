import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

export const useCartStore = create((set, get) => ({
  items: [],
  addItem: (product, quantity = 1) => {
    const items = get().items
    const existing = items.find(item => item.id === product.id)
    if (existing) {
      set({
        items: items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      })
    } else {
      set({ items: [...items, { ...product, quantity }] })
    }
  },
  removeItem: (id) => {
    set({ items: get().items.filter(item => item.id !== id) })
  },
  updateQuantity: (id, quantity) => {
    set({
      items: get().items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    })
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },
}))
