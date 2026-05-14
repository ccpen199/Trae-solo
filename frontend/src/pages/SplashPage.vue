<template>
  <div class="splash-container">
    <div class="logo-wrapper">
      <div class="logo">
        <span class="logo-icon">🛒</span>
      </div>
      <h1 class="logo-text">盒马鲜生</h1>
      <p class="slogan">30分钟新鲜送达</p>
    </div>
    <div class="progress-bar">
      <div class="progress" :style="{ width: progress + '%' }"></div>
    </div>
    <p class="skip-btn" @click="goWelcome">跳过 {{ skipCount }}s</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const progress = ref(0)
const skipCount = ref(3)
let timer = null
let progressTimer = null

const goWelcome = () => {
  clearInterval(timer)
  clearInterval(progressTimer)
  router.push('/welcome')
}

onMounted(() => {
  timer = setInterval(() => {
    skipCount.value--
    if (skipCount.value <= 0) {
      goWelcome()
    }
  }, 1000)
  
  progressTimer = setInterval(() => {
    progress.value += 3.33
    if (progress.value >= 100) {
      clearInterval(progressTimer)
    }
  }, 100)
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(progressTimer)
})
</script>

<style scoped>
.splash-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.logo-wrapper {
  text-align: center;
}

.logo {
  width: 120px;
  height: 120px;
  background: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.logo-icon {
  font-size: 60px;
}

.logo-text {
  color: white;
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.slogan {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
}

.progress-bar {
  width: 200px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-top: 60px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: white;
  border-radius: 2px;
  transition: width 0.1s linear;
}

.skip-btn {
  position: absolute;
  top: 40px;
  right: 20px;
  color: white;
  font-size: 14px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}
</style>