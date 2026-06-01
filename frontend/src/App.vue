<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isOnline = ref(navigator.onLine)
const showNetworkTip = ref(false)

const showTabbar = computed(() => {
  return ['/home', '/mine'].includes(route.path)
})

const activeTab = computed(() => {
  if (route.path === '/home') return 0
  if (route.path === '/mine') return 1
  return 0
})

const handleOnline = () => {
  isOnline.value = true
  showNetworkTip.value = false
}

const handleOffline = () => {
  isOnline.value = false
  showNetworkTip.value = true
}

const retryConnection = () => {
  if (navigator.onLine) {
    isOnline.value = true
    showNetworkTip.value = false
    window.location.reload()
  }
}

const onTabChange = (index: number) => {
  if (index === 0) {
    router.push('/home')
  } else if (index === 1) {
    router.push('/mine')
  }
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <div class="app-container">
    <div v-if="showNetworkTip" class="network-tip">
      <span>网络连接失败</span>
      <button class="retry-btn" @click="retryConnection">重试</button>
    </div>
    
    <router-view />
    
    <van-tabbar v-if="showTabbar" v-model="activeTab" @change="onTabChange">
      <van-tabbar-item icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
}

.network-tip {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #ff4d4f;
  color: white;
  font-size: 14px;
}

.retry-btn {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.retry-btn:active {
  background: rgba(255, 255, 255, 0.3);
}
</style>

