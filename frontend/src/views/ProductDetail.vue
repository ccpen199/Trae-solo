<template>
  <div class="min-h-screen bg-pdd-bg pb-20">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 flex items-center gap-3 border-b">
      <button @click="$router.back()" class="text-xl">←</button>
      <h1 class="flex-1 text-center font-medium">商品详情</h1>
      <button @click="toggleFavorite" class="text-xl">
        {{ product?.is_favorite ? '❤️' : '🤍' }}
      </button>
    </div>

    <div v-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else-if="error" class="py-10">
      <Empty icon="😵" text="加载失败" :showRetry="true" @retry="loadData" />
    </div>

    <div v-else-if="product">
      <div class="bg-white">
        <div class="w-full aspect-square">
          <img :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
        </div>
        <div class="px-3 py-3">
          <div class="flex items-end gap-2">
            <span class="text-pdd-red text-2xl font-bold">¥{{ product.price?.toFixed?.(2) || product.price }}</span>
            <span class="text-gray-400 text-sm line-through pb-1">¥{{ product.original_price?.toFixed?.(2) || product.original_price }}</span>
          </div>
          <h2 class="text-lg font-medium mt-2">{{ product.name }}</h2>
          <div class="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span>已拼{{ formatSales(product.sales) }}件</span>
            <span>{{ product.shop_name }}</span>
          </div>
        </div>
      </div>

      <div v-if="groups?.length > 0" class="bg-white mt-2 px-3 py-3">
        <h3 class="font-medium mb-2">正在拼单</h3>
        <div class="space-y-2">
          <div
            v-for="group in groups"
            :key="group.id"
            class="flex items-center gap-3 py-2"
          >
            <img :src="group.initiator_avatar" class="w-10 h-10 rounded-full" />
            <div class="flex-1">
              <div class="text-sm">{{ group.initiator_nickname || '用户' }} 正在拼单</div>
              <div class="text-xs text-gray-400">还差{{ group.total_count - group.current_count }}人成团</div>
            </div>
            <button
              @click="joinGroup(group.id)"
              class="px-3 py-1 bg-pdd-red text-white text-sm rounded-full"
            >
              去拼单
            </button>
          </div>
        </div>
      </div>

      <div v-if="product.shop" class="bg-white mt-2 px-3 py-3">
        <div class="flex items-center gap-3">
          <img :src="product.shop.avatar" class="w-12 h-12 rounded-full" />
          <div class="flex-1">
            <div class="font-medium">{{ product.shop.name }}</div>
            <div class="text-xs text-gray-400">{{ product.shop.followers }} 粉丝</div>
          </div>
          <button
            @click="toggleFollow"
            class="px-4 py-1 text-sm rounded-full border"
            :class="product.shop.is_follow ? 'border-gray-300 text-gray-500' : 'border-pdd-red text-pdd-red'"
          >
            {{ product.shop.is_follow ? '已关注' : '+ 关注' }}
          </button>
        </div>
      </div>

      <div class="bg-white mt-2 px-3 py-3">
        <h3 class="font-medium mb-2">商品详情</h3>
        <p class="text-sm text-gray-600">{{ product.description }}</p>
        <div v-if="product.images?.length > 0" class="mt-3 space-y-2">
          <img
            v-for="(img, index) in product.images"
            :key="index"
            :src="img"
            class="w-full rounded"
          />
        </div>
      </div>

      <div v-if="product.relatedProducts?.length > 0" class="bg-white mt-2 px-3 py-3">
        <h3 class="font-medium mb-2">猜你喜欢</h3>
        <div class="grid grid-cols-2 gap-2">
          <ProductCard
            v-for="p in product.relatedProducts"
            :key="p.id"
            :product="p"
          />
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 bg-white border-t z-40 px-3 py-2 safe-bottom">
      <div class="flex items-center gap-3">
        <button
          @click="goToCart"
          class="flex flex-col items-center min-w-[50px]"
        >
          <span class="text-xl">🛒</span>
          <span class="text-xs text-gray-500">购物车</span>
        </button>
        <button
          @click="goToChat"
          class="flex flex-col items-center min-w-[50px]"
        >
          <span class="text-xl">💬</span>
          <span class="text-xs text-gray-500">客服</span>
        </button>
        <div class="flex-1 flex gap-2">
          <button
            @click="startGroup"
            class="flex-1 py-3 bg-orange-500 text-white text-sm font-medium rounded-l-full"
          >
            发起拼单 ¥{{ product?.price?.toFixed?.(2) || product?.price }}
          </button>
          <button
            @click="buyNow"
            class="flex-1 py-3 bg-pdd-red text-white text-sm font-medium rounded-r-full"
          >
            单独购买 ¥{{ (product?.price * 1.1)?.toFixed?.(2) || (product?.price * 1.1) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToast } from '../stores/toast'
import { productApi, groupApi, cartApi, followApi } from '../api'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const loading = ref(true)
const error = ref(false)
const product = ref(null)
const groups = ref([])

function formatSales(sales) {
  if (!sales) return '0'
  if (sales >= 10000) {
    return (sales / 10000).toFixed(1) + '万'
  }
  return sales.toString()
}

async function loadData() {
  loading.value = true
  error.value = false
  
  try {
    const productRes = await productApi.getDetail(route.params.id)
    if (productRes.success) {
      product.value = productRes.data
    }

    try {
      const groupsRes = await groupApi.getList(route.params.id)
      if (groupsRes.success) {
        groups.value = groupsRes.data?.list || []
      }
    } catch (e) {
      console.error('获取拼单列表失败:', e)
    }
  } catch (e) {
    console.error('加载商品详情失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  
  try {
    const res = await productApi.toggleFavorite(route.params.id)
    if (res.success) {
      product.value.is_favorite = res.data.is_favorite
      toast.success(res.data.is_favorite ? '已收藏' : '已取消收藏')
    }
  } catch (e) {
    console.error('收藏失败:', e)
  }
}

async function toggleFollow() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  
  try {
    const res = await followApi.toggle(product.value.shop.id)
    if (res.success) {
      product.value.shop.is_follow = res.data.is_follow
      toast.success(res.data.is_follow ? '已关注' : '已取消关注')
    }
  } catch (e) {
    console.error('关注失败:', e)
  }
}

async function startGroup() {
  if (!userStore.isLoggedIn) {
    toast.warning('请先登录')
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  if (!product.value?.id) {
    toast.warning('商品信息加载中，请稍候')
    return
  }
  
  try {
    toast.info('正在创建拼单...')
    const res = await groupApi.create(product.value.id, 2)
    if (res.success) {
      router.push({ name: 'Checkout', query: { productId: product.value.id, type: 'group', groupId: res.data.id } })
    }
  } catch (e) {
    console.error('创建拼单失败:', e)
    toast.error('创建拼单失败，请重试')
  }
}

function joinGroup(groupId) {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  router.push({ name: 'Checkout', query: { productId: product.value.id, type: 'group', groupId } })
}

function buyNow() {
  if (!userStore.isLoggedIn) {
    toast.warning('请先登录')
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  if (!product.value?.id) {
    toast.warning('商品信息加载中，请稍候')
    return
  }
  toast.info('正在跳转结算页...')
  router.push({ name: 'Checkout', query: { productId: product.value.id, type: 'normal' } })
}

function goToCart() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: '/cart' } })
    return
  }
  router.push('/cart')
}

function goToChat() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  toast.info('客服功能开发中')
}

onMounted(() => {
  loadData()
})

watch(() => route.params.id, () => {
  loadData()
})
</script>
