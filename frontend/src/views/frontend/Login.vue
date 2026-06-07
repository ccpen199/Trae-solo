<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <el-icon :size="48" color="#667eea"><DataLine /></el-icon>
      </div>
      <h2>欢迎登录</h2>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">立即注册</router-link>
      </div>
      <div class="auth-divider">
        <span>或</span>
      </div>
      <div class="auth-tips">
        <p>测试账号：<strong>admin</strong> / <strong>admin123</strong></p>
        <p>普通账号：<strong>user</strong> / <strong>user123</strong></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataLine, User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
  } catch (e) {
    return
  }
  
  loading.value = true
  try {
    await authStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.auth-logo {
  text-align: center;
  margin-bottom: 20px;
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #1f2f3d;
  font-size: 24px;
  font-weight: 600;
}

.auth-footer {
  text-align: center;
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

.link {
  color: #409eff;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}

.link:hover {
  color: #667eea;
}

.auth-divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
}

.auth-divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: #ebeef5;
}

.auth-divider span {
  position: relative;
  background: #fff;
  padding: 0 12px;
  color: #909399;
  font-size: 13px;
}

.auth-tips {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
  color: #606266;
}

.auth-tips p {
  margin: 0 0 8px;
}

.auth-tips p:last-child {
  margin-bottom: 0;
}

.auth-tips strong {
  color: #1f2f3d;
  font-weight: 500;
}
</style>
