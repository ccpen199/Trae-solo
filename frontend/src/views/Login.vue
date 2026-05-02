<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
    <div class="card" style="width: 400px;">
      <div class="card-header text-center">
        <div class="text-3xl mb-2">📁</div>
        <h1 class="text-xl font-bold">文件存储与网盘系统</h1>
        <p class="text-secondary text-sm mt-1">协同办公业务系统</p>
      </div>
      
      <div class="card-body">
        <form @submit.prevent="handleLogin">
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input 
              type="text" 
              v-model="username" 
              class="form-input"
              placeholder="请输入用户名"
              required
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">密码</label>
            <input 
              type="password" 
              v-model="password" 
              class="form-input"
              placeholder="请输入密码"
              required
              :disabled="loading"
              @keyup.enter="handleLogin"
            />
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary w-full"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner mr-2"></span>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>
      
      <div class="card-footer text-center text-xs text-secondary">
        <p>默认账号：</p>
        <p>管理员: admin / admin123</p>
        <p>普通用户: user1 / user123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

async function handleLogin() {
  if (!username.value || !password.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(username.value, password.value)
    router.push('/files')
  } catch (e: any) {
    error.value = e.response?.data?.error || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, var(--primary-color), var(--primary-hover));
}

.text-3xl {
  font-size: 1.875rem;
}

.text-xl {
  font-size: 1.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style>
