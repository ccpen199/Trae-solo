<template>
  <div class="ad-container">
    <div class="ad-content">
      <div v-if="!imageLoaded" class="loading-overlay">
        <span class="loading-icon">⏳</span>
        <span class="loading-text">广告加载中...</span>
      </div>
      <img 
        src="https://neeko-copilot.bytedance.net/api/text_to_image?prompt=food%20delivery%20app%20promotion%20banner%20colorful%20delicious%20food&image_size=landscape_16_9" 
        alt="广告"
        class="ad-image"
        :class="{ hidden: !imageLoaded }"
        @click="openAdDetail"
        @load="imageLoaded = true"
      />
      <div v-if="!imageLoaded" class="ad-placeholder">
        <div class="placeholder-content">
          <span class="placeholder-icon">🍔</span>
          <span class="placeholder-text">饿了么外卖</span>
          <span class="placeholder-sub">品质外卖 准时送达</span>
        </div>
      </div>
    </div>
    
    <div class="skip-btn" @click="skipAd">
      <span class="skip-text">跳过广告</span>
      <span class="countdown">{{ countdown }}s</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const countdown = ref(5)
const imageLoaded = ref(false)
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      enterHome()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

function skipAd() {
  if (timer) {
    clearInterval(timer)
  }
  enterHome()
}

function openAdDetail() {
  console.log('打开广告详情')
}

function enterHome() {
  router.push('/home')
}
</script>

<style scoped>
.ad-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}

.ad-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.ad-image.hidden {
  opacity: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.loading-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 14px;
  color: #fff;
}

.ad-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.placeholder-icon {
  font-size: 80px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.placeholder-text {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.placeholder-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.skip-btn {
  position: absolute;
  top: 30px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.skip-text {
  color: rgba(255, 255, 255, 0.8);
}

.countdown {
  color: #ff6b35;
  font-weight: bold;
}
</style>