<template>
  <div class="min-h-screen bg-pdd-bg">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 flex items-center gap-2">
      <button @click="$router.back()" class="text-xl">←</button>
      <div class="flex-1 bg-gray-100 rounded-full flex items-center px-3 py-2">
        <span class="text-gray-400 mr-2">🔍</span>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索商品"
          class="flex-1 bg-transparent text-sm outline-none"
          @keyup.enter="doSearch"
          autofocus
        />
        <button v-if="keyword" @click="keyword = ''" class="text-gray-400 text-lg">✕</button>
      </div>
      <button @click="doSearch" class="text-pdd-red text-sm font-medium">搜索</button>
    </div>

    <div v-if="!hasSearched" class="bg-white px-3 py-3">
      <h3 class="font-medium mb-2">热门搜索</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in hotTags"
          :key="tag"
          @click="keyword = tag; doSearch()"
          class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <div v-else-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else-if="products.length === 0" class="py-10">
      <Empty icon="🔍" text="没有找到相关商品" />
    </div>

    <div v-else class="px-3 py-3">
      <div class="flex items-center gap-2 mb-3 overflow-x-auto">
        <button
          v-for="(sort, key) in sortOptions"
          :key="key"
          @click="currentSort = key; doSearch()"
          class="px-3 py-1 rounded-full text-sm whitespace-nowrap"
          :class="currentSort === key ? 'bg-pdd-red text-white' : 'bg-white text-gray-600'"
        >
          {{ sort }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @update:favorite="handleFavoriteUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { homeApi } from '../api'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()

const keyword = ref('')
const products = ref([])
const loading = ref(false)
const hasSearched = ref(false)
const currentSort = ref('sales')

const hotTags = ['iPhone', '连衣裙', '零食', '面膜', '运动鞋', '奶粉', '口红', '平板']
const sortOptions = {
  sales: '销量优先',
  price_asc: '价格升序',
  price_desc: '价格降序',
  newest: '最新发布'
}

async function doSearch() {
  if (!keyword.value && !route.query.categoryId) return
  
  loading.value = true
  hasSearched.value = true
  
  try {
    const res = await homeApi.searchProducts({
      keyword: keyword.value,
      categoryId: route.query.categoryId,
      sort: currentSort.value,
      pageSize: 50
    })
    if (res.success) {
      products.value = res.data?.list || []
    }
  } catch (e) {
    console.error('搜索失败:', e)
  } finally {
    loading.value = false
  }
}

function handleFavoriteUpdate({ productId, isFavorite }) {
  const index = products.value.findIndex(p => p.id === productId)
  if (index > -1) {
    products.value[index].is_favorite = isFavorite
  }
}

onMounted(() => {
  if (route.query.categoryId) {
    doSearch()
  }
})
</script>
