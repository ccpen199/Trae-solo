<template>
  <div class="login-page">
    <div class="page-header">
      <h1>校园外卖配送系统</h1>
      <p style="font-size: 14px; opacity: 0.9; margin-top: 8px;">骑手登录</p>
    </div>
    
    <div class="card">
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">手机号</label>
          <input 
            type="tel" 
            v-model="loginForm.phone" 
            class="form-input" 
            placeholder="请输入手机号"
            maxlength="11"
          >
        </div>
        
        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            type="password" 
            v-model="loginForm.password" 
            class="form-input" 
            placeholder="请输入密码"
          >
        </div>
        
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary btn-block"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div style="text-align: center; margin-top: 20px;">
        <span style="color: #999; font-size: 14px;">还没有账号？</span>
        <router-link to="/register" style="color: #667eea; font-size: 14px; margin-left: 4px;">立即注册</router-link>
      </div>
    </div>
    
    <div class="card" style="margin-top: 20px;">
      <h3 style="font-size: 14px; color: #666; margin-bottom: 12px;">测试账号</h3>
      <div style="font-size: 13px; color: #999; line-height: 1.8;">
        <p>测试骑手: 13800138000 / admin123</p>
        <p>校外骑手: 13900139000 / admin123</p>
        <p>管理员: 13800000000 / admin123</p>
      </div>
      <button 
        class="btn btn-secondary btn-block" 
        style="margin-top: 12px;"
        @click="initTestData"
        :disabled="initLoading"
      >
        {{ initLoading ? '初始化中...' : '初始化测试数据' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { authApi, commonApi } from '../api'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({
  phone: '',
  password: ''
})
const error = ref('')
const loading = ref(false)
const initLoading = ref(false)

const handleLogin = async () => {
  error.value = ''
  
  if (!loginForm.value.phone.trim()) {
    error.value = '请输入手机号'
    return
  }
  
  if (!loginForm.value.password) {
    error.value = '请输入密码'
    return
  }
  
  loading.value = true
  try {
    const response = await authApi.login(loginForm.value.phone, loginForm.value.password)
    
    if (response.data.success) {
      userStore.setToken(response.data.data.token)
      userStore.setUserInfo(response.data.data.user)
      router.push('/rider')
    } else {
      error.value = response.data.message || '登录失败'
    }
  } catch (err) {
    error.value = err.response?.data?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const initTestData = async () => {
  initLoading.value = true
  try {
    const response = await commonApi.initAdmin()
    alert(response.data.message || '初始化成功')
  } catch (err) {
    alert(err.response?.data?.message || '初始化失败')
  } finally {
    initLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
}
</style>
