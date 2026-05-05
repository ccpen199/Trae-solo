import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      city: '未识别',
      
      setUser: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),
      setCity: (city) => set({ city }),
      
      isLoggedIn: () => !!get().token,
      isMember: () => get().user?.is_member === 1,
      isVerified: () => get().user?.is_verified === 1
    }),
    {
      name: 'user-storage'
    }
  )
)

const useCartStore = create(
  (set, get) => ({
    cartItems: [],
    totalCount: 0,
    totalAmount: 0,
    
    setCart: (items, totalCount, totalAmount) => set({ 
      cartItems: items, 
      totalCount: totalCount || 0, 
      totalAmount: totalAmount || 0 
    }),
    
    updateItem: (cartId, quantity, selected) => {
      const { cartItems } = get()
      const newItems = cartItems.map(item => {
        if (item.id === cartId) {
          return {
            ...item,
            quantity: quantity !== undefined ? quantity : item.quantity,
            selected: selected !== undefined ? selected : item.selected
          }
        }
        return item
      })
      
      const selectedItems = newItems.filter(item => item.selected)
      const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = selectedItems.reduce((sum, item) => sum + (item.show_price * item.quantity), 0)
      
      set({ 
        cartItems: newItems, 
        totalCount, 
        totalAmount: parseFloat(totalAmount.toFixed(2)) 
      })
    },
    
    removeItem: (cartId) => {
      const { cartItems } = get()
      const newItems = cartItems.filter(item => item.id !== cartId)
      
      const selectedItems = newItems.filter(item => item.selected)
      const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = selectedItems.reduce((sum, item) => sum + (item.show_price * item.quantity), 0)
      
      set({ 
        cartItems: newItems, 
        totalCount, 
        totalAmount: parseFloat(totalAmount.toFixed(2)) 
      })
    },
    
    clearCart: () => set({ cartItems: [], totalCount: 0, totalAmount: 0 })
  })
)

const useAppStore = create(
  (set, get) => ({
    agreementAccepted: false,
    locationEnabled: true,
    networkAvailable: true,
    notificationEnabled: true,
    
    setAgreementAccepted: (accepted) => set({ agreementAccepted: accepted }),
    setLocationEnabled: (enabled) => set({ locationEnabled: enabled }),
    setNetworkAvailable: (available) => set({ networkAvailable: available }),
    setNotificationEnabled: (enabled) => set({ notificationEnabled: enabled }),
    
    initApp: () => {
      const stored = localStorage.getItem('app-settings')
      if (stored) {
        const settings = JSON.parse(stored)
        set(settings)
      }
    },
    
    saveSettings: () => {
      const state = get()
      localStorage.setItem('app-settings', JSON.stringify({
        agreementAccepted: state.agreementAccepted,
        locationEnabled: state.locationEnabled,
        notificationEnabled: state.notificationEnabled
      }))
    }
  })
)

export { useUserStore, useCartStore, useAppStore }
