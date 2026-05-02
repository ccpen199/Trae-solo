<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='28' fill='%2367c23a'/%3E%3Cpath d='M30 12L15 30h8v18h14V30h8z' fill='white'/%3E%3C/svg%3E" alt="logo">
        <h1>光伏电站运维系统</h1>
        <p class="subtitle">PV Operations Management System</p>
      </div>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名" size="large" prefix-icon="User">
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          >
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading" 
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <div class="test-accounts">
          <p>测试账号：</p>
          <div class="account-list">
            <span @click="fillAccount('admin', 'admin123')">管理员: admin/admin123</span>
            <span @click="fillAccount('owner', 'owner123')">业主: owner/owner123</span>
            <span @click="fillAccount('worker', 'worker123')">工人: worker/worker123</span>
            <span @click="fillAccount('investor', 'investor123')">投资人: investor/investor123</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="login-bg">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm.username, loginForm.password)
        ElMessage.success('登录成功')
        
        const redirect = route.query.redirect || '/dashboard'
        router.push(redirect)
      } catch (error) {
        console.error('Login error:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

const fillAccount = (username, password) => {
  loginForm.username = username
  loginForm.password = password
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-box {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  margin: 16px 0 8px 0;
  font-size: 24px;
  color: #303133;
  font-weight: 600;
}

.login-header .subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-bottom: 30px;
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(135deg, #768ff0 0%, #855bb3 100%);
}

.login-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.test-accounts p {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #909399;
}

.account-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.account-list span {
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  padding: 4px 8px;
  background: #ecf5ff;
  border-radius: 4px;
  transition: all 0.2s;
}

.account-list span:hover {
  background: #409eff;
  color: white;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  right: -50px;
  animation-delay: -5s;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(50px, -50px) scale(1.05);
  }
  50% {
    transform: translate(100px, 0) scale(1);
  }
  75% {
    transform: translate(50px, 50px) scale(0.95);
  }
}
</style>
