<template>
  <div class="page-container login-page">
    <div class="login-header">
      <h1>综合电商</h1>
      <p>欢迎回来</p>
    </div>

    <div class="login-form">
      <div class="form-group">
        <input 
          v-model="loginId" 
          type="text" 
          placeholder="手机号/邮箱/用户名"
          class="form-input"
        />
      </div>
      <div class="form-group">
        <input 
          v-model="password" 
          type="password" 
          placeholder="密码"
          class="form-input"
        />
      </div>

      <button 
        class="btn-login" 
        :disabled="!canSubmit || isSubmitting"
        @click="handleLogin"
      >
        {{ isSubmitting ? '登录中...' : '登录' }}
      </button>

      <div class="login-links">
        <span @click="goToRegister">注册</span>
        <span>|</span>
        <span @click="handleForgot">找回密码</span>
      </div>

      <div class="divider">
        <span>其他登录方式</span>
      </div>

      <div class="other-login">
        <div class="login-item" @click="handleAlipay">
          <span class="login-icon">💳</span>
          <span>支付宝</span>
        </div>
        <div class="login-item" @click="handleWechat">
          <span class="login-icon">💬</span>
          <span>微信</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginId = ref('')
const password = ref('')
const isSubmitting = ref(false)

const canSubmit = computed(() => {
  return loginId.value.trim() && password.value.trim()
})

async function handleLogin() {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  
  try {
    const res = await authAPI.login({
      loginId: loginId.value.trim(),
      password: password.value.trim()
    })
    
    if (res.success) {
      userStore.login(res.data)
      const event = new CustomEvent('showToast', { detail: '登录成功' })
      window.dispatchEvent(event)
      router.push('/')
    } else {
      const event = new CustomEvent('showToast', { detail: res.message || '登录失败' })
      window.dispatchEvent(event)
    }
  } catch (err) {
    const event = new CustomEvent('showToast', { detail: err.message || '登录失败' })
    window.dispatchEvent(event)
  } finally {
    isSubmitting.value = false
  }
}

function goToRegister() {
  router.push('/register')
}

function handleForgot() {
  const event = new CustomEvent('showToast', { detail: '找回密码功能开发中' })
  window.dispatchEvent(event)
}

function generateOpenId() {
  return 'op_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

async function handleSocialLogin(platform) {
  const platformName = platform === 'alipay' ? '支付宝' : '微信'
  
  const event = new CustomEvent('showToast', { detail: `正在打开${platformName}授权...` })
  window.dispatchEvent(event)
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const openId = generateOpenId()
    const nickname = platform === 'alipay' ? `支付宝用户${openId.slice(-4)}` : `微信用户${openId.slice(-4)}`
    
    const res = await authAPI.socialLogin({
      platform,
      openId,
      nickname
    })
    
    if (res.success) {
      userStore.login(res.data)
      const successEvent = new CustomEvent('showToast', { detail: `${platformName}登录成功` })
      window.dispatchEvent(successEvent)
      router.push('/')
    } else {
      const errorEvent = new CustomEvent('showToast', { detail: res.message || '登录失败' })
      window.dispatchEvent(errorEvent)
    }
  } catch (err) {
    const errorEvent = new CustomEvent('showToast', { detail: err.message || `${platformName}登录失败` })
    window.dispatchEvent(errorEvent)
  }
}

function handleAlipay() {
  handleSocialLogin('alipay')
}

function handleWechat() {
  handleSocialLogin('wechat')
}
</script>

<style scoped>
.login-page {
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.login-header p {
  font-size: 16px;
  color: var(--gray-color);
}

.login-form {
  width: 100%;
  max-width: 350px;
  background: #fff;
  padding: 30px;
  border-radius: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
}

.btn-login {
  width: 100%;
  padding: 15px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}

.btn-login:disabled {
  background: #ccc;
}

.login-links {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  font-size: 14px;
  color: var(--gray-color);
}

.login-links span {
  cursor: pointer;
}

.divider {
  display: flex;
  align-items: center;
  margin: 25px 0;
  font-size: 12px;
  color: var(--gray-color);
}

.divider span {
  padding: 0 15px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.other-login {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.login-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.login-icon {
  font-size: 32px;
}

.login-item span:last-child {
  font-size: 14px;
  color: #333;
}
</style>