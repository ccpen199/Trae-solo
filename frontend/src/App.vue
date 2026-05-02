<template>
  <div class="app-container">
    <template v-if="isLoggedIn">
      <header class="app-header">
        <div class="header-left">
          <h1 class="app-title">✈️ 航空货运管理系统</h1>
        </div>
        <nav class="header-nav">
          <router-link to="/dashboard" class="nav-link" active-class="active">仪表盘</router-link>
          <router-link to="/waybills" class="nav-link" active-class="active">运单管理</router-link>
          <router-link
            v-if="canCreateBooking"
            to="/waybills/create"
            class="nav-link"
            active-class="active"
          >
            新建订舱
          </router-link>
          <router-link to="/todos" class="nav-link" active-class="active">待办事项</router-link>
          <router-link to="/notifications" class="nav-link" active-class="active">通知消息</router-link>
          <router-link v-if="isAdmin" to="/audit-logs" class="nav-link" active-class="active">审计日志</router-link>
        </nav>
        <div class="header-user">
          <div class="user-info">
            <span class="user-role-badge" :style="{ backgroundColor: getRoleBadgeColor }">
              {{ currentUser?.roleDisplay }}
            </span>
            <span class="user-name">{{ currentUser?.name }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout">
            退出登录
          </button>
        </div>
      </header>
      <main class="app-main">
        <router-view />
      </main>
      <footer class="app-footer">
        <p>航空货运管理系统 v1.0.0 | 端口: 前端11691 / 后端11169</p>
      </footer>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { systemApi } from '@/api';
import { getCurrentUser, isAuthenticated } from '@/router';
import { UserRole } from '@/types';

const router = useRouter();
const route = useRoute();

const currentUser = ref<{
  id: string;
  username: string;
  name: string;
  role: string;
  roleDisplay: string;
} | null>(null);

const isLoggedIn = ref(false);

const isAdmin = computed(() => {
  return currentUser.value?.role === UserRole.ADMIN;
});

const canCreateBooking = computed(() => {
  const role = currentUser.value?.role;
  return role === UserRole.FORWARDER || role === UserRole.ADMIN;
});

const getRoleBadgeColor = computed(() => {
  const colorMap: Record<string, string> = {
    [UserRole.FORWARDER]: '#1890ff',
    [UserRole.AIRLINE]: '#52c41a',
    [UserRole.WAREHOUSE]: '#faad14',
    [UserRole.SECURITY]: '#eb2f96',
    [UserRole.CONSIGNEE]: '#722ed1',
    [UserRole.ADMIN]: '#8c8c8c',
  };
  return colorMap[currentUser.value?.role || ''] || '#8c8c8c';
});

function loadUser() {
  isLoggedIn.value = isAuthenticated();
  if (isLoggedIn.value) {
    currentUser.value = getCurrentUser();
  }
}

function handleLogout() {
  systemApi.logout();
  isLoggedIn.value = false;
  currentUser.value = null;
}

onMounted(() => {
  loadUser();
});

watch(
  () => route.path,
  () => {
    loadUser();
  }
);

window.addEventListener('auth-login', (e: any) => {
  currentUser.value = e.detail;
  isLoggedIn.value = true;
});
</script>

<style scoped>
.app-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 500;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-role-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.app-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.app-footer {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  text-align: center;
  color: #8c8c8c;
  font-size: 13px;
}
</style>
