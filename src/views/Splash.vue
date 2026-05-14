<template>
  <div class="splash-container">
    <div class="splash-content">
      <div class="logo">
        <span class="logo-icon">🥬</span>
        <h1 class="logo-text">生鲜到家</h1>
        <p class="logo-subtitle">新鲜生活 品质之选</p>
      </div>
      <div class="loading-bar">
        <div class="loading-progress" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="loading-text">{{ loadingText }}</p>
    </div>
    <div v-if="showNetworkError" class="network-error">
      <div class="error-icon">📶</div>
      <p>网络连接失败</p>
      <button class="retry-btn" @click="checkNetwork">重试连接</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const progress = ref(0)
const loadingText = ref('正在加载...')
const showNetworkError = ref(false)

const checkNetwork = () => {
  showNetworkError.value = false
  startLoading()
}

const startLoading = () => {
  progress.value = 0
  loadingText.value = '正在加载...'
  
  const interval = setInterval(() => {
    progress.value += Math.random() * 15 + 5
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(interval)
      handleLocationPermission()
    }
  }, 200)
}

const handleLocationPermission = () => {
  loadingText.value = '正在获取位置...'
  
  setTimeout(() => {
    const mockSuccess = Math.random() > 0.3
    if (mockSuccess) {
      appStore.setLocation('北京市朝阳区')
    } else {
      appStore.setLocation('位置不详')
    }
    router.push('/home')
  }, 1000)
}

onMounted(() => {
  const mockOnline = Math.random() > 0.2
  if (mockOnline) {
    startLoading()
  } else {
    showNetworkError.value = true
  }
})
</script>

<style scoped>
.splash-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.splash-content {
  text-align: center;
}

.logo {
  margin-bottom: 60px;
}

.logo-icon {
  font-size: 80px;
  display: block;
  margin-bottom: 20px;
}

.logo-text {
  font-size: 36px;
  color: #fff;
  font-weight: bold;
  margin: 0;
}

.logo-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 10px;
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto 20px;
}

.loading-progress {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  transition: width 0.2s ease;
}

.loading-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.network-error {
  position: absolute;
  bottom: 100px;
  text-align: center;
  padding: 30px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 16px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.network-error p {
  color: #fff;
  font-size: 16px;
  margin-bottom: 20px;
}

.retry-btn {
  background: #ff6b35;
  color: #fff;
  border: none;
  padding: 12px 40px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
}
</style>
