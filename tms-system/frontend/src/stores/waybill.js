import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useWaybillStore = defineStore('waybill', () => {
  const waybills = ref([])
  const currentWaybill = ref(null)
  const total = ref(0)

  async function fetchWaybills(params) {
    const res = await request.get('/waybills', { params })
    waybills.value = res.data
    total.value = res.total
    return res
  }

  async function fetchWaybill(id) {
    const res = await request.get(`/waybills/${id}`)
    currentWaybill.value = res.data
    return res.data
  }

  async function createWaybill(data) {
    return await request.post('/waybills', data)
  }

  async function updateWaybill(id, data) {
    return await request.put(`/waybills/${id}`, data)
  }

  async function updateStatus(id, status) {
    return await request.post(`/waybills/${id}/status`, { status })
  }

  return {
    waybills,
    currentWaybill,
    total,
    fetchWaybills,
    fetchWaybill,
    createWaybill,
    updateWaybill,
    updateStatus
  }
})
