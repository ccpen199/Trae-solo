<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref<'login' | 'register'>('login')
const loading = ref(false)
const errorMsg = ref('')

const loginForm = reactive({
  phone: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const loginFormRef = ref()
const registerFormRef = ref()

const loginRules = {
  phone: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

function getRedirectPath(role: string): string {
  const redirect = route.query.redirect as string
  if (redirect) return redirect
  
  switch (role) {
    case 'admin':
    case 'platform':
    case 'ops':
    case 'property':
    case 'manufacturer':
      return '/admin/dashboard'
    case 'user':
    default:
      return '/home'
  }
}

async function handleLogin() {
  errorMsg.value = ''
  
  if (loading.value) return

  if (!loginForm.phone) {
    errorMsg.value = '请输入账号'
    ElMessage.warning('请输入账号')
    return
  }
  if (!loginForm.password) {
    errorMsg.value = '请输入密码'
    ElMessage.warning('请输入密码')
    return
  }
  if (loginForm.password.length < 6) {
    errorMsg.value = '密码长度不能少于6位'
    ElMessage.warning('密码长度不能少于6位')
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    console.log('[Login] 开始登录, 账号:', loginForm.phone)
    
    const res = await userStore.login(loginForm.phone, loginForm.password)
    console.log('[Login] 登录API返回成功, userInfo:', userStore.userInfo)

    if (!userStore.userInfo) {
      errorMsg.value = '登录成功但获取用户信息失败，请重试'
      ElMessage.error(errorMsg.value)
      return
    }

    const role = userStore.userInfo.role || 'user'
    const redirectPath = getRedirectPath(role)
    
    console.log('[Login] 准备跳转, 角色:', role, '路径:', redirectPath)
    ElMessage.success(`登录成功！欢迎 ${userStore.userInfo.nickname}（${role}）`)
    
    await router.replace(redirectPath)
    console.log('[Login] 路由跳转完成')
    
  } catch (error: any) {
    console.error('[Login] 登录失败:', error)
    let msg = '登录失败，请检查账号密码'
    
    if (error?.message) {
      msg = error.message
    }
    if (typeof msg === 'string' && msg.includes('Network Error')) {
      msg = '网络连接失败，请检查后端服务是否正常'
    }
    if (typeof msg === 'string' && msg.includes('timeout')) {
      msg = '请求超时，请稍后重试'
    }
    
    errorMsg.value = msg
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

function onLoginFormSubmit(e: Event) {
  e.preventDefault()
  handleLogin()
}

async function handleRegister() {
  if (loading.value) return
  
  const valid = await registerFormRef.value?.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    await userStore.register(registerForm)
    ElMessage.success('注册成功，请登录')
    activeTab.value = 'login'
    loginForm.phone = registerForm.phone
    loginForm.password = ''
  } catch (error: any) {
    const msg = error?.message || '注册失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="title">智能洗衣管理系统</h1>
        <p class="subtitle">便捷洗衣，智能生活</p>
      </div>

      <el-alert type="info" :closable="false" class="demo-accounts">
        <template #title>
          <div class="demo-title">🎯 演示账号（密码均为 123456）</div>
          <div class="demo-list">
            <span class="demo-item"><b>普通用户:</b> 13800138000</span>
            <span class="demo-item"><b>物业方:</b> 13900139000</span>
            <span class="demo-item"><b>设备厂商:</b> 13700137000</span>
            <span class="demo-item"><b>平台运营:</b> platform</span>
            <span class="demo-item"><b>运维:</b> ops</span>
            <span class="demo-item"><b>系统管理员:</b> admin</span>
          </div>
        </template>
      </el-alert>

      <el-alert v-if="errorMsg" type="error" :closable="true" class="login-error" @close="errorMsg = ''">
        <template #title>{{ errorMsg }}</template>
      </el-alert>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="loginForm.phone"
                placeholder="请输入账号（手机号/用户名）"
                size="large"
                clearable
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
            <div class="status-feedback">
              <span v-if="loading" class="status-loading">⏳ 正在登录...</span>
              <span v-else-if="errorMsg" class="status-error">❌ {{ errorMsg }}</span>
              <span v-else class="status-hint">💡 选择上方演示账号一键登录</span>
            </div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="phone">
              <el-input
                v-model="registerForm.phone"
                placeholder="请输入手机号"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请确认密码"
                size="large"
                show-password
              />
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.demo-accounts {
  margin-bottom: 16px;
  border-radius: 8px;

  .demo-title {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .demo-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
    font-size: 12px;

    .demo-item {
      color: #606266;

      b {
        color: #303133;
      }
    }
  }
}

.login-error {
  margin-bottom: 16px;
}

.login-container {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;

  .title {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.login-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }

  :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 500;
  }
}

.login-form-wrapper {
  width: 100%;
}

.login-form {
  width: 100%;

  .submit-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    margin-top: 8px;
  }
}

.status-feedback {
  text-align: center;
  margin-top: 12px;
  font-size: 13px;
  min-height: 20px;

  .status-loading {
    color: #409eff;
  }

  .status-error {
    color: #f56c6c;
  }

  .status-hint {
    color: #909399;
  }
}
</style>
