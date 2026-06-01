<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="title">私信消息系统</h1>
      <p class="subtitle">Message Platform</p>
      <form @submit.prevent="handleSubmit">
        <div class="form-item">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            :disabled="loading"
          />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            :disabled="loading"
            @keyup.enter="handleSubmit"
          />
        </div>
        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <div class="demo-accounts">
        <p class="demo-title">演示账号（点击快速登录）</p>
        <div class="accounts">
          <div class="account-row">
            <span @click="quickLogin('admin', 'admin123')" :class="{ disabled: loading }">管理员 / admin123</span>
            <span @click="quickLogin('platform', 'admin123')" :class="{ disabled: loading }">社区运营 / admin123</span>
          </div>
          <div class="account-row">
            <span @click="quickLogin('moderator1', 'mod123')" :class="{ disabled: loading }">审核员 / mod123</span>
            <span @click="quickLogin('ops', 'admin123')" :class="{ disabled: loading }">运营专员 / admin123</span>
          </div>
          <div class="account-row">
            <span @click="quickLogin('cs1', 'cs123')" :class="{ disabled: loading }">客服 / cs123</span>
            <span @click="quickLogin('user1', 'user123')" :class="{ disabled: loading }">普通用户 / user123</span>
          </div>
        </div>
      </div>
      <div class="debug-info" v-if="error">
        <p class="debug-text">提示：请直接点击上方演示账号按钮快速登录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

onMounted(() => {
  if (route.query.error) {
    error.value = decodeURIComponent(route.query.error)
  }
})

const handleLogin = async (username, password) => {
  if (!username || !password) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await authApi.login({ username: username.trim(), password })

    if (!res.data?.token || !res.data?.user) {
      throw new Error('登录响应数据异常')
    }

    userStore.login(res.data.token, res.data.user)

    form.username = ''
    form.password = ''

    const redirect = route.query.redirect
    if (redirect) {
      router.replace(redirect)
    } else {
      router.replace('/')
    }
  } catch (e) {
    const serverError = e.response?.data?.error
    if (serverError) {
      error.value = serverError
    } else if (e.message && !e.message.includes('timeout')) {
      error.value = e.message
    } else {
      error.value = '登录失败，请检查网络连接或稍后重试'
    }
    form.password = ''
  } finally {
    loading.value = false
  }
}

const handleSubmit = () => {
  handleLogin(form.username, form.password)
}

const quickLogin = (u, p) => {
  if (loading.value) return
  form.username = u
  form.password = p
  error.value = ''
  handleLogin(u, p)
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-box {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: 460px;
}
.title {
  font-size: 24px;
  color: #333;
  text-align: center;
  margin-bottom: 4px;
}
.subtitle {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 30px;
}
.form-item {
  margin-bottom: 20px;
}
.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
}
.form-item input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-item input:focus {
  border-color: #667eea;
}
.btn-login {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-login:hover { opacity: 0.9; }
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
.error {
  color: #e74c3c;
  font-size: 13px;
  margin-top: 12px;
  text-align: center;
}
.demo-accounts {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.demo-title {
  color: #888;
  font-size: 12px;
  margin-bottom: 12px;
}
.account-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.account-row:last-child {
  margin-bottom: 0;
}
.accounts span {
  flex: 1;
  padding: 6px 10px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: background 0.2s;
  text-align: center;
}
.accounts span:hover { background: #e0e4e8; }
.accounts span.disabled { opacity: 0.5; cursor: not-allowed; }
.debug-info { margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.debug-text { color: #999; font-size: 12px; text-align: center; }
</style>
