<template>
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-bottom">
    <div class="flex items-center justify-around py-1">
      <button
        v-for="tab in tabs"
        :key="tab.path"
        @click="goTo(tab.path)"
        class="flex flex-col items-center gap-0.5 py-1 px-3"
      >
        <div class="relative">
          <span class="text-2xl" :class="{ 'text-pdd-red': isActive(tab.path), 'text-gray-400': !isActive(tab.path) }">{{ tab.icon }}</span>
          <span
            v-if="tab.badge && cartCount > 0"
            class="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center"
          >
            {{ cartCount > 99 ? '99+' : cartCount }}
          </span>
        </div>
        <span class="text-xs" :class="{ 'text-pdd-red': isActive(tab.path), 'text-gray-500': !isActive(tab.path) }">{{ tab.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { cartApi } from '../api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const cartCount = ref(0)

const tabs = [
  { name: '首页', path: '/', icon: '🏠', badge: false },
  { name: '关注', path: '/follow', icon: '❤️', badge: false },
  { name: '聊天', path: '/messages', icon: '💬', badge: false },
  { name: '购物车', path: '/cart', icon: '🛒', badge: true },
  { name: '个人中心', path: '/profile', icon: '👤', badge: false }
]

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

function goTo(path) {
  const protectedPaths = ['/follow', '/messages', '/cart', '/profile']
  if (protectedPaths.includes(path) && !userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: path } })
    return
  }
  router.push(path)
}

async function fetchCartCount() {
  if (!userStore.isLoggedIn) {
    cartCount.value = 0
    return
  }
  try {
    const res = await cartApi.getCount()
    if (res.success) {
      cartCount.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('获取购物车数量失败:', e)
  }
}

onMounted(() => {
  fetchCartCount()
})
</script>
