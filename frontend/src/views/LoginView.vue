<template>
  <div class="container" style="max-width: 400px; margin-top: 4rem;">
    <div class="card card-body" style="padding: 2rem;">
      <h2 style="text-align: center; margin-bottom: 2rem;">
        🔐 管理员登录
      </h2>
      
      <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
      
      <div class="form-group">
        <label class="form-label">用户名</label>
        <input 
          type="text" 
          class="form-input" 
          v-model="formData.username" 
          placeholder="请输入用户名"
          @keyup.enter="handleLogin"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">密码</label>
        <input 
          type="password" 
          class="form-input" 
          v-model="formData.password" 
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </div>
      
      <button 
        class="btn btn-primary" 
        style="width: 100%;"
        @click="handleLogin"
        :disabled="loading"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>
      
      <div style="margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: var(--text-muted);">
        <p>默认账户: admin</p>
        <p>默认密码: admin123</p>
      </div>
      
      <div style="margin-top: 1.5rem; text-align: center;">
        <router-link to="/" class="btn btn-outline btn-sm">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { useStore } from '@/store'

const router = useRouter()
const { setSession } = useStore()

const formData = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!formData.value.username.trim() || !formData.value.password.trim()) {
    errorMessage.value = '请输入用户名和密码'
    return
  }
  
  errorMessage.value = ''
  loading.value = true
  
  try {
    const res = await authApi.login(formData.value.username, formData.value.password)
    
    if (res.data.success) {
      setSession(res.data.data.user, res.data.data.sessionId)
      router.push('/admin')
    } else {
      errorMessage.value = res.data.message || '登录失败'
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
