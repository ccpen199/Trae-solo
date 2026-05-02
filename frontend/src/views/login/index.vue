<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon class="logo-icon"><Food /></el-icon>
        <h1 class="login-title">外卖聚合接单系统</h1>
        <p class="login-subtitle">多平台订单统一管理，提升接单效率</p>
      </div>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" size="large" />
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
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <div class="quick-login">
          <span class="quick-title">快捷登录：</span>
          <el-tag type="info" effect="plain" class="quick-tag" @click="quickLogin('merchant')">
            商家账号
          </el-tag>
          <el-tag type="info" effect="plain" class="quick-tag" @click="quickLogin('clerk')">
            店员账号
          </el-tag>
          <el-tag type="info" effect="plain" class="quick-tag" @click="quickLogin('rider')">
            骑手账号
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

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
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await userStore.handleLogin(loginForm.username, loginForm.password)
        if (res.code === 200) {
          ElMessage.success('登录成功')
          const redirect = route.query.redirect as string || '/dashboard'
          router.push(redirect)
        } else {
          ElMessage.error(res.message || '登录失败')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}

function quickLogin(type: string) {
  const accounts = {
    merchant: { username: 'merchant', password: '123456' },
    clerk: { username: 'clerk', password: '123456' },
    rider: { username: 'rider', password: '123456' }
  }
  
  const account = accounts[type as keyof typeof accounts]
  if (account) {
    loginForm.username = account.username
    loginForm.password = account.password
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  
  .logo-icon {
    font-size: 48px;
    color: #409eff;
    margin-bottom: 16px;
  }
  
  .login-title {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px 0;
  }
  
  .login-subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.login-form {
  .login-button {
    width: 100%;
    font-size: 16px;
  }
}

.login-footer {
  margin-top: 24px;
  
  .quick-login {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    
    .quick-title {
      font-size: 13px;
      color: #909399;
    }
    
    .quick-tag {
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        color: #409eff;
        border-color: #409eff;
      }
    }
  }
}
</style>
