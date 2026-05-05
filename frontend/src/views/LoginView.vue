<template>
  <div class="login-page">
    <div class="login-container">
      <el-card shadow="hover" class="login-card">
        <div class="login-header">
          <el-icon :size="48" color="#409EFF"><User /></el-icon>
          <h2>欢迎登录智汇教育</h2>
          <p>开启您的学习之旅</p>
        </div>
        
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名或邮箱"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
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
          <span>还没有账号？</span>
          <router-link to="/register">立即注册</router-link>
        </div>

        <div class="test-accounts">
          <el-divider content-position="left">测试账号</el-divider>
          <p>管理员: admin / 123456</p>
          <p>教师: teacher / 123456</p>
          <p>学生: student / 123456</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { api } from '@/utils/request'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const response = await api.post('/users/login', loginForm)
      
      if (response.data.success) {
        const { token, user } = response.data.data
        
        userStore.setToken(token)
        userStore.setUser(user)
        
        ElMessage.success('登录成功')
        
        const redirect = route.query.redirect as string
        router.push(redirect || '/')
      } else {
        ElMessage.error(response.data.message || '登录失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        ElMessage.error(error.response.data.message)
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss">
.login-page {
  min-height: calc(100vh - 64px - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .login-container {
    width: 100%;
    max-width: 420px;
  }

  .login-card {
    .login-header {
      text-align: center;
      margin-bottom: 32px;

      h2 {
        margin: 16px 0 8px;
        font-size: 24px;
        color: #303133;
      }

      p {
        color: #909399;
        font-size: 14px;
      }
    }

    .login-form {
      .el-form-item {
        margin-bottom: 24px;
      }

      .login-btn {
        width: 100%;
      }
    }

    .login-footer {
      text-align: center;
      font-size: 14px;
      color: #909399;

      a {
        color: #409EFF;
        text-decoration: none;
        margin-left: 4px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .test-accounts {
      margin-top: 24px;
      padding-top: 16px;

      p {
        font-size: 13px;
        color: #909399;
        margin: 4px 0;
      }
    }
  }
}
</style>
