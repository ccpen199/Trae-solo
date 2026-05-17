<template>
  <div class="page-container login-page">
    <van-nav-bar title="登录" left-arrow @click-left="$router.back()" />
    <div class="page-content">
      <div class="logo-section">
        <div class="logo">西窗烛</div>
        <p class="slogan">中国诗词与传统文化</p>
      </div>

      <van-form @submit="handleLogin" class="login-form">
        <van-cell-group inset>
          <van-field
            v-model="contact"
            name="contact"
            label="账号"
            placeholder="手机号/邮箱/用户名"
            :rules="[{ required: true, message: '请输入账号' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            登录
          </van-button>
        </div>

        <div class="form-links">
          <span @click="goRegister">还没有账号？去注册</span>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { authApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const contact = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    const res = await authApi.login(contact.value, password.value)
    userStore.setToken(res.data.token)
    userStore.setUser(res.data.user)
    showToast('登录成功')
    router.replace('/excerpt')
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  router.push('/privacy')
}
</script>

<style lang="less" scoped>
.login-page {
  background: linear-gradient(135deg, #faf8f5 0%, #f5efe6 100%);
}

.logo-section {
  text-align: center;
  padding: 60px 0 40px;

  .logo {
    font-size: 36px;
    font-weight: bold;
    color: #8b5a2b;
    letter-spacing: 8px;
    margin-bottom: 12px;
  }

  .slogan {
    font-size: 14px;
    color: #666;
  }
}

.login-form {
  .form-links {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #8b5a2b;

    span {
      cursor: pointer;
    }
  }
}
</style>
