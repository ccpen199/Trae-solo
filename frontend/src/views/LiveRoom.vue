<template>
  <div class="min-h-screen bg-black">
    <div class="relative">
      <div class="w-full aspect-video bg-gradient-to-br from-purple-900 to-pdd-red flex items-center justify-center">
        <div class="text-center text-white">
          <div class="text-6xl mb-4">📺</div>
          <p>直播画面</p>
          <p class="text-white/60 text-sm mt-2">{{ liveData?.title || '直播中...' }}</p>
        </div>
      </div>
      <button @click="$router.back()" class="absolute top-3 left-3 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white">
        ←
      </button>
      <div class="absolute top-3 left-12 flex items-center gap-2 bg-black/30 rounded-full px-3 py-1">
        <img :src="liveData?.shop_avatar || 'https://picsum.photos/24/24?random=shop'" class="w-6 h-6 rounded-full" />
        <span class="text-white text-sm">{{ liveData?.shop_name || '主播' }}</span>
      </div>
      <div class="absolute top-3 right-3 bg-black/30 rounded-full px-3 py-1 text-white text-sm">
        {{ liveData?.viewers || 1234 }} 人观看
      </div>
    </div>

    <div class="bg-white p-3">
      <div class="flex items-center gap-3">
        <img :src="liveData?.shop_avatar || 'https://picsum.photos/40/40?random=shop'" class="w-10 h-10 rounded-full" />
        <div class="flex-1">
          <div class="font-medium">{{ liveData?.shop_name || '直播间' }}</div>
          <div class="text-xs text-gray-500">{{ liveData?.followers || 10000 }} 粉丝</div>
        </div>
        <button class="px-4 py-1 bg-pdd-red text-white rounded-full text-sm">
          + 关注
        </button>
      </div>
    </div>

    <div class="bg-white mt-2 p-3">
      <h3 class="font-medium mb-2">直播讲解商品</h3>
      <div class="flex overflow-x-auto gap-3 -mx-3 px-3">
        <div
          v-for="(product, index) in liveData?.products || []"
          :key="product.id || index"
          class="min-w-[120px] bg-gray-50 rounded-lg overflow-hidden cursor-pointer"
          @click="showProductDetail(product)"
        >
          <img :src="product.image" class="w-full h-24 object-cover" />
          <div class="p-2">
            <p class="text-xs line-clamp-1">{{ product.name }}</p>
            <p class="text-pdd-red font-bold text-sm">¥{{ product.price?.toFixed?.(2) || product.price }}</p>
          </div>
        </div>
        <div
          v-if="(liveData?.products?.length || 0) === 0"
          v-for="i in 5"
          :key="i"
          class="min-w-[120px] bg-gray-50 rounded-lg overflow-hidden"
        >
          <div class="w-full h-24 bg-gradient-to-br from-pdd-red/20 to-pdd-red/10 flex items-center justify-center">
            <span class="text-3xl">🎁</span>
          </div>
          <div class="p-2">
            <p class="text-xs line-clamp-1">直播商品 {{ i }}</p>
            <p class="text-pdd-red font-bold text-sm">¥{{ 9.9 + i * 10 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex items-center gap-2 safe-bottom">
      <input
        v-model="message"
        type="text"
        placeholder="说点什么..."
        class="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm"
      />
      <button class="w-10 h-10 bg-pdd-red rounded-full flex items-center justify-center text-white">
        ❤️
      </button>
      <button class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
        🎁
      </button>
    </div>

    <div v-if="showProductModal" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-auto">
        <div class="sticky top-0 bg-white p-3 border-b flex items-center justify-between">
          <h3 class="font-medium">商品详情</h3>
          <button @click="showProductModal = false" class="text-xl">✕</button>
        </div>
        <div v-if="selectedProduct" class="p-4">
          <img :src="selectedProduct.image" class="w-full h-48 object-cover rounded-lg" />
          <h4 class="font-medium mt-3">{{ selectedProduct.name }}</h4>
          <div class="text-pdd-red font-bold text-xl mt-2">¥{{ selectedProduct.price?.toFixed?.(2) || selectedProduct.price }}</div>
          <div class="text-gray-400 text-sm mt-1 line-through">¥{{ selectedProduct.original_price?.toFixed?.(2) || selectedProduct.original_price }}</div>
          <div class="text-sm text-gray-500 mt-2">已售 {{ selectedProduct.sales }} 件</div>
          <p class="text-sm text-gray-600 mt-3">{{ selectedProduct.description }}</p>
          <div class="flex gap-2 mt-4">
            <button @click="showProductModal = false" class="flex-1 py-2 border border-gray-300 rounded-full text-sm">
              取消
            </button>
            <button @click="buyProduct(selectedProduct)" class="flex-1 py-2 bg-pdd-red text-white rounded-full text-sm">
              立即购买
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../stores/toast'
import { liveApi } from '../api'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const message = ref('')
const liveData = ref(null)
const showProductModal = ref(false)
const selectedProduct = ref(null)

async function loadLiveData() {
  try {
    const res = await liveApi.getDetail(route.params.id)
    if (res.success) {
      liveData.value = res.data
    }
  } catch (e) {
    console.error('加载直播详情失败:', e)
  }
}

function showProductDetail(product) {
  selectedProduct.value = product
  showProductModal.value = true
}

function buyProduct(product) {
  showProductModal.value = false
  router.push(`/product/${product.id}`)
}

onMounted(() => {
  loadLiveData()
})
</script>
