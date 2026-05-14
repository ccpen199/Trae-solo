<template>
  <div class="bottom-nav">
    <div 
      v-for="item in navItems" 
      :key="item.path"
      class="nav-item"
      :class="{ active: currentPath === item.path }"
      @click="navigate(item.path)"
    >
      <component :is="item.icon" class="nav-icon" />
      <span class="nav-text">{{ item.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Home, Grid, Edit, ShoppingCart, User } from 'lucide-vue-next'

const router = useRouter()
const currentPath = computed(() => router.currentRoute.value.path)

const navItems = [
  { path: '/', text: '首页', icon: Home },
  { path: '/category', text: '分类', icon: Grid },
  { path: '/publish', text: '发布', icon: Edit },
  { path: '/cart', text: '购物车', icon: ShoppingCart },
  { path: '/profile', text: '我的', icon: User }
]

function navigate(path) {
  router.push(path)
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  transition: all 0.3s;
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: #999;
  transition: color 0.3s;
}

.nav-text {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  transition: color 0.3s;
}

.nav-item.active .nav-icon,
.nav-item.active .nav-text {
  color: #2563eb;
}
</style>