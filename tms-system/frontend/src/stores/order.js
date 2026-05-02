import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])
  const currentOrder = ref(null)
  const total = ref(0)

  async function fetchOrders(params) {
    const res = await request.get('/orders', { params })
    orders.value = res.data
    total.value = res.total
    return res
  }

  async function fetchOrder(id) {
    const res = await request.get(`/orders/${id}`)
    currentOrder.value = res.data
    return res.data
  }

  async function createOrder(data) {
    return await request.post('/orders', data)
  }

  async function updateOrder(id, data) {
    return await request.put(`/orders/${id}`, data)
  }

  async function deleteOrder(id) {
    return await request.delete(`/orders/${id}`)
  }

  async function importOrders(data) {
    return await request.post('/orders/import', data)
  }

  return {
    orders,
    currentOrder,
    total,
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    importOrders
  }
})
