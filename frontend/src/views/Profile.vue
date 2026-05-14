<template>
  <div class="min-h-screen bg-pdd-bg pb-16">
    <div class="bg-pdd-red px-3 py-6">
      <div v-if="userStore.isLoggedIn && userStore.user" class="flex items-center gap-3">
        <img :src="userStore.user.avatar" class="w-16 h-16 rounded-full border-2 border-white" />
        <div class="flex-1">
          <h2 class="text-white font-medium text-lg">{{ userStore.user.nickname }}</h2>
          <p class="text-white/70 text-sm mt-1">拼多多用户</p>
        </div>
        <button @click="$router.push('/settings')" class="text-white text-2xl">⚙️</button>
      </div>
      <div v-else class="flex items-center gap-3" @click="$router.push('/login')">
        <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <span class="text-3xl">👤</span>
        </div>
        <div class="flex-1">
          <h2 class="text-white font-medium text-lg">点击登录</h2>
          <p class="text-white/70 text-sm mt-1">登录后查看更多内容</p>
        </div>
      </div>
    </div>

    <div class="bg-white -mt-4 mx-3 rounded-xl p-4">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-lg">💰</span>
        <span class="font-medium">我的订单</span>
        <button @click="goToOrders('all')" class="ml-auto text-gray-400 text-sm">查看全部 →</button>
      </div>
      <div class="grid grid-cols-5 gap-2">
        <button @click="goToOrders('paid')" class="flex flex-col items-center">
          <span class="text-2xl">💳</span>
          <span class="text-xs text-gray-600 mt-1">待付款</span>
        </button>
        <button @click="goToOrders('pending')" class="flex flex-col items-center">
          <span class="text-2xl">📦</span>
          <span class="text-xs text-gray-600 mt-1">待发货</span>
        </button>
        <button @click="goToOrders('shipped')" class="flex flex-col items-center">
          <span class="text-2xl">🚚</span>
          <span class="text-xs text-gray-600 mt-1">待收货</span>
        </button>
        <button @click="goToOrders('review')" class="flex flex-col items-center">
          <span class="text-2xl">⭐</span>
          <span class="text-xs text-gray-600 mt-1">待评价</span>
        </button>
        <button @click="goToOrders('refund')" class="flex flex-col items-center">
          <span class="text-2xl">↩️</span>
          <span class="text-xs text-gray-600 mt-1">退换/售后</span>
        </button>
      </div>
    </div>

    <div class="bg-white mt-2 mx-3 rounded-xl p-4">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-lg">🎁</span>
        <span class="font-medium">省钱月卡</span>
      </div>
      <div class="flex items-center gap-4 text-center">
        <div class="flex-1">
          <div class="text-pdd-red font-bold text-xl">10</div>
          <div class="text-xs text-gray-400 mt-1">优惠券</div>
        </div>
        <div class="flex-1">
          <div class="text-pdd-red font-bold text-xl">5</div>
          <div class="text-xs text-gray-400 mt-1">免单卡</div>
        </div>
        <div class="flex-1">
          <div class="text-pdd-red font-bold text-xl">3</div>
          <div class="text-xs text-gray-400 mt-1">免费试用</div>
        </div>
        <button @click="goToActivity('/cash')" class="ml-auto px-4 py-1 bg-pdd-red text-white rounded-full text-xs">
          开通月卡
        </button>
      </div>
    </div>

    <div class="bg-white mt-2 mx-3 rounded-xl p-4">
      <div class="grid grid-cols-4 gap-4">
        <button @click="goToActivity('/orchard')" class="flex flex-col items-center">
          <span class="text-3xl">🌳</span>
          <span class="text-xs text-gray-600 mt-1">多多果园</span>
        </button>
        <button @click="goToActivity('/bargain')" class="flex flex-col items-center">
          <span class="text-3xl">🔪</span>
          <span class="text-xs text-gray-600 mt-1">砍价免费拿</span>
        </button>
        <button @click="goToActivity('/cash')" class="flex flex-col items-center">
          <span class="text-3xl">💵</span>
          <span class="text-xs text-gray-600 mt-1">天天领现金</span>
        </button>
        <button @click="goToActivity('/game')" class="flex flex-col items-center">
          <span class="text-3xl">🎮</span>
          <span class="text-xs text-gray-600 mt-1">多多爱消除</span>
        </button>
      </div>
    </div>

    <div class="bg-white mt-2 mx-3 rounded-xl p-4">
      <div class="grid grid-cols-4 gap-4">
        <button @click="goToActivity('/address')" class="flex flex-col items-center">
          <span class="text-2xl">📍</span>
          <span class="text-xs text-gray-600 mt-1">收货地址</span>
        </button>
        <button @click="goToActivity('/favorite')" class="flex flex-col items-center">
          <span class="text-2xl">❤️</span>
          <span class="text-xs text-gray-600 mt-1">我的收藏</span>
        </button>
        <button @click="goToActivity('/coupon')" class="flex flex-col items-center">
          <span class="text-2xl">🎟️</span>
          <span class="text-xs text-gray-600 mt-1">优惠券</span>
        </button>
        <button @click="goToActivity('/contact')" class="flex flex-col items-center">
          <span class="text-2xl">💬</span>
          <span class="text-xs text-gray-600 mt-1">客服</span>
        </button>
      </div>
    </div>

    <div v-if="userStore.isLoggedIn" class="bg-white mt-2 mx-3 rounded-xl p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📤</span>
          <span class="text-gray-700">退出登录</span>
        </div>
        <button @click="doLogout" class="text-pdd-red text-sm">退出</button>
      </div>
    </div>

    <div class="bg-white mt-2 mx-3 rounded-xl p-4">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-lg">🔥</span>
        <span class="font-medium">精选推荐</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <ProductCard
          v-for="product in recommends"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { homeApi } from '../api'
import TabBar from '../components/TabBar.vue'
import ProductCard from '../components/ProductCard.vue'

const router = useRouter()
const userStore = useUserStore()

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

function goToOrders(status) {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: '/orders' } })
    return
  }
  router.push({ name: 'Orders', query: { status } })
}

function goToActivity(path) {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: path } })
    return
  }
  router.push(path)
}

function doLogout() {
  userStore.logout()
  router.push('/')
}

onMounted(() => {
  loadRecommends()
})
</script>
