<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand">
          <el-icon :size="48" color="#409eff">
            <ChatDotRound />
          </el-icon>
          <h1>QA Community</h1>
          <p>连接专家与提问者的知识共享平台</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon :size="24" color="#409eff"><Connection /></el-icon>
            <span>智能专家匹配</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24" color="#67c23a"><Share /></el-icon>
            <span>知识图谱引擎</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24" color="#e6a23c"><Trophy /></el-icon>
            <span>信用评级体系</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24" color="#f56c6c"><Wallet /></el-icon>
            <span>智能结算引擎</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-container">
          <h2>欢迎回来</h2>
          <p class="form-subtitle">请登录您的账号</p>

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
                placeholder="用户名或邮箱"
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
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
                <el-link type="primary">忘记密码？</el-link>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="isLoading"
                class="login-button"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>

          <div class="divider">
            <span>或</span>
          </div>

          <div class="social-login">
            <el-button circle>
              <el-icon><ChatDotRound /></el-icon>
            </el-button>
            <el-button circle>
              <el-icon><Share /></el-icon>
            </el-button>
            <el-button circle>
              <el-icon><Connection /></el-icon>
            </el-button>
          </div>

          <p class="register-link">
            还没有账号？
            <router-link to="/register">立即注册</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const isLoading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 2, message: '用户名至少2个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      try {
        const result = await userStore.login({
          username: loginForm.username,
          password: loginForm.password
        })

        if (result.success) {
          ElMessage.success('登录成功')
          
          const redirect = route.query.redirect || '/'
          router.push(redirect)
        } else {
          ElMessage.error(result.error)
        }
      } catch (error) {
        console.error('Login error:', error)
        ElMessage.error('登录失败，请检查用户名和密码')
      } finally {
        isLoading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  width: 100vw;
  margin: -20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 28px;
    margin: 16px 0 8px;
    font-weight: 600;
  }

  p {
    font-size: 14px;
    color: #a0aec0;
    opacity: 0.8;
  }
}

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #cbd5e0;
  transition: transform 0.3s;

  &:hover {
    transform: translateX(8px);
  }
}

.login-right {
  flex: 1;
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-form-container {
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .form-subtitle {
    font-size: 14px;
    color: #909399;
    margin-bottom: 32px;
  }
}

.login-form {
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .login-button {
    width: 100%;
  }
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e4e7ed;
  }

  span {
    padding: 0 16px;
    font-size: 12px;
    color: #909399;
  }
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #606266;

  a {
    color: #409eff;
    text-decoration: none;
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-left {
    padding: 30px 20px;
  }

  .login-right {
    padding: 30px 20px;
  }

  .features {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
  }
}
</style>
