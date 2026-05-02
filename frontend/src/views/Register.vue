<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <span class="logo-icon">🎮</span>
        <h1 class="title">注册新账号</h1>
        <p class="subtitle">加入教育互动小游戏平台</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="form.username" 
            type="text" 
            class="form-input"
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input 
            v-model="form.nickname" 
            type="text" 
            class="form-input"
            placeholder="请输入昵称"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password" 
            type="password" 
            class="form-input"
            placeholder="请输入密码"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input 
            v-model="form.confirmPassword" 
            type="password" 
            class="form-input"
            placeholder="请再次输入密码"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">身份选择</label>
          <div class="role-select">
            <label 
              class="role-option" 
              :class="{ active: form.role === 'student' }"
            >
              <input 
                type="radio" 
                v-model="form.role" 
                value="student"
                class="radio-input"
              />
              <span class="role-icon">👦</span>
              <span class="role-name">学生</span>
            </label>
            <label 
              class="role-option" 
              :class="{ active: form.role === 'teacher' }"
            >
              <input 
                type="radio" 
                v-model="form.role" 
                value="teacher"
                class="radio-input"
              />
              <span class="role-icon">👨‍🏫</span>
              <span class="role-name">老师</span>
            </label>
          </div>
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <button 
          type="submit" 
          class="register-btn"
          :disabled="loading"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="register-footer">
        <p>已有账号？<router-link to="/login" class="link">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { userApi } from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  role: 'student'
})
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!form.value.username || !form.value.password) {
    error.value = '请填写用户名和密码'
    return
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  if (form.value.password.length < 6) {
    error.value = '密码长度至少6位'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await userApi.register({
      username: form.value.username,
      password: form.value.password,
      role: form.value.role,
      nickname: form.value.nickname || form.value.username
    })
    
    userStore.setToken(response.data.token)
    userStore.setUser(response.data.user)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 60px;
  display: block;
  margin-bottom: 10px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.subtitle {
  color: #888;
  font-size: 14px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-input {
  padding: 14px 16px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.role-select {
  display: flex;
  gap: 16px;
}

.role-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.radio-input {
  display: none;
}

.role-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.role-name {
  font-weight: 600;
  color: #333;
}

.error-message {
  background: #fff0f0;
  color: #ff6b6b;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.register-btn {
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  color: #888;
  font-size: 14px;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}
</style>
