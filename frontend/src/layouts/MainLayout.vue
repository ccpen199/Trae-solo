<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">📁 文件存储</div>
      </div>
      
      <nav class="sidebar-nav">
        <RouterLink 
          v-slot="{ isActive }" 
          to="/files"
          class="sidebar-nav-item"
          :class="{ active: isActive }"
        >
          <span>📄</span>
          <span>我的文件</span>
        </RouterLink>
        
        <RouterLink 
          v-slot="{ isActive }" 
          to="/shares"
          class="sidebar-nav-item"
          :class="{ active: isActive }"
        >
          <span>🔗</span>
          <span>我的分享</span>
        </RouterLink>
        
        <template v-if="authStore.isAdmin">
          <RouterLink 
            v-slot="{ isActive }" 
            to="/admin"
            class="sidebar-nav-item"
            :class="{ active: isActive }"
          >
            <span>⚙️</span>
            <span>管理面板</span>
          </RouterLink>
        </template>
        
        <template v-if="authStore.isCompliance">
          <RouterLink 
            v-slot="{ isActive }" 
            to="/admin/audit"
            class="sidebar-nav-item"
            :class="{ active: isActive }"
          >
            <span>📋</span>
            <span>审计日志</span>
          </RouterLink>
        </template>
      </nav>
      
      <div class="sidebar-footer">
        <div class="mb-2">
          <div class="flex justify-between text-xs text-secondary mb-1">
            <span>存储空间</span>
            <span>{{ formatBytes(authStore.user?.storageUsed || 0) }} / {{ formatBytes(authStore.user?.storageQuota || 0) }}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-bar-fill" 
              :style="{ width: authStore.storagePercentage + '%' }"
              :class="{ 'bg-danger': authStore.storagePercentage > 90 }"
            ></div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              {{ authStore.user?.displayName?.charAt(0) || 'U' }}
            </div>
            <div>
              <div class="text-sm font-medium">{{ authStore.user?.displayName }}</div>
              <div class="text-xs text-secondary">{{ authStore.user?.role }}</div>
            </div>
          </div>
          <button class="icon-btn" title="退出登录" @click="handleLogout">
            🚪
          </button>
        </div>
      </div>
    </aside>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
}

.bg-danger {
  background-color: var(--danger-color) !important;
}

.bg-primary\/20 {
  background-color: rgba(59, 130, 246, 0.2);
}

.w-8 {
  width: 2rem;
}

.h-8 {
  height: 2rem;
}

.rounded-full {
  border-radius: 9999px;
}
</style>
