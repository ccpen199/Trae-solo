<template>
  <div class="login-container">
    <div class="login-background">
      <div class="deco-circle deco-circle-1"></div>
      <div class="deco-circle deco-circle-2"></div>
      <div class="deco-circle deco-circle-3"></div>
    </div>
    <el-card class="login-card" shadow="always">
      <div class="login-header">
        <div class="logo-icon">
          <el-icon :size="48"><Refresh /></el-icon>
        </div>
        <h1 class="platform-title">再生资源产业互联网交易平台</h1>
        <p class="platform-subtitle">绿色环保 · 循环经济 · 智慧交易</p>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item prop="role">
          <el-select
            v-model="loginForm.role"
            placeholder="请选择角色"
            size="large"
            style="width: 100%"
          >
            <el-option label="产废方" value="producer" />
            <el-option label="收废商" value="collector" />
            <el-option label="利废厂" value="processor" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
            <el-link type="primary" :underline="false" @click="handleForgotPassword">忘记密码？</el-link>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
        <div class="register-link">
          还没有账号？
          <el-link type="primary" :underline="false" @click="goToRegister">去注册</el-link>
        </div>
      </el-form>
    </el-card>
    <div class="login-footer">
      <p>© 2024 再生资源产业互联网交易平台 版权所有</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  role: '',
  rememberMe: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password,
      role: loginForm.role
    })
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message || '登录失败，请检查用户名和密码')
    }
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = () => {
  ElMessage.info('请联系管理员重置密码')
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.3;
}

.deco-circle-1 {
  width: 400px;
  height: 400px;
  background: #81c784;
  top: -100px;
  right: -100px;
}

.deco-circle-2 {
  width: 300px;
  height: 300px;
  background: #a5d6a7;
  bottom: 100px;
  left: -80px;
}

.deco-circle-3 {
  width: 200px;
  height: 200px;
  background: #c5e1a5;
  bottom: -50px;
  right: 20%;
}

.login-card {
  width: 420px;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  box-shadow: 0 20px 60px rgba(102, 187, 106, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 24px rgba(102, 187, 106, 0.4);
}

.platform-title {
  font-size: 22px;
  font-weight: 600;
  color: #2e7d32;
  margin: 0 0 8px 0;
}

.platform-subtitle {
  font-size: 14px;
  color: #66bb6a;
  margin: 0;
}

.login-form {
  margin-top: 24px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #90a4ae;
}

.login-footer {
  position: absolute;
  bottom: 20px;
  color: rgba(46, 125, 50, 0.6);
  font-size: 12px;
}
</style>
