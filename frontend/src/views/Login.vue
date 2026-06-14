<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon size="48" color="#409eff"><OfficeBuilding /></el-icon>
        <h2>智慧社区物业管理系统</h2>
        <p>安全便捷的社区生活服务平台</p>
      </div>
      
      <el-form ref="loginForm" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <span>还没有账号？</span>
        <el-button type="primary" link @click="goToRegister">立即注册</el-button>
      </div>
      
      <div class="demo-accounts">
        <el-divider>演示账号</el-divider>
        <div class="account-item">
          <span>管理员：</span>
          <el-tag type="danger">admin / admin123</el-tag>
        </div>
        <div class="account-item">
          <span>物业：</span>
          <el-tag type="warning">property / prop123</el-tag>
        </div>
        <div class="account-item">
          <span>住户：</span>
          <el-tag type="success">resident1 / res123</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { login } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const loginForm = ref(null)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  try {
    await loginForm.value.validate()
    loading.value = true
    const res = await login(form)
    userStore.setUser(res.data)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (err) {
    ElMessage.error(err.message || '登录失败')
  } finally {
    loading.value = false
  }
}

function goToRegister() {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
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

.login-header h2 {
  margin: 15px 0 8px;
  color: #303133;
  font-size: 24px;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.login-footer {
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
}

.demo-accounts {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  color: #606266;
}
</style>
