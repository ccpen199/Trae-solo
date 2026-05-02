<template>
  <div class="app-container">
    <header v-if="userStore.isLoggedIn" class="app-header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <span class="logo-icon">🎮</span>
          <span class="logo-text">教育互动小游戏平台</span>
        </router-link>
        <nav class="nav-menu">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/games" class="nav-item">游戏中心</router-link>
          <router-link to="/ranking" class="nav-item">排行榜</router-link>
          <router-link to="/room" class="nav-item">互动房间</router-link>
          <router-link v-if="userStore.isTeacher" to="/teacher" class="nav-item teacher-dashboard">
            <span class="badge">👨‍🏫</span>
            教师后台
          </router-link>
        </nav>
        <div class="user-area">
          <div class="user-info">
            <span class="user-avatar">{{ userStore.user?.avatar || '👤' }}</span>
            <span class="user-name">{{ userStore.user?.nickname || userStore.user?.username }}</span>
            <span class="user-score">积分: {{ userStore.user?.total_score || 0 }}</span>
          </div>
          <router-link to="/profile" class="nav-item">个人中心</router-link>
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useUserStore } from '@/store'

const userStore = useUserStore()

const handleLogout = () => {
  userStore.logout()
  window.location.href = '/login'
}
</script>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 8px 16px;
  text-decoration: none;
  color: #555;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.nav-item:hover,
.nav-item.router-link-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.teacher-dashboard {
  position: relative;
}

.badge {
  margin-right: 4px;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 20px;
}

.user-avatar {
  font-size: 20px;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-score {
  font-size: 12px;
  color: #667eea;
  font-weight: 600;
}

.logout-btn {
  padding: 8px 16px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.logout-btn:hover {
  background: #ee5a5a;
}

.app-main {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>
