<template>
  <div
    class="bg-white rounded-lg overflow-hidden shadow-sm"
    @click="$router.push(`/product/${product?.id}`)"
  >
    <div class="relative">
      <img
        :src="product?.image"
        :alt="product?.name"
        class="w-full aspect-square object-cover"
        loading="lazy"
      />
      <div
        v-if="product?.is_buy === 1"
        class="absolute top-2 left-2 bg-pdd-red text-white text-xs px-2 py-0.5 rounded"
      >
        百亿补贴
      </div>
    </div>
    <div class="p-2">
      <h3 class="text-sm text-gray-800 line-clamp-2 min-h-[36px]">{{ product?.name }}</h3>
      <div class="flex items-end gap-1 mt-1">
        <span class="text-pdd-red text-lg font-bold">¥{{ product?.price?.toFixed?.(2) || product?.price }}</span>
        <span v-if="product?.original_price" class="text-gray-400 text-xs line-through mb-0.5">¥{{ product?.original_price?.toFixed?.(2) || product?.original_price }}</span>
      </div>
      <div class="flex items-center justify-between mt-1">
        <span class="text-gray-400 text-xs">已拼{{ formatSales(product?.sales) }}件</span>
        <button
          @click.stop="toggleFavorite"
          class="text-xl"
          :class="product?.is_favorite ? 'text-pdd-red' : 'text-gray-300'"
        >
          {{ product?.is_favorite ? '❤️' : '🤍' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToast } from '../stores/toast'
import { productApi } from '../api'

const props = defineProps({
  product: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:favorite'])

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

function formatSales(sales) {
  if (!sales) return '0'
  if (sales >= 10000) {
    return (sales / 10000).toFixed(1) + '万'
  }
  return sales.toString()
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  
  try {
    const res = await productApi.toggleFavorite(props.product.id)
    if (res.success) {
      emit('update:favorite', {
        productId: props.product.id,
        isFavorite: res.data.is_favorite
      })
      toast.success(res.data.is_favorite ? '已收藏' : '已取消收藏')
    }
  } catch (e) {
    console.error('收藏失败:', e)
  }
}
</script>
