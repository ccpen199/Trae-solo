<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-logo">
        <el-icon :size="48" color="#667eea"><House /></el-icon>
        <h1>标准化套餐系统</h1>
      </div>
      
      <el-card class="login-card">
        <template #header>
          <div class="card-header">
            <span>用户登录</span>
          </div>
        </template>
        
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form">
          <el-form-item prop="phone">
            <el-input 
              v-model="loginForm.phone" 
              placeholder="请输入手机号"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password"
              placeholder="请输入密码（默认手机号后6位）"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-footer">
          <span>还没有账号？</span>
          <router-link to="/register">立即注册</router-link>
        </div>
      </el-card>
      
      <p class="login-tip">提示：注册后默认密码为手机号后6位</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const loginForm = reactive({
  phone: '',
  password: '',
  rememberMe: false
})

const loginRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const loginFormRef = ref(null)
  const form = loginFormRef.value || { validate: () => Promise.resolve() }
  
  try {
    await form.validate()
  } catch {
    return
  }
  
  loading.value = true
  try {
    await userStore.login(loginForm)
    ElMessage.success('登录成功')
    
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error.response?.data?.message || '登录失败，请检查手机号和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.login-logo {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo h1 {
  color: #fff;
  margin-top: 10px;
  font-size: 24px;
  font-weight: bold;
}

.login-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.card-header {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.login-footer span {
  color: #909399;
}

.login-footer a {
  color: #667eea;
  margin-left: 5px;
}

.login-tip {
  text-align: center;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}
</style>
