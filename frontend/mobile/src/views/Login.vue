<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>RetailPOS</h1>
        <p>线下门店管理系统</p>
      </div>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="loginForm.phone" placeholder="请输入手机号" prefix-icon="Phone" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
        <div class="login-footer">
          <el-button type="text" @click="switchMode">
            {{ isMemberLogin ? '店长登录' : '会员登录' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)
const isMemberLogin = ref(true)

const loginForm = reactive({
  phone: '',
  password: '123456'
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const switchMode = () => {
  isMemberLogin.value = !isMemberLogin.value
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    if (isMemberLogin.value) {
      const response = await axios.get(`/api/member/identify?identifier=${loginForm.phone}`)
      if (response.data.success) {
        localStorage.setItem('mobile_token', 'member_token')
        localStorage.setItem('memberInfo', JSON.stringify(response.data.data))
        router.push('/member/home')
      } else {
        ElMessage.error(response.data.message)
      }
    } else {
      const response = await axios.post('/api/auth/login', {
        username: loginForm.phone,
        password: loginForm.password
      })
      if (response.data.success) {
        localStorage.setItem('mobile_token', 'store_token')
        localStorage.setItem('userInfo', JSON.stringify(response.data.data))
        router.push('/store/dashboard')
      } else {
        ElMessage.error(response.data.message)
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  margin-top: 20px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}
</style>