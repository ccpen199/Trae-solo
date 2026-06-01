<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>保单续期系统</h2>
      </div>
      <nav class="nav-menu">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="nav-icon">📊</span>
          <span>仪表盘</span>
        </router-link>
        <router-link to="/policy-pool" class="nav-item" :class="{ active: $route.path === '/policy-pool' }">
          <span class="nav-icon">📋</span>
          <span>保单池</span>
        </router-link>
        <router-link to="/tasks" class="nav-item" :class="{ active: $route.path === '/tasks' }">
          <span class="nav-icon">✅</span>
          <span>续期任务</span>
        </router-link>
        <router-link to="/payments" class="nav-item" :class="{ active: $route.path === '/payments' }">
          <span class="nav-icon">💰</span>
          <span>扣费管理</span>
        </router-link>
        <router-link to="/reports" class="nav-item" :class="{ active: $route.path === '/reports' }">
          <span class="nav-icon">📈</span>
          <span>报表分析</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <header class="header">
        <div class="header-left">
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <span class="user-info">管理员</span>
        </div>
      </header>
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const pageTitle = computed(() => {
  const titles = {
    '/': '仪表盘',
    '/policy-pool': '保单池',
    '/tasks': '续期任务',
    '/payments': '扣费管理',
    '/reports': '报表分析'
  };
  return titles[route.path] || '保单续期系统';
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.nav-menu {
  padding: 12px 0;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: #fff;
  background: #1890ff;
}

.nav-icon {
  font-size: 18px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.header-left h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  font-size: 14px;
  color: #666;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f5f7fa;
}
</style>
