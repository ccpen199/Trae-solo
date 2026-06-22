import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface ShopState {
  products: any[]
  currentProduct: any | null
  cart: any[]
  fetchProducts: (filters?: any) => Promise<void>
  fetchProduct: (id: number) => Promise<void>
  addToCart: (productId: number, quantity: number) => Promise<void>
  fetchCart: () => Promise<void>
  removeFromCart: (id: number) => Promise<void>
  placeOrder: () => Promise<void>
}

export const useShopStore = create<ShopState>((set) => ({
  products: [],
  currentProduct: null,
  cart: [],

  fetchProducts: async (filters?: any) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const data = await apiFetch(`/shop/products${query}`)
    set({ products: data.products || data })
  },

  fetchProduct: async (id: number) => {
    const data = await apiFetch(`/shop/products/${id}`)
    set({ currentProduct: data.product || data })
  },

  addToCart: async (productId: number, quantity: number) => {
    await apiFetch('/shop/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    })
  },

  fetchCart: async () => {
    const data = await apiFetch('/shop/cart')
    set({ cart: data.cart || data })
  },

  removeFromCart: async (id: number) => {
    await apiFetch(`/shop/cart/${id}`, {
      method: 'DELETE',
    })
  },

  placeOrder: async () => {
    await apiFetch('/shop/orders', {
      method: 'POST',
    })
  },
}))
