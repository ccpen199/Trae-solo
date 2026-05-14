<template>
  <div class="guide-container">
    <div class="swiper" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
      <div class="slide slide1">
        <div class="icon">🍽️</div>
        <h2>海量美食</h2>
        <p>汇聚全城优质商家，美味触手可及</p>
      </div>
      <div class="slide slide2">
        <div class="icon">🚀</div>
        <h2>极速配送</h2>
        <p>专业骑手团队，准时送达您手中</p>
      </div>
      <div class="slide slide3">
        <div class="icon">🎁</div>
        <h2>优惠多多</h2>
        <p>新人专享、满减优惠，省钱又省心</p>
      </div>
    </div>
    
    <div class="indicators">
      <span 
        v-for="(_, index) in 3" 
        :key="index"
        class="indicator"
        :class="{ active: index === currentIndex }"
        @click="currentIndex = index"
      ></span>
    </div>

    <div class="btn-wrapper">
      <button 
        v-if="currentIndex < 2" 
        class="btn btn-primary"
        @click="nextSlide"
      >
        下一页
      </button>
      <button 
        v-else 
        class="btn btn-primary"
        @click="enterApp"
      >
        立即体验
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentIndex = ref(0)

function nextSlide() {
  if (currentIndex.value < 2) {
    currentIndex.value++
  }
}

function enterApp() {
  localStorage.setItem('hasGuide', 'true')
  router.push('/ad')
}
</script>

<style scoped>
.guide-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #fff;
}

.swiper {
  display: flex;
  width: 300%;
  height: 100%;
  transition: transform 0.5s ease;
}

.slide {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.slide1 {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}

.slide2 {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}

.slide3 {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}

.icon {
  font-size: 120px;
  margin-bottom: 30px;
}

.slide h2 {
  font-size: 28px;
  color: #fff;
  margin: 0 0 16px 0;
}

.slide p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  text-align: center;
}

.indicators {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.indicator.active {
  width: 24px;
  border-radius: 5px;
  background: #fff;
}

.btn-wrapper {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
}

.btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 24px;
}
</style>