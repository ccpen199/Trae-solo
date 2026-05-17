<template>
  <div class="login-page">
    <van-nav-bar title="登录" left-arrow @click-left="goBack" />
    
    <div class="login-content">
      <div class="logo-area">
        <div class="logo">🏃</div>
        <h2>欢迎回来</h2>
      </div>
      
      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="form.phone"
            type="tel"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }]"
            maxlength="11"
          />
          <van-field
            v-model="form.password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>
        
        <div class="submit-area">
          <van-button
            type="primary"
            size="large"
            block
            native-type="submit"
            :loading="loading"
            :disabled="loading"
            class="submit-btn"
          >
            登录
          </van-button>
          
          <p class="register-tip">
            还没有账号？
            <span @click="goToRegister">立即注册</span>
          </p>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { authApi } from '../api'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  phone: '',
  password: ''
})

async function handleLogin() {
  if (!form.phone || !form.password) {
    showToast('请填写完整信息')
    return
  }
  
  loading.value = true
  try {
    const data = await authApi.login(form)
    userStore.setUser(data.user, data.token)
    showToast('登录成功')
    router.replace('/home')
  } catch (err) {
    console.error('登录失败:', err)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function goToRegister() {
  router.push('/register')
}
</script>

<style lang="less" scoped>
.login-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.login-content {
  padding: 40px 20px;
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  font-size: 60px;
  margin-bottom: 12px;
}

h2 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.submit-area {
  padding: 20px;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.register-tip {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
  
  span {
    color: #667eea;
    cursor: pointer;
  }
}
</style>
