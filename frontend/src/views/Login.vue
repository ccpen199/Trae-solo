<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const phone = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!phone.value) {
    return showToast({ message: '请输入手机号', type: 'fail' })
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    return showToast({ message: '请输入正确的手机号', type: 'fail' })
  }
  if (!password.value) {
    return showToast({ message: '请输入密码', type: 'fail' })
  }

  loading.value = true
  try {
    const res = await login(phone.value, password.value)
    userStore.setToken(res.data.token)
    userStore.setUser(res.data.user)
    
    const redirect = route.query.redirect as string
    router.push(redirect || '/home')
  } catch (err) {
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-page">
    <van-nav-bar title="登录" left-arrow @click-left="router.back()" />

    <div class="login-content">
      <div class="logo-section">
        <van-icon name="gold-coin-o" size="64" color="#1989fa" />
        <h1 class="app-title">积木盒子</h1>
        <p class="app-desc">安全稳健的理财平台</p>
      </div>

      <div class="form-section">
        <van-field
          v-model="phone"
          type="tel"
          label="手机号"
          placeholder="请输入手机号"
          maxlength="11"
        >
          <template #left-icon>
            <van-icon name="phone-o" />
          </template>
        </van-field>

        <van-field
          v-model="password"
          type="password"
          label="密码"
          placeholder="请输入密码"
        >
          <template #left-icon>
            <van-icon name="lock" />
          </template>
        </van-field>

        <div class="form-actions">
          <van-button
            type="primary"
            block
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </van-button>
        </div>

        <div class="register-link">
          还没有账号？
          <span class="link" @click="goToRegister">立即注册</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: white;
}

.login-content {
  padding: 40px 24px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48px;
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 16px 0 8px;
}

.app-desc {
  font-size: 14px;
  color: #999;
}

.form-section {
  max-width: 400px;
  margin: 0 auto;
}

.form-actions {
  margin-top: 32px;
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.link {
  color: #1989fa;
  cursor: pointer;
}
</style>
