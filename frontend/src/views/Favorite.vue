<template>
  <div class="min-h-screen bg-pdd-bg">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 border-b flex items-center">
      <button @click="$router.back()" class="text-xl">←</button>
      <h1 class="flex-1 text-center font-medium">我的收藏</h1>
      <div class="w-6"></div>
    </div>

    <div v-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else-if="favorites.length === 0" class="py-20">
      <Empty icon="❤️" text="暂无收藏商品" />
    </div>

    <div v-else class="p-3 grid grid-cols-2 gap-2">
      <ProductCard
        v-for="item in favorites"
        :key="item.id"
        :product="item.product || item"
        @update:favorite="handleFavoriteUpdate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { favoriteApi } from '../api'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'
import ProductCard from '../components/ProductCard.vue'

const loading = ref(true)
const favorites = ref([])

async function loadFavorites() {
  loading.value = true
  try {
    const res = await favoriteApi.getList()
    if (res.success) {
      favorites.value = res.data || []
    }
  } catch (e) {
    console.error('加载收藏列表失败:', e)
  } finally {
    loading.value = false
  }
}

function handleFavoriteUpdate({ productId, isFavorite }) {
  if (!isFavorite) {
    favorites.value = favorites.value.filter(f => (f.product_id || f.id) !== productId)
  }
}

onMounted(() => {
  loadFavorites()
})
</script>
