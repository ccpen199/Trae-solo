<template>
  <div class="login-container">
    <div class="login-left">
      <div class="brand-info">
        <h1 class="brand-title">连锁门店总部管理系统</h1>
        <p class="brand-desc">多门店 · 多区域 · 多权限 · 统一管理</p>
      </div>
      <div class="feature-list">
        <div class="feature-item">
          <el-icon class="feature-icon"><OfficeBuilding /></el-icon>
          <div class="feature-text">
            <h4>组织权限管理</h4>
            <p>总部-区域-门店三级管理，精细化权限控制</p>
          </div>
        </div>
        <div class="feature-item">
          <el-icon class="feature-icon"><PriceTag /></el-icon>
          <div class="feature-text">
            <h4>价格策略引擎</h4>
            <p>统一价格体系，毛利率智能校验</p>
          </div>
        </div>
        <div class="feature-item">
          <el-icon class="feature-icon"><Box /></el-icon>
          <div class="feature-text">
            <h4>库存调拨引擎</h4>
            <p>实时库存同步，智能调拨建议</p>
          </div>
        </div>
        <div class="feature-item">
          <el-icon class="feature-icon"><Connection /></el-icon>
          <div class="feature-text">
            <h4>数据同步引擎</h4>
            <p>门店数据实时上报，断网续传保障</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="login-right">
      <div class="login-box">
        <div class="login-header">
          <h2 class="login-title">用户登录</h2>
          <p class="login-subtitle">欢迎使用零售连锁SaaS管理系统</p>
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
              prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item prop="captcha" v-if="showCaptcha">
            <el-row :gutter="10">
              <el-col :span="16">
                <el-input
                  v-model="loginForm.captcha"
                  placeholder="请输入验证码"
                  prefix-icon="Key"
                  size="large"
                  clearable
                />
              </el-col>
              <el-col :span="8">
                <img
                  :src="captchaUrl"
                  alt="验证码"
                  class="captcha-img"
                  @click="refreshCaptcha"
                />
              </el-col>
            </el-row>
          </el-form-item>
          
          <el-form-item>
            <div class="login-options">
              <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
              <a href="#" class="forgot-password">忘记密码？</a>
            </div>
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
          <div class="quick-login">
            <span class="quick-label">快捷登录：</span>
            <el-tooltip content="店长登录" placement="top">
              <el-link type="primary" @click="quickLogin('store')">
                <el-icon><Store /></el-icon>
              </el-link>
            </el-tooltip>
            <el-tooltip content="区域经理登录" placement="top">
              <el-link type="primary" @click="quickLogin('region')">
                <el-icon><OfficeBuilding /></el-icon>
              </el-link>
            </el-tooltip>
            <el-tooltip content="总部管理员登录" placement="top">
              <el-link type="primary" @click="quickLogin('admin')">
                <el-icon><UserFilled /></el-icon>
              </el-link>
            </el-tooltip>
            <el-tooltip content="财务登录" placement="top">
              <el-link type="primary" @click="quickLogin('finance')">
                <el-icon><Wallet /></el-icon>
              </el-link>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import {
  OfficeBuilding,
  PriceTag,
  Box,
  Connection,
  Store,
  UserFilled,
  Wallet,
  User,
  Lock,
  Key
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const showPassword = ref(false)
const showCaptcha = ref(false)
const captchaUrl = ref('')

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  rememberMe: false
})

const loginRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度为6-32个字符', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
})

const quickAccounts = {
  store: { username: 'store_manager', password: '123456' },
  region: { username: 'region_manager', password: '123456' },
  admin: { username: 'admin', password: '123456' },
  finance: { username: 'finance', password: '123456' }
}

function refreshCaptcha() {
  captchaUrl.value = `/api/auth/captcha?t=${Date.now()}`
}

function quickLogin(type) {
  const account = quickAccounts[type]
  if (account) {
    loginForm.username = account.username
    loginForm.password = account.password
  }
}

async function handleLogin() {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm)
        ElMessage.success('登录成功')
        
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
        if (showCaptcha.value) {
          refreshCaptcha()
        }
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  if (showCaptcha.value) {
    refreshCaptcha()
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  .login-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 80px;
    color: #fff;
    
    .brand-info {
      margin-bottom: 60px;
      
      .brand-title {
        font-size: 42px;
        font-weight: 700;
        margin-bottom: 16px;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
      
      .brand-desc {
        font-size: 18px;
        opacity: 0.9;
      }
    }
    
    .feature-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      
      .feature-item {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        transition: all 0.3s;
        
        &:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }
        
        .feature-icon {
          font-size: 28px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        
        .feature-text {
          flex: 1;
          
          h4 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          p {
            font-size: 14px;
            opacity: 0.85;
            line-height: 1.6;
          }
        }
      }
    }
  }
  
  .login-right {
    width: 480px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 60px;
    
    .login-box {
      width: 100%;
      
      .login-header {
        text-align: center;
        margin-bottom: 40px;
        
        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
          margin-bottom: 8px;
        }
        
        .login-subtitle {
          font-size: 14px;
          color: #909399;
        }
      }
      
      .login-form {
        .login-btn {
          width: 100%;
          font-size: 16px;
          font-weight: 500;
          height: 48px;
        }
        
        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .forgot-password {
            color: #409eff;
            font-size: 14px;
            text-decoration: none;
            
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
      
      .captcha-img {
        width: 100%;
        height: 40px;
        cursor: pointer;
        border-radius: 4px;
        border: 1px solid #dcdfe6;
      }
      
      .login-footer {
        margin-top: 40px;
        padding-top: 30px;
        border-top: 1px solid #ebeef5;
        
        .quick-login {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          
          .quick-label {
            color: #909399;
            font-size: 14px;
          }
          
          .el-link {
            font-size: 20px;
          }
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .login-container {
    .login-left {
      display: none;
    }
    
    .login-right {
      width: 100%;
      background: rgba(255, 255, 255, 0.95);
    }
  }
}
</style>
