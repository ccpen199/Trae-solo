<template>
  <div class="welcome-page">
    <div class="welcome-content">
      <div class="logo-section">
        <div class="logo-icon">
          <van-icon name="home-o" size="64" color="#fff" />
        </div>
        <h1 class="app-name">家居搭配</h1>
      </div>
      
      <div class="features-section">
        <div class="feature-item">
          <div class="feature-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <van-icon name="search" size="28" color="#fff" />
          </div>
          <h3 class="feature-title">海量家具</h3>
          <p class="feature-desc">精选数万款优质家具，满足您的各种需求</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <van-icon name="eye-o" size="28" color="#fff" />
          </div>
          <h3 class="feature-title">VR预览</h3>
          <p class="feature-desc">360°全景查看，提前感受家具摆放效果</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <van-icon name="shop-collect" size="28" color="#fff" />
          </div>
          <h3 class="feature-title">空间搭配</h3>
          <p class="feature-desc">智能搭配方案，轻松打造理想家居空间</p>
        </div>
      </div>
      
      <div class="buttons-section">
        <van-button 
          type="primary" 
          size="large" 
          round 
          block
          @click="goToGuide"
        >
          查看引导
        </van-button>
        <van-button 
          type="default" 
          size="large" 
          round 
          block
          class="skip-btn"
          @click="goToHome"
        >
          跳过
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToGuide = () => {
  router.push('/guide')
}

const goToHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.welcome-page {
  height: 100vh;
  width: 100%;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  padding: 40px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.welcome-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-section {
  text-align: center;
  margin-bottom: 50px;
}

.logo-icon {
  width: 100px;
  height: 100px;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.app-name {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
  letter-spacing: 2px;
}

.features-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 30px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px;
}

.feature-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.buttons-section {
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skip-btn {
  background: transparent;
  color: #999;
  border: none;
}
</style>
