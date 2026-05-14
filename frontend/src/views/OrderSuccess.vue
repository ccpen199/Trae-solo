<template>
  <div class="min-h-screen bg-pdd-bg">
    <div class="bg-white px-3 py-2 flex items-center">
      <button @click="$router.replace('/')" class="text-xl">←</button>
      <h1 class="flex-1 text-center font-medium">支付成功</h1>
      <div class="w-6"></div>
    </div>

    <div class="px-6 py-10 text-center">
      <div class="text-6xl mb-4">✅</div>
      <h2 class="text-xl font-medium mb-2">支付成功</h2>
      <p class="text-gray-500">您的订单已支付，商家将尽快发货</p>
      <p class="text-gray-400 text-sm mt-1">订单号: {{ orderId }}</p>
    </div>

    <div class="bg-white mx-3 rounded-xl p-4">
      <div class="grid grid-cols-3 gap-4">
        <button @click="$router.push('/orders')" class="flex flex-col items-center">
          <span class="text-2xl">📋</span>
          <span class="text-sm text-gray-600 mt-1">查看订单</span>
        </button>
        <button @click="$router.push('/')" class="flex flex-col items-center">
          <span class="text-2xl">🏠</span>
          <span class="text-sm text-gray-600 mt-1">继续购物</span>
        </button>
        <button @click="$router.push('/chat')" class="flex flex-col items-center">
          <span class="text-2xl">💬</span>
          <span class="text-sm text-gray-600 mt-1">联系客服</span>
        </button>
      </div>
    </div>

    <div class="bg-white mt-3 mx-3 rounded-xl p-4">
      <h3 class="font-medium mb-3">为您推荐</h3>
      <div class="grid grid-cols-2 gap-2">
        <ProductCard
          v-for="product in recommends"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { homeApi } from '../api'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()
const orderId = ref('')
const recommends = ref([])

async function loadRecommends() {
  try {
    const res = await homeApi.searchProducts({ pageSize: 4 })
    if (res.success) {
      recommends.value = res.data?.list || []
    }
  } catch (e) {
    console.error('加载推荐商品失败:', e)
  }
}

onMounted(() => {
  orderId.value = route.query.orderId || ''
  loadRecommends()
})
</script>
