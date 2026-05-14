<template>
  <div class="tab-bar safe-area-bottom">
    <div 
      v-for="item in tabs" 
      :key="item.path"
      class="tab-item"
      :class="{ active: currentPath === item.path }"
      @click="handleClick(item.path)"
    >
      <span class="icon">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/category', label: '分类', icon: '📋' },
  { path: '/cart', label: '购物车', icon: '🛒' },
  { path: '/orders', label: '订单', icon: '📦' },
  { path: '/profile', label: '我的', icon: '👤' }
]

const currentPath = computed(() => {
  const path = route.path
  if (path.startsWith('/category')) return '/category'
  if (path.startsWith('/product')) return '/'
  if (path.startsWith('/order')) return '/orders'
  if (path === '/checkout') return '/cart'
  return path
})

function handleClick(path) {
  router.push(path)
}
</script>