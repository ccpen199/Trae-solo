<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <div class="logo">
          <span class="logo-icon">🏠</span>
          <span class="logo-text">美团民宿</span>
        </div>
        <h2>创建账号</h2>
        <p>开启你的活动探索之旅</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
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
          <label>邮箱（选填）</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="请输入邮箱"
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

        <div class="form-group">
          <label>确认密码</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
            class="form-input"
          />
        </div>

        <button type="submit" class="register-btn" :disabled="loading">
          <span v-if="loading">注册中...</span>
          <span v-else>注册</span>
        </button>
      </form>

      <div class="links">
        <router-link to="/login">已有账号？立即登录</router-link>
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
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!username.value.trim()) {
    error.value = '请输入用户名'
    return
  }

  if (!password.value) {
    error.value = '请输入密码'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await authAPI.register({
      username: username.value,
      email: email.value || null,
      password: password.value
    })

    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.register-header {
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
  color: #667eea;
}

.register-header h2 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #333;
}

.register-header p {
  color: #999;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  border-color: #667eea;
}

.register-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.3s;
  margin-top: 10px;
}

.register-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.links {
  text-align: center;
  margin-top: 20px;
}

.links a {
  color: #667eea;
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