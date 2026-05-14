import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('cart') || '[]'))
  const merchantId = ref(null)

  const totalCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

  function addItem(product) {
    const existingItem = items.value.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      items.value.push({
        ...product,
        quantity: 1
      })
    }
    merchantId.value = product.merchant_id
    saveToStorage()
  }

  function removeItem(productId) {
    const index = items.value.findIndex(item => item.id === productId)
    if (index > -1) {
      items.value.splice(index, 1)
    }
    if (items.value.length === 0) {
      merchantId.value = null
    }
    saveToStorage()
  }

  function updateQuantity(productId, quantity) {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      if (quantity <= 0) {
        removeItem(productId)
      } else {
        item.quantity = quantity
      }
    }
    saveToStorage()
  }

  function clearCart() {
    items.value = []
    merchantId.value = null
    saveToStorage()
  }

  function saveToStorage() {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  return { items, merchantId, totalCount, totalPrice, addItem, removeItem, updateQuantity, clearCart }
})