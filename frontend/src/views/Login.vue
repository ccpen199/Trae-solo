<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <span class="logo-icon">✈️</span>
        <h2>航班订票系统</h2>
        <p>Flight Booking System</p>
      </div>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名" 
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password"
            placeholder="密码" 
            size="large"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="test-accounts">
        <p class="title">测试账号：</p>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="管理员">admin / 123456</el-descriptions-item>
          <el-descriptions-item label="旅客">passenger1 / 123456</el-descriptions-item>
          <el-descriptions-item label="代理">agent1 / 123456</el-descriptions-item>
          <el-descriptions-item label="客服">service1 / 123456</el-descriptions-item>
          <el-descriptions-item label="航司">airline1 / 123456</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
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
        router.push('/dashboard')
      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.login-header h2 {
  margin: 0;
  font-size: 28px;
  color: #333;
}

.login-header p {
  margin: 5px 0 0;
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
}

.test-accounts {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.test-accounts .title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}
</style>
