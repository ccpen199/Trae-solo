<script setup>
import { useUserStore } from '../stores/user'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import Header from '../components/Header.vue'

const userStore = useUserStore()
const router = useRouter()
const { userInfo } = storeToRefs(userStore)

function logout() {
  userStore.logout()
  router.push('/movies')
}
</script>

<template>
  <div class="profile-page">
    <Header />
    
    <main class="main-content">
      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar">👤</div>
          <div class="user-info">
            <h2 class="username">{{ userInfo?.username }}</h2>
            <p v-if="userInfo?.phone" class="phone">{{ userInfo.phone }}</p>
            <p v-if="userInfo?.city_name" class="city">📍 {{ userInfo.city_name }}</p>
          </div>
        </div>
        
        <div class="menu-section">
          <div class="menu-item">
            <span class="menu-icon">🎟️</span>
            <span class="menu-text">我的订单</span>
            <span class="menu-arrow">→</span>
          </div>
          <div class="menu-item">
            <span class="menu-icon">❤️</span>
            <span class="menu-text">我的收藏</span>
            <span class="menu-arrow">→</span>
          </div>
          <div class="menu-item">
            <span class="menu-icon">🎬</span>
            <span class="menu-text">观影历史</span>
            <span class="menu-arrow">→</span>
          </div>
          <div class="menu-item">
            <span class="menu-icon">🎁</span>
            <span class="menu-text">优惠券</span>
            <span class="menu-arrow">→</span>
          </div>
        </div>
        
        <div class="settings-section">
          <router-link to="/settings" class="menu-item">
            <span class="menu-icon">⚙️</span>
            <span class="menu-text">设置</span>
            <span class="menu-arrow">→</span>
          </router-link>
        </div>
        
        <button class="logout-btn" @click="logout">退出登录</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
}

.profile-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.avatar {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.phone, .city {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.menu-section {
  padding: 8px 0;
  border-bottom: 8px solid var(--bg-color);
}

.settings-section {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  cursor: pointer;
  transition: background 0.3s;
  text-decoration: none;
  color: inherit;
}

.menu-item:hover {
  background: var(--bg-color);
}

.menu-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 15px;
}

.menu-arrow {
  color: var(--text-light);
  font-size: 16px;
}

.logout-btn {
  width: 100%;
  padding: 16px;
  border: none;
  background: white;
  color: #e53e3e;
  font-size: 15px;
  cursor: pointer;
  border-top: 8px solid var(--bg-color);
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #fff5f5;
}
</style>
