<template>
  <div class="splash-container">
    <div class="logo-wrapper">
      <div class="logo">🍔</div>
      <h1 class="title">饿了么</h1>
      <p class="subtitle">品质外卖 准时送达</p>
    </div>
    <div class="progress-bar">
      <div class="progress" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const progress = ref(0)

onMounted(() => {
  checkNetwork()
})

async function checkNetwork() {
  try {
    const response = await fetch('/api/health')
    if (response.ok) {
      startLoading()
    } else {
      router.push('/network-error')
    }
  } catch {
    router.push('/network-error')
  }
}

function startLoading() {
  const interval = setInterval(() => {
    progress.value += 2
    if (progress.value >= 100) {
      clearInterval(interval)
      const hasGuide = localStorage.getItem('hasGuide')
      if (hasGuide) {
        router.push('/ad')
      } else {
        router.push('/guide')
      }
    }
  }, 20)
}
</script>

<style scoped>
.splash-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60px;
}

.logo {
  font-size: 100px;
  margin-bottom: 20px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.title {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  transition: width 0.1s ease;
}
</style>