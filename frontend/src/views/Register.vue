<template>
  <div class="register-page">
    <div class="logo-section">
      <van-icon name="like-o" size="50" color="#ff6b6b" />
      <h2>注册账号</h2>
    </div>

    <van-form @submit="handleSubmit" class="register-form">
      <van-field
        v-model="username"
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        :rules="[{ required: true, message: '请输入用户名' }]"
      />
      <van-field
        v-model="nickname"
        name="nickname"
        label="昵称"
        placeholder="请输入昵称"
      />
      <van-field
        v-model="password"
        type="password"
        name="password"
        label="密码"
        placeholder="请输入密码"
        :rules="[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]"
      />
      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          注册
        </van-button>
      </div>
    </van-form>

    <div class="login-link">
      已有账号？
      <router-link to="/login">立即登录</router-link>
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
const nickname = ref('')
const password = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  try {
    await userStore.register(username.value, password.value, nickname.value)
    showToast('注册成功')
    router.push('/community')
  } catch {
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  padding: 40px 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-section h2 {
  font-size: 22px;
  color: #333;
  margin: 10px 0;
}

.register-form {
  margin-top: 20px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #ff6b6b;
  text-decoration: none;
}
</style>
