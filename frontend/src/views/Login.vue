<template>
  <div class="login-page">
    <van-nav-bar 
      title="登录" 
      left-arrow 
      @click-left="goBack"
    />
    
    <div class="login-content">
      <div class="logo-section">
        <div class="logo-icon">
          <van-icon name="home-o" size="40" color="#fff" />
        </div>
        <h2 class="app-name">家居搭配</h2>
      </div>
      
      <van-tabs v-model:active="loginType" class="login-tabs">
        <van-tab title="验证码登录">
          <div class="form-section">
            <van-cell-group inset>
              <van-field
                v-model="phone"
                type="tel"
                maxlength="11"
                placeholder="请输入手机号"
              >
                <template #left-icon>
                  <van-icon name="phone-o" size="20" color="#999" />
                </template>
              </van-field>
              
              <van-field
                v-model="code"
                type="tel"
                maxlength="6"
                placeholder="请输入验证码"
              >
                <template #left-icon>
                  <van-icon name="lock" size="20" color="#999" />
                </template>
                <template #button>
                  <van-button 
                    size="small" 
                    type="primary" 
                    :disabled="counting"
                    @click="sendCode"
                  >
                    {{ counting ? `${countdown}s` : '获取验证码' }}
                  </van-button>
                </template>
              </van-field>
            </van-cell-group>
            
            <van-button 
              type="primary" 
              size="large" 
              round 
              block
              class="login-btn"
              :loading="submitting"
              :disabled="!phone || !code"
              @click="handleLogin"
            >
              登录
            </van-button>
            
            <div class="tips">
              <span>新用户登录将自动注册账号</span>
            </div>
          </div>
        </van-tab>
        
        <van-tab title="密码登录">
          <div class="form-section">
            <van-cell-group inset>
              <van-field
                v-model="passwordForm.phone"
                type="tel"
                maxlength="11"
                placeholder="请输入手机号"
              >
                <template #left-icon>
                  <van-icon name="phone-o" size="20" color="#999" />
                </template>
              </van-field>
              
              <van-field
                v-model="passwordForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
              >
                <template #left-icon>
                  <van-icon name="lock" size="20" color="#999" />
                </template>
                <template #right-icon>
                  <van-icon 
                    :name="showPassword ? 'eye' : 'eye-o'" 
                    size="20" 
                    color="#999"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </van-field>
            </van-cell-group>
            
            <div class="link-row">
              <span class="link" @click="goToRegister">注册账号</span>
              <span class="link">忘记密码</span>
            </div>
            
            <van-button 
              type="primary" 
              size="large" 
              round 
              block
              class="login-btn"
              :loading="submitting"
              :disabled="!passwordForm.phone || !passwordForm.password"
              @click="handlePasswordLogin"
            >
              登录
            </van-button>
          </div>
        </van-tab>
      </van-tabs>
      
      <div class="other-login">
        <div class="divider">
          <span class="divider-text">其他登录方式</span>
        </div>
        
        <div class="login-methods">
          <div class="login-method" v-for="method in loginMethods" :key="method.name">
            <div class="method-icon" :style="{ background: method.color }">
              <van-icon :name="method.icon" size="24" color="#fff" />
            </div>
            <span class="method-name">{{ method.name }}</span>
          </div>
        </div>
      </div>
      
      <div class="agreement">
        <van-checkbox v-model="agreed" shape="square">
          <span class="agreement-text">
            我已阅读并同意
            <span class="link-text">《用户协议》</span>
            和
            <span class="link-text">《隐私政策》</span>
          </span>
        </van-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginType = ref(0)
const phone = ref('')
const code = ref('')
const passwordForm = reactive({
  phone: '',
  password: ''
})
const showPassword = ref(false)
const counting = ref(false)
const countdown = ref(60)
const submitting = ref(false)
const agreed = ref(false)

const loginMethods = [
  { name: '微信', icon: 'chat-o', color: '#07c160' },
  { name: 'QQ', icon: 'contact', color: '#12b7f5' },
  { name: '微博', icon: 'smile-o', color: '#e6162d' }
]

const goBack = () => {
  if (route.query.redirect) {
    router.push(route.query.redirect)
  } else {
    router.back()
  }
}

const sendCode = async () => {
  if (!phone.value) {
    showToast('请输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }
  
  const result = await userStore.handleSendCode(phone.value, 'login')
  if (result) {
    startCountdown()
  }
}

const startCountdown = () => {
  counting.value = true
  countdown.value = 60
  
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      counting.value = false
    }
  }, 1000)
}

const handleLogin = async () => {
  if (!phone.value) {
    showToast('请输入手机号')
    return
  }
  
  if (!code.value) {
    showToast('请输入验证码')
    return
  }
  
  if (!agreed.value) {
    showToast('请先同意用户协议和隐私政策')
    return
  }
  
  submitting.value = true
  
  const success = await userStore.handleLogin({
    phone: phone.value,
    code: code.value
  })
  
  submitting.value = false
  
  if (success) {
    const redirect = route.query.redirect || '/home'
    router.push(redirect)
  }
}

const handlePasswordLogin = async () => {
  if (!passwordForm.phone) {
    showToast('请输入手机号')
    return
  }
  
  if (!passwordForm.password) {
    showToast('请输入密码')
    return
  }
  
  if (!agreed.value) {
    showToast('请先同意用户协议和隐私政策')
    return
  }
  
  submitting.value = true
  
  const success = await userStore.handleLogin({
    phone: passwordForm.phone,
    password: passwordForm.password
  })
  
  submitting.value = false
  
  if (success) {
    const redirect = route.query.redirect || '/home'
    router.push(redirect)
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f5f5;
}

:deep(.van-nav-bar) {
  background: #f5f5f5;
}

.login-content {
  padding: 20px 16px;
}

.logo-section {
  text-align: center;
  padding: 30px 0 40px;
}

.logo-icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.app-name {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.login-tabs {
  margin-bottom: 20px;
}

:deep(.van-tabs__wrap) {
  background: #f5f5f5;
}

:deep(.van-tab) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.van-tab--active) {
  color: #667eea;
}

:deep(.van-tabs__line) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 40px;
}

.form-section {
  padding: 10px 0;
}

:deep(.van-cell-group--inset) {
  border-radius: 12px;
  margin: 0;
}

:deep(.van-field__control) {
  font-size: 15px;
}

.login-btn {
  margin: 30px 16px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 600;
}

.tips {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: #999;
}

.link-row {
  display: flex;
  justify-content: space-between;
  padding: 16px 16px 0;
}

.link {
  font-size: 14px;
  color: #667eea;
}

.other-login {
  margin-top: 40px;
}

.divider {
  display: flex;
  align-items: center;
  padding: 0 40px;
  margin-bottom: 30px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #eee;
}

.divider-text {
  padding: 0 16px;
  font-size: 12px;
  color: #999;
}

.login-methods {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.login-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.method-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.method-name {
  font-size: 12px;
  color: #666;
}

.agreement {
  padding: 30px 16px 20px;
}

.agreement-text {
  font-size: 12px;
  color: #666;
}

.link-text {
  color: #667eea;
}

:deep(.van-checkbox__icon--checked .van-icon) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}
</style>
