<template>
  <div class="app">
    <header class="app-header" v-if="userStore.isLoggedIn">
      <div class="container flex-between">
        <div class="logo">
          <router-link to="/profile">用户管理系统</router-link>
        </div>
        <nav class="nav">
          <router-link to="/profile" class="nav-link">个人中心</router-link>
          <template v-if="userStore.isAdmin">
            <router-link to="/admin/users" class="nav-link">用户管理</router-link>
            <router-link to="/admin/logs" class="nav-link">操作日志</router-link>
          </template>
          <button class="btn btn-default" @click="handleLogout">退出登录</button>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { post } from '@/utils/request';

const userStore = useUserStore();
const router = useRouter();

async function handleLogout() {
  await post('/auth/logout');
  userStore.clearAuth();
  router.push('/login');
}
</script>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  background: var(--white);
  box-shadow: var(--shadow);
  height: 60px;
}

.logo a {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: var(--text-secondary);
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary-color);
}

.app-main {
  padding: 24px 0;
}
</style>
