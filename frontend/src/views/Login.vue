<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">
          <span class="logo-icon">🏠</span>
          <span class="logo-text">美团民宿</span>
        </div>
        <h2>欢迎回来</h2>
        <p>登录后体验更多精彩活动</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="请输入用户名"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码"
            class="form-input"
          />
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading">登录中...</span>
          <span v-else>登录</span>
        </button>
      </form>

      <div class="links">
        <router-link to="/register">还没有账号？立即注册</router-link>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../api'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!username.value.trim() || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await authAPI.login({
      username: username.value,
      password: password.value
    })

    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.logo-icon {
  font-size: 40px;
  margin-right: 10px;
}

.logo-text {
  font-size: 32px;
  font-weight: bold;
  color: #FF6B6B;
}

.login-header h2 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #333;
}

.login-header p {
  color: #999;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #666;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #FF6B6B;
}

.login-btn {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.3s;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.links {
  text-align: center;
  margin-top: 20px;
}

.links a {
  color: #FF6B6B;
  text-decoration: none;
  font-size: 14px;
}

.error-message {
  text-align: center;
  color: #FF6B6B;
  margin-top: 15px;
  font-size: 14px;
}
</style>