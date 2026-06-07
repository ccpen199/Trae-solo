<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="logo-section">
          <div class="logo-icon">♥</div>
          <h1 class="logo-title">婚庆SaaS服务平台</h1>
          <p class="logo-subtitle">一站式婚礼筹备解决方案</p>
        </div>
        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-icon">📅</span>
            <span>智能婚礼时间轴编排</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⭐</span>
            <span>服务商智能匹配</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">💰</span>
            <span>预算智能分配</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📄</span>
            <span>电子合约存证</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <h2 class="form-title">欢迎回来</h2>
        
        <el-tabs v-model="activeRole" class="role-tabs" @tab-change="onRoleChange">
          <el-tab-pane label="新人用户" name="couple" />
          <el-tab-pane label="商家入驻" name="merchant" />
          <el-tab-pane label="管理员" name="admin" />
        </el-tabs>
        
        <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
          <el-form-item prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" size="large">
              <template #prefix>👤</template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password>
              <template #prefix>🔒</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="login-btn" @click="handleLogin" :loading="loading">登录</el-button>
          </el-form-item>
        </el-form>
        
        <div v-if="errorMsg" class="error-box">
          <span class="error-icon">⚠️</span>
          <span>{{ errorMsg }}</span>
          <span v-if="errorHint" class="error-hint">{{ errorHint }}</span>
        </div>
        
        <div class="login-footer">
          <span>还没有账号？</span>
          <el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
        </div>
        
        <div class="demo-accounts">
          <p class="demo-title">点击下方卡片可快速填充演示账号：</p>
          <div 
            class="demo-card" 
            :class="{ active: activeRole === 'couple' }"
            @click="fillDemo('13800138001', '123456', 'couple')"
          >
            <div class="demo-card-left">
              <div class="demo-icon couple">👤</div>
              <div>
                <div class="demo-name">新人演示账号</div>
                <div class="demo-phone">13800138001 / 123456</div>
              </div>
            </div>
            <el-tag size="small">婚礼倒计时·预算</el-tag>
          </div>
          
          <div 
            class="demo-card" 
            :class="{ active: activeRole === 'merchant' }"
            @click="fillDemo('13800138002', '123456', 'merchant')"
          >
            <div class="demo-card-left">
              <div class="demo-icon merchant">🏪</div>
              <div>
                <div class="demo-name">商家演示账号</div>
                <div class="demo-phone">13800138002 / 123456</div>
              </div>
            </div>
            <el-tag size="small" type="success">档期管理·订单</el-tag>
          </div>
          
          <div 
            class="demo-card" 
            :class="{ active: activeRole === 'admin' }"
            @click="fillDemo('13800138000', '123456', 'admin')"
          >
            <div class="demo-card-left">
              <div class="demo-icon admin">⚙️</div>
              <div>
                <div class="demo-name">管理员演示账号</div>
                <div class="demo-phone">13800138000 / 123456</div>
              </div>
            </div>
            <el-tag size="small" type="warning">信用分·转化漏斗</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const activeRole = ref('couple')
const errorMsg = ref('')
const errorHint = ref('')

const form = reactive({
  phone: '',
  password: ''
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

function onRoleChange(role) {
  errorMsg.value = ''
  errorHint.value = ''
}

function fillDemo(phone, password, role) {
  form.phone = phone
  form.password = password
  activeRole.value = role
  errorMsg.value = ''
  errorHint.value = ''
}

async function handleLogin() {
  try {
    await formRef.value.validate()
    loading.value = true
    errorMsg.value = ''
    errorHint.value = ''
    
    const result = await userStore.login(form)
    
    if (result.success) {
      ElMessage.success(`登录成功，欢迎 ${result.data.user.name}！`)
      const redirect = router.currentRoute.value.query.redirect
      if (redirect) {
        router.push(redirect)
      } else {
        router.push(result.homePath)
      }
    } else {
      if (result.status === 0) {
        errorMsg.value = '网络连接失败'
        errorHint.value = '请检查网络连接或稍后重试'
      } else if (result.status === 401) {
        if (result.message.includes('密码')) {
          errorMsg.value = '密码错误'
          errorHint.value = '请检查密码后重新输入，或点击演示账号尝试'
        } else if (result.message.includes('注册') || result.message.includes('存在')) {
          errorMsg.value = '该手机号未注册'
          errorHint.value = '请先注册账号，或点击演示账号尝试'
        } else if (result.message.includes('角色') || result.message.includes('权限')) {
          errorMsg.value = '账号权限不匹配'
          errorHint.value = '该账号属于其他角色，请切换角色或使用对应演示账号'
        } else {
          errorMsg.value = '登录凭证无效'
          errorHint.value = '请检查手机号和密码是否正确'
        }
      } else if (result.status === 403) {
        errorMsg.value = '账号权限受限'
        errorHint.value = '该账号不支持当前角色登录，请切换角色后重试'
      } else if (result.status >= 500) {
        errorMsg.value = '服务器繁忙'
        errorHint.value = '请稍后重试，或联系技术支持'
      } else {
        errorMsg.value = result.message || '登录失败'
        errorHint.value = '请重试或联系客服'
      }
    }
  } catch (e) {
    errorMsg.value = '登录异常'
    errorHint.value = '请刷新页面后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #6c5ce7 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
}

.login-left {
  width: 50%;
  padding: 60px 40px;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .logo-section {
    .logo-icon {
      font-size: 56px;
      margin-bottom: 16px;
      color: #fff;
      line-height: 1;
    }

    .logo-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .logo-subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
  }

  .feature-list {
    .feature-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      font-size: 14px;

      .feature-icon {
        margin-right: 12px;
        font-size: 20px;
      }
    }
  }
}

.login-right {
  width: 50%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .form-title {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    text-align: center;
  }

  .role-tabs {
    margin-bottom: 16px;
    
    :deep(.el-tabs__nav) {
      width: 100%;
    }
    
    :deep(.el-tabs__item) {
      flex: 1;
      text-align: center;
      padding: 0;
      font-size: 14px;
    }
  }

  .login-form {
    .login-btn {
      width: 100%;
      background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
      border: none;
    }
  }

  .error-box {
    padding: 12px 16px;
    background: #fef0f0;
    border: 1px solid #fde2e2;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #f56c6c;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;

    .error-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }

    .error-hint {
      width: 100%;
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
    }
  }

  .login-footer {
    text-align: center;
    margin-top: 12px;
    font-size: 14px;
    color: #909399;
  }

  .demo-accounts {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;

    .demo-title {
      font-size: 12px;
      color: #909399;
      margin-bottom: 12px;
    }

    .demo-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #ff6b9d;
        background: #fff5f7;
      }

      &.active {
        border-color: #ff6b9d;
        background: #fff5f7;
        box-shadow: 0 0 0 2px rgba(255, 107, 157, 0.1);
      }

      .demo-card-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .demo-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.couple { background: #f67c9a; }
        &.merchant { background: #67c23a; }
        &.admin { background: #e6a23c; }
      }

      .demo-name {
        font-size: 13px;
        font-weight: 500;
        color: #303133;
      }

      .demo-phone {
        font-size: 11px;
        color: #909399;
      }
    }
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-left,
  .login-right {
    width: 100%;
  }

  .login-left {
    padding: 40px 30px;
  }
}
</style>
