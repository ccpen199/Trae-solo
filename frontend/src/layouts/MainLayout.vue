<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)

const menuItems = [
  { path: '/dashboard', title: '成本看板', icon: '📊' },
  { path: '/bills', title: '资源账单', icon: '📋' },
  { path: '/resources/unassigned', title: '待认领资源', icon: '📦' },
  { path: '/optimization', title: '优化建议', icon: '💡' },
  { path: '/workorders', title: '执行工单', icon: '🔧' },
  { path: '/finance', title: '财务报表', icon: '💰' },
  { path: '/projects', title: '项目管理', icon: '📁' }
]

const isActive = (path) => {
  return route.path.startsWith(path)
}

const navigateTo = (path) => {
  router.push(path)
}

const toggleSidebar = () => {
  appStore.toggleSidebar()
}
</script>

<template>
  <div class="layout-container">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="logo">
        <span class="logo-icon">☁️</span>
        <span v-if="!sidebarCollapsed" class="logo-text">FinOps</span>
      </div>
      <nav class="menu">
        <div
          v-for="item in menuItems"
          :key="item.path"
          class="menu-item"
          :class="{ active: isActive(item.path) }"
          @click="navigateTo(item.path)"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span v-if="!sidebarCollapsed" class="menu-title">{{ item.title }}</span>
        </div>
      </nav>
    </aside>
    <div class="main-content">
      <header class="header">
        <div class="header-left">
          <button class="toggle-btn" @click="toggleSidebar">
            {{ sidebarCollapsed ? '☰' : '✕' }}
          </button>
          <h1 class="page-title">{{ route.meta.title }}</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="user-avatar">👤</span>
            <span class="user-name">管理员</span>
          </div>
        </div>
      </header>
      <main class="content">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
  white-space: nowrap;
}

.menu {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 4px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.menu-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.menu-item.active {
  background: rgba(24, 144, 255, 0.15);
  color: var(--primary-color);
}

.menu-icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.menu-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: var(--header-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: var(--border-radius);
  background: var(--bg-tertiary);
}

.user-avatar {
  font-size: 18px;
}

.user-name {
  font-size: 14px;
  color: var(--text-primary);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
