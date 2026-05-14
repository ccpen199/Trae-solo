<template>
  <div class="min-h-screen bg-pdd-bg">
    <div class="sticky top-0 bg-white z-30 border-b">
      <div class="px-3 py-2 flex items-center">
        <button @click="$router.back()" class="text-xl">←</button>
        <h1 class="flex-1 text-center font-medium">我的订单</h1>
        <div class="w-6"></div>
      </div>
      <div class="flex overflow-x-auto px-3">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="currentTab = tab.key; loadOrders()"
          class="px-4 py-2 text-sm whitespace-nowrap border-b-2"
          :class="currentTab === tab.key ? 'border-pdd-red text-pdd-red font-medium' : 'border-transparent text-gray-500'"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else-if="orders.length === 0" class="py-20">
      <Empty icon="📋" text="暂无订单" />
    </div>

    <div v-else class="px-3 py-2 space-y-2">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white rounded-xl overflow-hidden"
        @click="$router.push(`/order/${order.id}`)"
      >
        <div class="px-3 py-2 flex items-center justify-between border-b">
          <span class="text-sm text-gray-500">订单号: {{ order.order_no }}</span>
          <span class="text-pdd-red text-sm">{{ order.status_text }}</span>
        </div>
        <div class="p-3 flex gap-3">
          <img :src="order.product_image" class="w-20 h-20 object-cover rounded" />
          <div class="flex-1 min-w-0">
            <h3 class="text-sm line-clamp-2">{{ order.product_name }}</h3>
            <div class="flex items-center justify-between mt-2">
              <span class="text-pdd-red font-bold">¥{{ order.total_amount?.toFixed?.(2) || order.total_amount }}</span>
              <span class="text-gray-500 text-sm">x{{ order.quantity }}</span>
            </div>
          </div>
        </div>
        <div class="px-3 py-2 flex justify-end gap-2 border-t">
          <button
            v-if="order.status === 'paid'"
            @click.stop="cancelOrder(order.id)"
            class="px-3 py-1 border rounded text-sm text-gray-500"
          >
            取消订单
          </button>
          <button
            v-if="order.status === 'shipped'"
            @click.stop="confirmOrder(order.id)"
            class="px-3 py-1 bg-pdd-red text-white rounded text-sm"
          >
            确认收货
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../stores/toast'
import { orderApi } from '../api'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'

const route = useRoute()
const toast = useToast()

const tabs = [
  { key: 'all', name: '全部' },
  { key: 'paid', name: '待付款' },
  { key: 'pending', name: '待发货' },
  { key: 'shipped', name: '待收货' },
  { key: 'review', name: '待评价' }
]

const currentTab = ref('all')
const loading = ref(true)
const orders = ref([])

async function loadOrders() {
  loading.value = true
  try {
    const status = currentTab.value === 'all' ? undefined : currentTab.value
    const res = await orderApi.getList(status, 1, 50)
    if (res.success) {
      orders.value = res.data?.list || []
    }
  } catch (e) {
    console.error('加载订单失败:', e)
  } finally {
    loading.value = false
  }
}

async function cancelOrder(orderId) {
  try {
    const res = await orderApi.cancel(orderId)
    if (res.success) {
      toast.success('订单已取消')
      loadOrders()
    }
  } catch (e) {
    console.error('取消订单失败:', e)
  }
}

async function confirmOrder(orderId) {
  try {
    const res = await orderApi.confirm(orderId)
    if (res.success) {
      toast.success('已确认收货')
      loadOrders()
    }
  } catch (e) {
    console.error('确认收货失败:', e)
  }
}

onMounted(() => {
  currentTab.value = route.query.status || 'all'
  loadOrders()
})
</script>
