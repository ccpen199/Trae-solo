<script setup>
import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const appStore = useAppStore()
const userStore = useUserStore()
const { currentCity, hotCities } = storeToRefs(appStore)
const { userInfo } = storeToRefs(userStore)

const showCityDropdown = ref(false)

function selectCity(city) {
  appStore.setCity(city)
  showCityDropdown.value = false
}
</script>

<template>
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <span class="logo-icon">🎬</span>
        <span class="logo-text">Hiyou 电影</span>
      </div>
      
      <nav class="nav">
        <router-link to="/movies" class="nav-link">电影</router-link>
        <router-link to="/cinemas" class="nav-link">影院</router-link>
        <router-link to="/schedule" class="nav-link">排期</router-link>
      </nav>
      
      <div class="header-right">
        <div class="city-selector" @click="showCityDropdown = !showCityDropdown">
          <span class="location-icon">📍</span>
          <span class="city-name">{{ currentCity?.name || '选择城市' }}</span>
          <span class="dropdown-arrow">▼</span>
        </div>
        
        <div v-if="showCityDropdown" class="city-dropdown" @click.self="showCityDropdown = false">
          <div class="hot-cities">
            <div class="dropdown-title">热门城市</div>
            <div class="city-list">
              <span 
                v-for="city in hotCities" 
                :key="city.id" 
                class="city-item"
                @click="selectCity(city)"
              >{{ city.name }}</span>
            </div>
          </div>
        </div>
        
        <div class="user-section">
          <router-link v-if="userInfo" to="/profile" class="user-name">
            {{ userInfo.nickname || userInfo.username }}
          </router-link>
          <router-link v-else to="/login" class="login-btn">登录</router-link>
          <router-link to="/settings" class="settings-btn">⚙️</router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  box-shadow: 0 2px 12px rgba(229, 77, 66, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
}

.logo-icon {
  font-size: 24px;
}

.nav {
  display: flex;
  gap: 32px;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-size: 15px;
  opacity: 0.9;
  transition: opacity 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  opacity: 1;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.city-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 14px;
  position: relative;
}

.city-selector:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dropdown-arrow {
  font-size: 10px;
  opacity: 0.8;
}

.city-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  color: var(--text-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  min-width: 280px;
  z-index: 1000;
}

.dropdown-title {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 12px;
}

.city-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.city-item {
  padding: 6px 16px;
  background: var(--bg-color);
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.city-item:hover {
  background: var(--primary-color);
  color: white;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-btn {
  color: white;
  text-decoration: none;
  font-size: 14px;
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  transition: all 0.3s;
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.user-name {
  color: white;
  text-decoration: none;
  font-size: 14px;
}

.settings-btn {
  color: white;
  font-size: 18px;
  text-decoration: none;
  opacity: 0.9;
}

.settings-btn:hover {
  opacity: 1;
}
</style>
