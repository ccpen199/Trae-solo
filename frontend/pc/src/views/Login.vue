<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>RetailPOS 登录</h1>
        <p>线下门店管理系统</p>
      </div>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <p>© 2024 RetailPOS. 保留所有权利</p>
      </div>
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

const loginForm = reactive({
  username: 'admin',
  password: 'admin123'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const response = await axios.post('/api/auth/login', {
      username: loginForm.username,
      password: loginForm.password
    })
    
    if (response.data.success) {
      localStorage.setItem('pos_token', 'token')
      localStorage.setItem('userInfo', JSON.stringify(response.data.data))
      
      const userInfo = response.data.data
      if (userInfo.role === 'CLERK') {
        router.push('/cashier')
      } else if (userInfo.role === 'MANAGER') {
        router.push('/manager')
      } else if (userInfo.role === 'FINANCE') {
        router.push('/finance')
      }
    } else {
      ElMessage.error(response.data.message)
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
}

.login-box {
  width: 400px;
  background: white;
  border-radius: 10px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 24px;
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
  height: 40px;
  font-size: 16px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #999;
}
</style>