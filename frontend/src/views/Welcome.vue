<template>
  <div class="welcome-page">
    <div class="welcome-content">
      <div class="logo">🏃</div>
      <h1>Keep Fit</h1>
      <p>自律给我自由</p>
      
      <div class="buttons">
        <van-button 
          type="primary" 
          size="large" 
          block 
          @click="goToLogin"
        >
          登录
        </van-button>
        <van-button 
          type="default" 
          size="large" 
          block 
          @click="goToRegister"
        >
          注册
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToLogin() {
  router.push('/login')
}

function goToRegister() {
  router.push('/register')
}
</script>

<style lang="less" scoped>
.welcome-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-content {
  text-align: center;
  padding: 40px;
}

.logo {
  font-size: 80px;
  margin-bottom: 20px;
}

h1 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
}

p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.offline-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 193, 7, 0.2);
  border-radius: 20px;
  margin-bottom: 30px;
  font-size: 14px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-login {
  background: white;
  color: #667eea;
  border: none;
}

.btn-register {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.agreement {
  font-size: 12px;
  opacity: 0.8;
  
  a {
    color: white;
    text-decoration: underline;
  }
}
</style>
