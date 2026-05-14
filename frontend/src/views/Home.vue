<template>
  <div class="min-h-screen bg-pdd-bg pb-16">
    <div class="sticky top-0 bg-pdd-red z-30 px-3 py-2">
      <div class="flex items-center gap-2">
        <div
          class="flex-1 bg-white rounded-full flex items-center px-3 py-2"
          @click="$router.push('/search')"
        >
          <span class="text-gray-400 mr-2">🔍</span>
          <span class="text-gray-400 text-sm">搜索商品、店铺</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else-if="error" class="py-10">
      <Empty icon="😵" text="加载失败" :showRetry="true" @retry="loadData" />
    </div>

    <div v-else>
      <div class="bg-pdd-red px-3 pb-3">
        <div class="relative overflow-hidden rounded-lg bg-white">
          <div
            class="flex transition-transform duration-500"
            :style="{ transform: `translateX(-${currentBanner * 100}%)` }"
          >
            <div
              v-for="(banner, index) in banners"
              :key="banner.id"
              class="min-w-full"
            >
              <img
                :src="banner.image"
                :alt="banner.title"
                class="w-full h-32 object-cover"
              />
            </div>
          </div>
          <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            <div
              v-for="(_, index) in banners"
              :key="index"
              class="w-1.5 h-1.5 rounded-full"
              :class="currentBanner === index ? 'bg-pdd-red' : 'bg-white/50'"
            ></div>
          </div>
        </div>
      </div>

      <div class="bg-white px-3 py-3">
        <div class="flex overflow-x-auto gap-2 -mx-3 px-3 scrollbar-hide">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="flex flex-col items-center min-w-[60px]"
            @click="goToCategory(cat.id)"
          >
            <span class="text-2xl">{{ cat.icon }}</span>
            <span class="text-xs text-gray-600 mt-1">{{ cat.name }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white mt-2 px-3 py-3">
        <div class="grid grid-cols-5 gap-2">
          <div
            v-for="icon in activityIcons"
            :key="icon.id"
            class="flex flex-col items-center"
            @click="goToActivity(icon.link)"
          >
            <span class="text-2xl">{{ icon.icon }}</span>
            <span class="text-xs text-gray-600 mt-1">{{ icon.name }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white mt-2 px-3 py-3">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xl">💰</span>
          <span class="font-bold text-lg">百亿补贴</span>
          <span class="text-xs text-gray-400">大牌低价</span>
        </div>
        <div class="flex overflow-x-auto gap-3 -mx-3 px-3 scrollbar-hide">
          <div
            v-for="product in buyProducts"
            :key="product.id"
            class="min-w-[120px] bg-gray-50 rounded-lg overflow-hidden"
            @click="$router.push(`/product/${product.id}`)"
          >
            <img :src="product.image" :alt="product.name" class="w-full h-24 object-cover" />
            <div class="p-2">
              <p class="text-xs text-gray-800 line-clamp-1">{{ product.name }}</p>
              <p class="text-pdd-red font-bold text-sm mt-1">¥{{ product.price?.toFixed?.(2) || product.price }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white mt-2 px-3 py-3">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xl">🔥</span>
          <span class="font-bold text-lg">为你推荐</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <ProductCard
            v-for="product in hotProducts"
            :key="product.id"
            :product="product"
            @update:favorite="handleFavoriteUpdate"
          />
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToast } from '../stores/toast'
import { homeApi } from '../api'
import TabBar from '../components/TabBar.vue'
import ProductCard from '../components/ProductCard.vue'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const loading = ref(true)
const error = ref(false)
const banners = ref([])
const categories = ref([])
const activityIcons = ref([])
const buyProducts = ref([])
const hotProducts = ref([])
const currentBanner = ref(0)

let bannerTimer = null

async function loadData() {
  loading.value = true
  error.value = false
  
  try {
    const res = await homeApi.getIndex()
    if (res.success) {
      banners.value = res.data?.banners || []
      categories.value = res.data?.categories || []
      activityIcons.value = res.data?.activityIcons || []
      buyProducts.value = res.data?.buyProducts || []
      hotProducts.value = res.data?.hotProducts || []
    }
  } catch (e) {
    console.error('加载首页数据失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

function startBannerAutoPlay() {
  bannerTimer = setInterval(() => {
    if (banners.value.length > 0) {
      currentBanner.value = (currentBanner.value + 1) % banners.value.length
    }
  }, 3000)
}

function goToCategory(categoryId) {
  router.push({ name: 'Search', query: { categoryId } })
}

function goToActivity(link) {
  if (!link) return
  
  const protectedPaths = ['/orchard', '/bargain', '/cash']
  if (protectedPaths.includes(link) && !userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: link } })
    return
  }
  
  router.push(link)
}

function handleFavoriteUpdate({ productId, isFavorite }) {
  const index = hotProducts.value.findIndex(p => p.id === productId)
  if (index > -1) {
    hotProducts.value[index].is_favorite = isFavorite
  }
}

onMounted(() => {
  loadData()
  startBannerAutoPlay()
})

onUnmounted(() => {
  if (bannerTimer) {
    clearInterval(bannerTimer)
  }
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
