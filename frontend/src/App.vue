<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>全屋定制</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" mode="vertical">
          <el-menu-item index="/" @click="navigate('/')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/demands" @click="navigate('/demands')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>需求管理</span>
          </el-menu-item>
          <el-menu-item index="/orders" @click="navigate('/orders')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/production" @click="navigate('/production')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="11" width="12" height="11" rx="2"></rect>
              <circle cx="12" cy="5" r="3"></circle>
              <path d="M9 17h6"></path>
            </svg>
            <span>生产管理</span>
          </el-menu-item>
          <el-menu-item index="/installations" @click="navigate('/installations')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
              <path d="M15 2v4h4M7 10h2M7 14h2M7 18h2"></path>
            </svg>
            <span>安装管理</span>
          </el-menu-item>
        </el-menu>
      </nav>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeMenu = ref('/')

onMounted(() => {
  activeMenu.value = router.currentRoute.value.path || '/'
})

watch(() => router.currentRoute.value.path, (newPath) => {
  activeMenu.value = newPath || '/'
})

const navigate = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
}

.logo svg {
  color: #60a5fa;
}

.sidebar-nav {
  flex: 1;
  padding: 10px;
}

.sidebar-nav :deep(.el-menu) {
  background: transparent;
  border-right: none;
}

.sidebar-nav :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 4px;
  border-radius: 8px;
}

.sidebar-nav :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-nav :deep(.el-menu-item.is-active) {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.main-content {
  flex: 1;
  background: #f3f4f6;
  overflow-y: auto;
}
</style>