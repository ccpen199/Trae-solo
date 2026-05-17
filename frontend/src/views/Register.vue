<template>
  <div class="register-page">
    <van-nav-bar title="注册" left-arrow @click-left="goBack" />
    
    <div class="register-content">
      <div class="logo-area">
        <div class="logo">💪</div>
        <h2>开启健身之旅</h2>
      </div>
      
      <van-form @submit="handleRegister">
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
            v-model="form.nickname"
            label="昵称"
            placeholder="请输入昵称"
            :rules="[{ required: true, message: '请输入昵称' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            label="密码"
            placeholder="请输入密码（至少6位）"
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
            注册
          </van-button>
          
          <p class="login-tip">
            已有账号？
            <span @click="goToLogin">立即登录</span>
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
  nickname: '',
  password: ''
})

async function handleRegister() {
  if (!form.phone || !form.nickname || !form.password) {
    showToast('请填写完整信息')
    return
  }
  
  if (form.password.length < 6) {
    showToast('密码至少6位')
    return
  }
  
  loading.value = true
  try {
    const data = await authApi.register(form)
    userStore.setUser(data.user, data.token)
    showToast('注册成功')
    router.replace('/home')
  } catch (err) {
    console.error('注册失败:', err)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function goToLogin() {
  router.push('/login')
}
</script>

<style lang="less" scoped>
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.register-content {
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

.login-tip {
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
