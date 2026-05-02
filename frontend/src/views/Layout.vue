<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>📋 资产管理</h2>
      </div>
      
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          :class="{ active: isActive(item.path) }"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-text">{{ item.label }}</span>
          <span v-if="item.badge > 0" class="menu-badge">{{ item.badge }}</span>
        </router-link>
      </nav>
    </aside>
    
    <main class="main-content">
      <header class="header">
        <div class="header-left">
          <h3>{{ currentPageTitle }}</h3>
        </div>
        
        <div class="header-right">
          <div class="notification-icon" @click="showMessagesPanel = !showMessagesPanel">
            <span>🔔</span>
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </div>
          
          <div class="user-info">
            <span class="user-name">{{ authStore.user?.name }}</span>
            <span class="user-role">{{ userRoleLabel }}</span>
          </div>
          
          <button class="logout-btn" @click="handleLogout">
            退出登录
          </button>
        </div>
      </header>
      
      <div class="content">
        <router-view />
      </div>
    </main>
    
    <div v-if="showMessagesPanel" class="messages-panel">
      <div class="panel-header">
        <h4>待办事项</h4>
        <button @click="showMessagesPanel = false" class="close-btn">&times;</button>
      </div>
      
      <div class="panel-content" v-if="stats">
        <div class="todo-item" v-for="(count, key) in stats.workflow" :key="key" v-if="count > 0">
          <span class="todo-label">{{ getTodoLabel(key) }}</span>
          <span class="todo-count">{{ count }}</span>
        </div>
        <div v-if="!Object.values(stats.workflow).some(v => v > 0)" class="no-todo">
          暂无待办事项
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { UserRoleLabels } from '@/types';
import { messageApi } from '@/api';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showMessagesPanel = ref(false);
const stats = ref<{
  messages: { unread: number; todo: number; notification: number; alert: number };
  workflow: Record<string, number>;
} | null>(null);

const menuItems = [
  { path: '/', label: '看板', icon: '📊', badge: 0 },
  { path: '/assets', label: '资产列表', icon: '📋', badge: 0 },
  { path: '/register', label: '资产入账', icon: '➕', badge: 0 },
  { path: '/workflow', label: '流程处理', icon: '🔄', badge: 0 },
  { path: '/inventory', label: '资产盘点', icon: '📷', badge: 0 },
  { path: '/approval', label: '审批中心', icon: '✅', badge: 0 },
  { path: '/messages', label: '消息中心', icon: '💬', badge: 0 },
  { path: '/reports', label: '报表分析', icon: '📈', badge: 0 }
];

const unreadCount = computed(() => stats.value?.messages.unread || 0);

const userRoleLabel = computed(() => {
  return authStore.user?.role ? UserRoleLabels[authStore.user.role] : '';
});

const currentPageTitle = computed(() => {
  const path = route.path;
  const item = menuItems.find(m => m.path === path || (path.startsWith('/assets/') && m.path === '/assets'));
  return item?.label || '看板';
});

const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const getTodoLabel = (key: string) => {
  const labels: Record<string, string> = {
    pendingRegister: '待入账',
    pendingReceive: '待领用',
    pendingDepreciation: '待折旧',
    pendingInventory: '待盘点',
    pendingTransfer: '待调拨',
    pendingScrap: '待报废'
  };
  return labels[key] || key;
};

const loadStats = async () => {
  try {
    const result = await messageApi.getStats();
    if (result.success && result.data) {
      stats.value = result.data;
    }
  } catch (error) {
    console.error('Load stats error:', error);
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.sidebar-nav {
  padding: 16px 12px;
  flex: 1;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
}

.sidebar-nav a:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-nav a.active {
  background: rgba(102, 126, 234, 0.3);
  color: white;
}

.menu-icon {
  font-size: 18px;
  margin-right: 12px;
}

.menu-text {
  flex: 1;
  font-size: 14px;
}

.menu-badge {
  background: #e74c3c;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left h3 {
  font-size: 18px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-icon {
  position: relative;
  cursor: pointer;
  font-size: 20px;
}

.notification-icon .badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e74c3c;
  color: white;
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  text-align: right;
}

.user-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.user-role {
  display: block;
  font-size: 12px;
  color: #888;
}

.logout-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.content {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

.messages-panel {
  position: fixed;
  top: 60px;
  right: 24px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  font-size: 20px;
  color: #888;
  background: none;
  padding: 0;
  line-height: 1;
}

.panel-content {
  padding: 12px;
  max-height: 400px;
  overflow: auto;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 8px;
}

.todo-label {
  font-size: 14px;
  color: #333;
}

.todo-count {
  background: #667eea;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.no-todo {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
