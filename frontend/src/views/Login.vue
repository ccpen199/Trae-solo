<template>
  <div class="container">
    <div style="padding-top: 80px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="font-size: 80px; margin-bottom: 20px;">🌳</div>
        <h1 style="color: white; font-size: 32px; margin-bottom: 10px;">能量森林</h1>
        <p style="color: rgba(255,255,255,0.8);">公益养成，绿色未来</p>
      </div>

      <div class="card">
        <div class="input-group">
          <label>用户名</label>
          <input v-model="loginForm.username" placeholder="请输入用户名" />
        </div>
        <div class="input-group">
          <label>密码</label>
          <input v-model="loginForm.password" type="password" placeholder="请输入密码" />
        </div>
        <button class="btn btn-primary" style="width: 100%;" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <div style="text-align: center; margin-top: 20px; color: #666;">
          <span>测试账号：user1 / user2 / user3</span>
          <br />
          <span>密码：123456</span>
        </div>
      </div>
    </div>

    <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = ref({
  username: '',
  password: ''
})
const loading = ref(false)
const toastMessage = ref('')

const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => toastMessage.value = '', 2000)
}

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    showToast('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    await authStore.login(loginForm.value.username, loginForm.value.password)
    showToast('登录成功')
    setTimeout(() => router.push('/'), 1000)
  } catch (error) {
    console.error('Login error:', error)
    let errorMsg = '登录失败'
    if (error.response) {
      errorMsg = error.response.data?.detail || `服务器错误 (${error.response.status})`
    } else if (error.request) {
      errorMsg = '网络连接失败，请检查后端服务是否启动'
    } else {
      errorMsg = error.message || '登录失败'
    }
    showToast(errorMsg)
  } finally {
    loading.value = false
  }
}
</script>
