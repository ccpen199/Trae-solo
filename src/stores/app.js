import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isLoggedIn = ref(false)
  const location = ref('位置不详')
  const cartItems = ref([])
  const coupons = ref([
    { id: 1, name: '新人专享', discount: 20, minAmount: 100, expire: '2024-12-31' },
    { id: 2, name: '满减优惠', discount: 50, minAmount: 300, expire: '2024-12-31' },
    { id: 3, name: '生鲜特惠', discount: 15, minAmount: 50, expire: '2024-12-31' },
  ])
  const favorites = ref([])
  const userInfo = ref({
    name: '用户昵称',
    avatar: '',
    memberLevel: '普通会员',
    points: 2350,
  })
  const orders = ref([
    { id: 'DD20240101001', status: 'pending', items: [], total: 128.50, time: '2024-01-01 14:30' },
    { id: 'DD20240102002', status: 'delivering', items: [], total: 89.00, time: '2024-01-02 10:15' },
    { id: 'DD20240103003', status: 'completed', items: [], total: 256.80, time: '2024-01-03 16:45' },
  ])

  const login = () => {
    isLoggedIn.value = true
  }

  const logout = () => {
    isLoggedIn.value = false
  }

  const setLocation = (loc) => {
    location.value = loc
  }

  const addToCart = (item) => {
    const existing = cartItems.value.find(i => i.id === item.id)
    if (existing) {
      existing.quantity += item.quantity || 1
    } else {
      cartItems.value.push({ ...item, quantity: item.quantity || 1 })
    }
  }

  const removeFromCart = (itemId) => {
    cartItems.value = cartItems.value.filter(i => i.id !== itemId)
  }

  const updateCartQuantity = (itemId, quantity) => {
    const item = cartItems.value.find(i => i.id === itemId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(itemId)
      } else {
        item.quantity = quantity
      }
    }
  }

  const clearCart = () => {
    cartItems.value = []
  }

  const toggleFavorite = (itemId) => {
    const index = favorites.value.indexOf(itemId)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(itemId)
    }
  }

  const cartTotal = () => {
    return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const cartCount = () => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  }

  return {
    isLoggedIn,
    location,
    cartItems,
    coupons,
    favorites,
    userInfo,
    orders,
    login,
    logout,
    setLocation,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    toggleFavorite,
    cartTotal,
    cartCount,
  }
})
