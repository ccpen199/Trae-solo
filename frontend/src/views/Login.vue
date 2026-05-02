<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2 class="login-title">
          <el-icon :size="32" color="#409eff"><Ship /></el-icon>
          船运订舱系统
        </h2>
        <p class="login-subtitle">让订舱更高效、更透明</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <p class="tips-title">测试账号：</p>
        <div class="tips-list">
          <div class="tips-item">
            <span class="role">货主：</span>
            <span class="account">consignor1 / 123456</span>
          </div>
          <div class="tips-item">
            <span class="role">货代：</span>
            <span class="account">forwarder1 / 123456</span>
          </div>
          <div class="tips-item">
            <span class="role">船公司：</span>
            <span class="account">shipping1 / 123456</span>
          </div>
          <div class="tips-item">
            <span class="role">港口：</span>
            <span class="account">port1 / 123456</span>
          </div>
          <div class="tips-item">
            <span class="role">报关行：</span>
            <span class="account">customs1 / 123456</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/userStore'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const user = await userStore.login(loginForm.username, loginForm.password)
        if (user) {
          ElMessage.success('登录成功')
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Login error:', error)
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
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-bottom: 30px;
}

.login-button {
  width: 100%;
}

.login-tips {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.tips-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 600;
}

.tips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tips-item {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.tips-item .role {
  color: #909399;
}

.tips-item .account {
  color: #409eff;
  font-family: 'Courier New', monospace;
}
</style>
