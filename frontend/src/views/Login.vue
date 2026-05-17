<template>
  <div class="login-page">
    <div class="logo-section">
      <van-icon name="like-o" size="60" color="#ff6b6b" />
      <h1>宠爱</h1>
      <p>宠物社交服务平台</p>
    </div>

    <van-form @submit="handleSubmit" class="login-form">
      <van-field
        v-model="username"
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        :rules="[{ required: true, message: '请输入用户名' }]"
      />
      <van-field
        v-model="password"
        type="password"
        name="password"
        label="密码"
        placeholder="请输入密码"
        :rules="[{ required: true, message: '请输入密码' }]"
      />
      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
      </div>
    </van-form>

    <div class="register-link">
      还没有账号？
      <router-link to="/register">立即注册</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  try {
    await userStore.login(username.value, password.value)
    showToast('登录成功')
    router.push('/community')
  } catch {
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  padding: 60px 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-section h1 {
  font-size: 28px;
  color: #333;
  margin: 10px 0 5px;
}

.logo-section p {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-top: 30px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #ff6b6b;
  text-decoration: none;
}
</style>
