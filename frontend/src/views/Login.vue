<template>
  <div class="login-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <h1 class="title">登录</h1>
      <div class="placeholder"></div>
    </div>

    <div class="login-tabs">
      <span 
        class="tab" 
        :class="{ active: loginType === 'captcha' }"
        @click="loginType = 'captcha'"
      >验证码登录</span>
      <span 
        class="tab" 
        :class="{ active: loginType === 'password' }"
        @click="loginType = 'password'"
      >密码登录</span>
    </div>

    <div class="form-wrapper">
      <div class="input-item">
        <input 
          type="tel" 
          v-model="phone" 
          class="input"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </div>

      <div v-if="loginType === 'captcha'" class="input-item">
        <input 
          type="tel" 
          v-model="captcha" 
          class="input"
          placeholder="请输入验证码"
          maxlength="6"
        />
        <button 
          class="captcha-btn"
          :disabled="captchaCountdown > 0"
          @click="sendCaptcha"
        >
          {{ captchaCountdown > 0 ? `${captchaCountdown}s` : '获取验证码' }}
        </button>
      </div>

      <div v-else class="password-input-item">
        <input 
          :type="showPassword ? 'text' : 'password'" 
          v-model="password" 
          class="input"
          placeholder="请输入密码"
        />
        <span 
          class="eye-icon"
          @click="showPassword = !showPassword"
        >{{ showPassword ? '🙈' : '👁️' }}</span>
      </div>

      <div v-if="loginType === 'password'" class="forgot-password" @click="showForgotPassword = true">
        忘记密码？
      </div>
    </div>

    <button 
      class="btn btn-primary login-btn"
      :disabled="!canLogin"
      @click="handleLogin"
    >
      登录
    </button>

    <div class="other-login">
      <span class="divider"></span>
      <span class="other-text">其他登录方式</span>
      <span class="divider"></span>
    </div>

    <div class="third-party-login">
      <button class="third-party-btn" @click="thirdPartyLogin('wechat')">
        <span class="icon">💬</span>
        <span>微信</span>
      </button>
      <button class="third-party-btn" @click="thirdPartyLogin('alipay')">
        <span class="icon">🔷</span>
        <span>支付宝</span>
      </button>
      <button class="third-party-btn" @click="thirdPartyLogin('qq')">
        <span class="icon">🐧</span>
        <span>QQ</span>
      </button>
    </div>

    <div class="register-link">
      还没有账号？<span class="link" @click="goRegister">立即注册</span>
    </div>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authAPI } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const loginType = ref('captcha')
const phone = ref('')
const captcha = ref('')
const password = ref('')
const showPassword = ref(false)
const captchaCountdown = ref(0)
const showForgotPassword = ref(false)
const errorMessage = ref('')

const canLogin = computed(() => {
  if (!/^1[3-9]\d{9}$/.test(phone.value)) return false
  if (loginType.value === 'captcha') {
    return captcha.value.length === 6
  } else {
    return password.value.length >= 6
  }
})

async function sendCaptcha() {
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    errorMessage.value = '请输入正确的手机号'
    return
  }
  
  try {
    const result = await authAPI.sendCaptcha(phone.value)
    if (result.success) {
      captchaCountdown.value = 30
      const timer = setInterval(() => {
        captchaCountdown.value--
        if (captchaCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
      errorMessage.value = ''
    } else {
      errorMessage.value = result.message
    }
  } catch (err) {
    errorMessage.value = err.message || '发送失败'
  }
}

async function handleLogin() {
  errorMessage.value = ''
  
  try {
    let result
    if (loginType.value === 'captcha') {
      result = await authAPI.loginCaptcha(phone.value, captcha.value)
    } else {
      result = await authAPI.loginPassword(phone.value, password.value)
    }
    
    if (result.success) {
      userStore.login(result)
      router.push('/home')
    } else {
      errorMessage.value = result.message
    }
  } catch (err) {
    errorMessage.value = err.message || '登录失败'
  }
}

async function thirdPartyLogin(type) {
  errorMessage.value = ''
  const openid = `mock_${type}_${Date.now()}`
  const nickname = type === 'wechat' ? '微信用户' : type === 'alipay' ? '支付宝用户' : 'QQ用户'
  
  try {
    const result = await authAPI.thirdPartyLogin(type, openid, nickname, '')
    if (result.success) {
      userStore.login(result)
      router.push('/home')
    } else {
      errorMessage.value = result.message || '登录失败'
    }
  } catch (err) {
    errorMessage.value = err.message || '登录失败，请稍后重试'
  }
}

function goRegister() {
  console.log('跳转到注册页面')
}
</script>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0 20px 40px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.placeholder {
  width: 44px;
}

.login-tabs {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 20px 0;
}

.tab {
  font-size: 16px;
  color: #999;
  padding-bottom: 8px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab.active {
  color: #ff6b35;
  border-bottom-color: #ff6b35;
}

.form-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.input-item {
  position: relative;
  margin-bottom: 16px;
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.captcha-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 8px 16px;
  background: #ff6b35;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
}

.captcha-btn:disabled {
  background: #ccc;
}

.password-input-item {
  position: relative;
  margin-bottom: 16px;
}

.eye-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
}

.forgot-password {
  text-align: right;
  font-size: 14px;
  color: #ff6b35;
}

.login-btn {
  width: 100%;
  height: 48px;
  margin-top: 20px;
  font-size: 16px;
  border-radius: 24px;
}

.other-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
}

.divider {
  width: 60px;
  height: 1px;
  background: #e0e0e0;
}

.other-text {
  font-size: 12px;
  color: #999;
}

.third-party-login {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.third-party-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
}

.third-party-btn .icon {
  font-size: 40px;
}

.third-party-btn span:last-child {
  font-size: 12px;
  color: #666;
}

.register-link {
  text-align: center;
  margin-top: 30px;
  font-size: 14px;
  color: #666;
}

.register-link .link {
  color: #ff6b35;
}

.error-message {
  text-align: center;
  color: #ff4757;
  font-size: 12px;
  margin-top: 16px;
}
</style>