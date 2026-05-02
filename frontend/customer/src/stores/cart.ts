import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  specifications?: string
  imageUrl?: string
  subtotal: number
  attributes?: {
    vegetarian?: boolean
    spicy?: boolean
    cold?: boolean
    new?: boolean
    recommended?: boolean
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const tableId = ref<string | null>(localStorage.getItem('tableId'))
  const tableNumber = ref<string | null>(localStorage.getItem('tableNumber'))
  const orderId = ref<string | null>(localStorage.getItem('orderId'))

  const totalCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => sum + item.subtotal, 0)
  )

  const setTableInfo = (id: string, number: string) => {
    tableId.value = id
    tableNumber.value = number
    localStorage.setItem('tableId', id)
    localStorage.setItem('tableNumber', number)
  }

  const setOrderId = (id: string) => {
    orderId.value = id
    localStorage.setItem('orderId', id)
  }

  const addItem = (
    menuItem: {
      id: string
      name: string
      price: number
      imageUrl?: string
      attributes?: any
    },
    quantity: number = 1,
    specifications?: string
  ) => {
    const existingIndex = items.value.findIndex(
      (item) =>
        item.menuItemId === menuItem.id && item.specifications === specifications
    )

    if (existingIndex > -1) {
      items.value[existingIndex].quantity += quantity
      items.value[existingIndex].subtotal =
        items.value[existingIndex].price * items.value[existingIndex].quantity
    } else {
      const cartItem: CartItem = {
        id: `${menuItem.id}-${Date.now()}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        specifications,
        imageUrl: menuItem.imageUrl,
        subtotal: menuItem.price * quantity,
        attributes: menuItem.attributes,
      }
      items.value.push(cartItem)
    }

    saveToLocalStorage()
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    const index = items.value.findIndex((item) => item.id === itemId)

    if (index > -1) {
      if (quantity <= 0) {
        items.value.splice(index, 1)
      } else {
        items.value[index].quantity = quantity
        items.value[index].subtotal = items.value[index].price * quantity
      }
      saveToLocalStorage()
    }
  }

  const removeItem = (itemId: string) => {
    const index = items.value.findIndex((item) => item.id === itemId)
    if (index > -1) {
      items.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  const clearCart = () => {
    items.value = []
    saveToLocalStorage()
  }

  const saveToLocalStorage = () => {
    if (tableId.value) {
      localStorage.setItem(`cart_${tableId.value}`, JSON.stringify(items.value))
    }
  }

  const loadFromLocalStorage = () => {
    if (tableId.value) {
      const saved = localStorage.getItem(`cart_${tableId.value}`)
      if (saved) {
        try {
          items.value = JSON.parse(saved)
        } catch {
          items.value = []
        }
      }
    }
  }

  const clearSession = () => {
    items.value = []
    tableId.value = null
    tableNumber.value = null
    orderId.value = null
    localStorage.removeItem('tableId')
    localStorage.removeItem('tableNumber')
    localStorage.removeItem('orderId')
  }

  const hasItems = computed(() => items.value.length > 0)

  return {
    items,
    tableId,
    tableNumber,
    orderId,
    totalCount,
    totalAmount,
    hasItems,
    setTableInfo,
    setOrderId,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    loadFromLocalStorage,
    clearSession,
  }
})
