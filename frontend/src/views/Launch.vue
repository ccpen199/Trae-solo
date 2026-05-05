<template>
  <div class="launch-page">
    <div v-if="showWelcome" class="welcome-transition">
      <div class="logo-container">
        <div class="logo-icon">
          <van-icon name="home-o" size="48" color="#fff" />
        </div>
        <h1 class="app-name">家居搭配</h1>
        <p class="slogan">发现理想的家</p>
      </div>
    </div>

    <template v-else>
      <div v-if="isFirstOpen" class="welcome-transition">
        <div class="welcome-content">
          <div class="logo-container">
            <div class="logo-icon large">
              <van-icon name="home-o" size="64" color="#fff" />
            </div>
            <h1 class="app-name large">家居搭配</h1>
            <p class="slogan">发现理想的家</p>
          </div>
          <van-button 
            type="primary" 
            size="large" 
            round 
            class="start-btn"
            @click="goToWelcome"
          >
            开始体验
          </van-button>
        </div>
      </div>

      <div v-else>
        <template v-if="advertisements.length > 0">
          <van-swipe 
            class="ad-swipe" 
            :autoplay="3000"
            @change="onAdChange"
          >
            <van-swipe-item v-for="ad in advertisements" :key="ad.id">
              <div class="ad-item" @click="goToAdDetail(ad)">
                <img :src="ad.image" class="ad-image" alt="ad" />
                <div class="ad-info">
                  <h3 class="ad-title">{{ ad.title }}</h3>
                </div>
              </div>
            </van-swipe-item>
          </van-swipe>
          
          <div class="ad-controls">
            <div class="countdown">
              <span class="countdown-text">{{ countdown }}</span>
              <span class="countdown-unit">s</span>
            </div>
            <van-button type="default" size="small" round @click="skipAd">
              跳过
            </van-button>
          </div>
        </template>
        
        <div v-else class="loading-page">
          <van-loading size="24" vertical>加载中...</van-loading>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAdvertisements } from '@/api/furniture'

const router = useRouter()

const showWelcome = ref(true)
const isFirstOpen = ref(false)
const advertisements = ref([])
const currentAdIndex = ref(0)
const countdown = ref(2)
const countdownTimer = ref(null)

onMounted(async () => {
  const visited = localStorage.getItem('app_visited')
  
  if (!visited) {
    isFirstOpen.value = true
    localStorage.setItem('app_visited', 'true')
  }

  setTimeout(() => {
    showWelcome.value = false
    
    if (!isFirstOpen.value) {
      loadAdvertisements()
    }
  }, 1500)
})

onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})

const loadAdvertisements = async () => {
  try {
    const res = await getAdvertisements()
    if (res.success && res.data?.length > 0) {
      advertisements.value = res.data
      startCountdown()
    } else {
      goToHome()
    }
  } catch (error) {
    goToHome()
  }
}

const startCountdown = () => {
  countdown.value = 2
  countdownTimer.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer.value)
      goToHome()
    }
  }, 1000)
}

const onAdChange = (index) => {
  currentAdIndex.value = index
}

const goToWelcome = () => {
  router.push('/welcome')
}

const goToHome = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
  router.push('/home')
}

const skipAd = () => {
  goToHome()
}

const goToAdDetail = (ad) => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
  if (ad.link) {
    router.push(ad.link)
  }
}
</script>

<style scoped>
.launch-page {
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.welcome-transition {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.logo-container {
  text-align: center;
  color: #fff;
}

.logo-icon {
  width: 100px;
  height: 100px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  backdrop-filter: blur(10px);
}

.logo-icon.large {
  width: 120px;
  height: 120px;
  border-radius: 28px;
}

.app-name {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.app-name.large {
  font-size: 36px;
}

.slogan {
  font-size: 16px;
  opacity: 0.9;
  letter-spacing: 4px;
}

.welcome-content {
  text-align: center;
  padding: 0 40px;
}

.start-btn {
  margin-top: 60px;
  background: #fff;
  color: #667eea;
  border: none;
  font-weight: 600;
}

.ad-swipe {
  height: calc(100vh - 80px);
}

.ad-item {
  height: 100%;
  position: relative;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ad-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  padding: 60px 20px 30px;
}

.ad-title {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.ad-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.countdown {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  padding: 6px 12px;
}

.countdown-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.countdown-unit {
  color: #fff;
  font-size: 12px;
  margin-left: 2px;
}

.loading-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
</style>
