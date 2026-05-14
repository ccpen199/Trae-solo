<template>
  <header class="header">
    <div class="header-content">
      <div class="logo" @click="goHome">
        <span class="logo-icon">🏠</span>
        <span class="logo-text">美团民宿</span>
      </div>
      
      <nav class="nav">
        <router-link to="/" class="nav-item">首页</router-link>
        <router-link to="/activities" class="nav-item">活动</router-link>
        <router-link to="/favorites" class="nav-item">我的收藏</router-link>
      </nav>

      <div class="user-actions">
        <template v-if="user">
          <span class="user-name">{{ user.username }}</span>
          <button class="logout-btn" @click="logout">退出</button>
        </template>
        <template v-else>
          <router-link to="/login" class="login-link">登录</router-link>
          <router-link to="/register" class="register-link">注册</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
  }
})

const goHome = () => {
  router.push('/')
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  user.value = null
  router.push('/')
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  padding: 12px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-icon {
  font-size: 28px;
  margin-right: 8px;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav-item {
  color: white;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: opacity 0.3s;
}

.nav-item:hover {
  opacity: 0.8;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  color: white;
  font-size: 14px;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.login-link, .register-link {
  color: white;
  text-decoration: none;
  font-size: 14px;
}

.register-link {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
}
</style>