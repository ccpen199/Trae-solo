<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">💬</span>
        <span class="logo-text">消息系统</span>
      </div>
      <nav class="menu">
        <router-link to="/conversations" class="menu-item" active-class="active">
          <span class="icon">💬</span><span>会话</span>
        </router-link>
        <template v-if="userStore.canViewReports">
          <router-link to="/reports" class="menu-item" active-class="active">
            <span class="icon">🛡️</span><span>举报审核</span>
          </router-link>
          <router-link to="/statistics" class="menu-item" active-class="active">
            <span class="icon">📊</span><span>运营报表</span>
          </router-link>
        </template>
        <template v-if="userStore.canManageUsers">
          <router-link to="/users" class="menu-item" active-class="active">
            <span class="icon">👥</span><span>用户管理</span>
          </router-link>
          <router-link to="/sensitive-words" class="menu-item" active-class="active">
            <span class="icon">🚫</span><span>敏感词</span>
          </router-link>
        </template>
        <template v-if="userStore.canViewAudit">
          <router-link to="/audit-logs" class="menu-item" active-class="active">
            <span class="icon">📋</span><span>审计日志</span>
          </router-link>
        </template>
      </nav>
    </aside>
    <div class="main-content">
      <header class="topbar">
        <div class="breadcrumb">
          <span>{{ currentRouteTitle }}</span>
        </div>
        <div class="user-area">
          <span class="user-name">{{ userStore.userName }}</span>
          <span class="role-badge" :class="'role-' + userStore.userRole">{{ roleText }}</span>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </div>
      </header>
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const roleText = computed(() => {
  const map = { admin: '管理员', moderator: '审核员', cs: '客服', user: '普通用户' }
  return map[userStore.userRole] || userStore.userRole
})

const routeTitles = {
  'Conversations': '会话列表',
  'Chat': '聊天',
  'Reports': '举报审核',
  'Statistics': '运营报表',
  'Users': '用户管理',
  'SensitiveWords': '敏感词管理',
  'AuditLogs': '审计日志'
}

const currentRouteTitle = computed(() => routeTitles[route.name] || '')

const handleLogout = () => {
  userStore.logout()
  router.replace({ path: '/login', query: { error: encodeURIComponent('已退出登录') } })
}

let storageEventHandler = null

onMounted(() => {
  userStore.syncFromStorage()
  if (!userStore.isLoggedIn) {
    router.replace('/login')
    return
  }
  storageEventHandler = (e) => {
    if (e.key === 'user' || e.key === 'token') {
      userStore.syncFromStorage()
      if (!userStore.isLoggedIn) {
        router.replace('/login')
      }
    }
  }
  window.addEventListener('storage', storageEventHandler)
})

onBeforeUnmount(() => {
  if (storageEventHandler) {
    window.removeEventListener('storage', storageEventHandler)
  }
})
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100%;
  height: 100%;
}
.sidebar {
  width: 200px;
  background: #1e293b;
  display: flex;
  flex-direction: column;
}
.logo {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #334155;
}
.logo-icon { font-size: 24px; }
.logo-text { color: #fff; font-size: 16px; font-weight: 600; }
.menu {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  cursor: pointer;
}
.menu-item:hover { background: #334155; color: #fff; }
.menu-item.active { background: #3b82f6; color: #fff; }
.menu-item .icon { font-size: 16px; }
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.breadcrumb { color: #333; font-size: 16px; font-weight: 500; }
.user-area { display: flex; align-items: center; gap: 12px; }
.user-name { color: #555; font-size: 14px; }
.role-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.role-admin { background: #fef3c7; color: #92400e; }
.role-moderator { background: #dbeafe; color: #1e40af; }
.role-cs { background: #dcfce7; color: #166534; }
.role-user { background: #f1f5f9; color: #475569; }
.logout-btn {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.logout-btn:hover { background: #f8fafc; color: #333; }
.content { flex: 1; overflow: auto; padding: 20px; background: #f5f7fa; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
