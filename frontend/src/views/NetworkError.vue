<template>
  <div class="network-error-container">
    <div class="error-icon">📡</div>
    <h2 class="error-title">网络连接异常</h2>
    <p class="error-desc">请检查您的网络连接后重试</p>
    <button class="btn btn-primary reload-btn" @click="retry">
      重新加载
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

async function retry() {
  try {
    const response = await fetch('/api/health')
    if (response.ok) {
      const hasGuide = localStorage.getItem('hasGuide')
      if (hasGuide) {
        router.push('/ad')
      } else {
        router.push('/guide')
      }
    }
  } catch {
    console.log('网络仍然异常')
  }
}
</script>

<style scoped>
.network-error-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 40px;
}

.error-icon {
  font-size: 120px;
  margin-bottom: 30px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error-title {
  font-size: 24px;
  color: #333;
  margin: 0 0 12px 0;
}

.error-desc {
  font-size: 14px;
  color: #999;
  margin: 0 0 40px 0;
}

.reload-btn {
  width: 160px;
  height: 48px;
  font-size: 16px;
  border-radius: 24px;
}
</style>