import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orderApi, riderApi, dashboardApi } from '@/api'

export const useAppStore = defineStore('app', () => {
  const orders = ref([])
  const riders = ref([])
  const stats = ref(null)
  const loading = ref(false)

  const pendingOrders = computed(() => 
    orders.value.filter(o => o.status === 'pending')
  )

  const activeOrders = computed(() => 
    orders.value.filter(o => ['matched', 'picking'].includes(o.status))
  )

  async function fetchOrders(params = {}) {
    loading.value = true
    try {
      const res = await orderApi.list(params)
      orders.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchRiders() {
    const res = await riderApi.list()
    riders.value = res.data
  }

  async function fetchStats() {
    const res = await dashboardApi.getStats()
    stats.value = res
  }

  return {
    orders,
    riders,
    stats,
    loading,
    pendingOrders,
    activeOrders,
    fetchOrders,
    fetchRiders,
    fetchStats
  }
})
