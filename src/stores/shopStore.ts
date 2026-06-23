import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface ShopState {
  products: any[]
  currentProduct: any | null
  cart: any[]
  loading: boolean
  fetchProducts: (filters?: any) => Promise<void>
  fetchProduct: (id: number) => Promise<void>
  addToCart: (productId: number, quantity: number) => Promise<void>
  fetchCart: () => Promise<void>
  removeFromCart: (id: number) => Promise<void>
  updateCartItem: (id: number, quantity: number) => Promise<void>
  placeOrder: () => Promise<void>
}

export const useShopStore = create<ShopState>((set, get) => ({
  products: [],
  currentProduct: null,
  cart: [],
  loading: false,

  fetchProducts: async (filters?: any) => {
    set({ loading: true })
    try {
      const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
      const data = await apiFetch(`/shop/products${query}`)
      set({ products: data.data?.data || data.data || data })
    } finally {
      set({ loading: false })
    }
  },

  fetchProduct: async (id: number) => {
    set({ loading: true })
    try {
      const data = await apiFetch(`/shop/products/${id}`)
      set({ currentProduct: data.data?.data || data.data || data })
    } finally {
      set({ loading: false })
    }
  },

  addToCart: async (productId: number, quantity: number) => {
    set({ loading: true })
    try {
      await apiFetch('/shop/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity }),
      })
      await get().fetchCart()
    } finally {
      set({ loading: false })
    }
  },

  fetchCart: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch('/shop/cart')
      set({ cart: data.data?.data || data.data || data })
    } finally {
      set({ loading: false })
    }
  },

  removeFromCart: async (id: number) => {
    await apiFetch(`/shop/cart/${id}`, {
      method: 'DELETE',
    })
    await get().fetchCart()
  },

  updateCartItem: async (id: number, quantity: number) => {
    set({ loading: true })
    try {
      await apiFetch(`/shop/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      })
      await get().fetchCart()
    } finally {
      set({ loading: false })
    }
  },

  placeOrder: async () => {
    set({ loading: true })
    try {
      await apiFetch('/shop/order', {
        method: 'POST',
      })
      await get().fetchCart()
    } finally {
      set({ loading: false })
    }
  },
}))
