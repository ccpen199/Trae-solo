<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '../api'
import { useUserStore } from '../stores/user'
import Header from '../components/Header.vue'

const router = useRouter()
const userStore = useUserStore()

const isRegister = ref(false)
const username = ref('')
const password = ref('')
const phone = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (!username.value || !password.value) {
    error.value = '请填写用户名和密码'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const res = isRegister.value 
      ? await userApi.register({ username: username.value, password: password.value, phone: phone.value })
      : await userApi.login({ username: username.value, password: password.value })
    
    if (res.code === 0) {
      userStore.setUser(res.data)
      router.push('/profile')
    } else {
      error.value = res.message || '操作失败'
    }
  } catch (e) {
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

function useDemo() {
  username.value = 'demo'
  password.value = 'demo123'
}
</script>

<template>
  <div class="login-page">
    <Header />
    
    <main class="main-content">
      <div class="login-card">
        <h1 class="login-title">{{ isRegister ? '注册账号' : '登录账号' }}</h1>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="username" 
            type="text" 
            class="form-input" 
            placeholder="请输入用户名"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="password" 
            type="password" 
            class="form-input" 
            placeholder="请输入密码"
          />
        </div>
        
        <div v-if="isRegister" class="form-group">
          <label class="form-label">手机号（可选）</label>
          <input 
            v-model="phone" 
            type="tel" 
            class="form-input" 
            placeholder="请输入手机号"
          />
        </div>
        
        <button 
          class="btn btn-primary submit-btn" 
          @click="submit"
          :disabled="loading"
        >
          {{ loading ? '处理中...' : (isRegister ? '注册' : '登录') }}
        </button>
        
        <div class="switch-mode">
          <span>{{ isRegister ? '已有账号？' : '还没有账号？' }}</span>
          <button class="switch-btn" @click="isRegister = !isRegister">
            {{ isRegister ? '去登录' : '去注册' }}
          </button>
        </div>
        
        <div class="demo-tip" v-if="!isRegister">
          <span>演示账号：demo / demo123</span>
          <button class="use-demo-btn" @click="useDemo">一键填写</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 32px;
  color: var(--text-color);
}

.error-message {
  padding: 12px;
  background: #fff5f5;
  color: #e53e3e;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-top: 8px;
}

.switch-mode {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-light);
}

.switch-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 14px;
  margin-left: 4px;
}

.switch-btn:hover {
  text-decoration: underline;
}

.demo-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-light);
}

.use-demo-btn {
  background: none;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.use-demo-btn:hover {
  background: var(--primary-color);
  color: white;
}
</style>
