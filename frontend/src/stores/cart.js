import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartAPI } from '../api'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
  })

  const totalCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  async function loadCart() {
    try {
      const res = await cartAPI.getCart()
      if (res.success) {
        items.value = res.data
      }
    } catch (err) {
      console.error('加载购物车失败:', err)
    }
  }

  async function addItem(product_id, quantity, spec) {
    try {
      const res = await cartAPI.addToCart({ product_id, quantity, spec })
      if (res.success) {
        await loadCart()
      }
      return res
    } catch (err) {
      return err
    }
  }

  async function updateItem(id, quantity) {
    try {
      const res = await cartAPI.updateCart(id, { quantity })
      if (res.success) {
        await loadCart()
      }
      return res
    } catch (err) {
      return err
    }
  }

  async function removeItem(id) {
    try {
      const res = await cartAPI.deleteCart(id)
      if (res.success) {
        await loadCart()
      }
      return res
    } catch (err) {
      return err
    }
  }

  async function clearCart() {
    try {
      const res = await cartAPI.clearCart()
      if (res.success) {
        items.value = []
      }
      return res
    } catch (err) {
      return err
    }
  }

  function clearLocal() {
    items.value = []
  }

  return { items, totalPrice, totalCount, loadCart, addItem, updateItem, removeItem, clearCart, clearLocal }
})