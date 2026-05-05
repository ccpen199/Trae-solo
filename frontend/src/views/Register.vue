<template>
  <div class="register-page">
    <van-nav-bar 
      title="注册" 
      left-arrow 
      @click-left="goBack"
    />
    
    <div class="register-content">
      <div class="form-section">
        <van-cell-group inset>
          <van-field
            v-model="form.phone"
            type="tel"
            maxlength="11"
            placeholder="请输入手机号"
          >
            <template #left-icon>
              <van-icon name="phone-o" size="20" color="#999" />
            </template>
          </van-field>
          
          <van-field
            v-model="form.code"
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
          
          <van-field
            v-model="form.username"
            placeholder="请输入昵称（选填）"
            maxlength="12"
          >
            <template #left-icon>
              <van-icon name="user-o" size="20" color="#999" />
            </template>
          </van-field>
          
          <van-field
            v-model="form.email"
            placeholder="请输入邮箱（选填）"
          >
            <template #left-icon>
              <van-icon name="envelope-o" size="20" color="#999" />
            </template>
          </van-field>
          
          <van-field
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请设置密码（6-16位）"
            maxlength="16"
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
          
          <van-field
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="请确认密码"
            maxlength="16"
          >
            <template #left-icon>
              <van-icon name="lock" size="20" color="#999" />
            </template>
            <template #right-icon>
              <van-icon 
                :name="showConfirmPassword ? 'eye' : 'eye-o'" 
                size="20" 
                color="#999"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </van-field>
        </van-cell-group>
        
        <div class="password-tips">
          <van-tag 
            v-if="form.password" 
            :type="form.password.length >= 6 ? 'success' : 'danger'"
            size="small"
          >
            密码长度{{ form.password.length >= 6 ? '符合' : '不足6位' }}
          </van-tag>
          <van-tag 
            v-if="form.password && form.confirmPassword"
            :type="form.password === form.confirmPassword ? 'success' : 'danger'"
            size="small"
          >
            {{ form.password === form.confirmPassword ? '密码一致' : '密码不一致' }}
          </van-tag>
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
      
      <van-button 
        type="primary" 
        size="large" 
        round 
        block
        class="register-btn"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleRegister"
      >
        注册
      </van-button>
      
      <div class="login-link">
        <span>已有账号？</span>
        <span class="link" @click="goToLogin">立即登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  phone: '',
  code: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const counting = ref(false)
const countdown = ref(60)
const submitting = ref(false)
const agreed = ref(false)

const canSubmit = computed(() => {
  return (
    form.phone &&
    form.code &&
    form.password &&
    form.confirmPassword &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword &&
    agreed.value
  )
})

const goBack = () => {
  router.back()
}

const sendCode = async () => {
  if (!form.phone) {
    showToast('请输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    showToast('请输入正确的手机号')
    return
  }
  
  const result = await userStore.handleSendCode(form.phone, 'register')
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

const handleRegister = async () => {
  if (!canSubmit.value) {
    return
  }
  
  submitting.value = true
  
  const success = await userStore.handleRegister({
    phone: form.phone,
    code: form.code,
    username: form.username || undefined,
    email: form.email || undefined,
    password: form.password
  })
  
  submitting.value = false
  
  if (success) {
    router.push('/home')
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
}

:deep(.van-nav-bar) {
  background: #f5f5f5;
}

.register-content {
  padding: 20px 16px;
}

.form-section {
  padding-bottom: 20px;
}

:deep(.van-cell-group--inset) {
  border-radius: 12px;
  margin: 0;
}

:deep(.van-field__control) {
  font-size: 15px;
}

.password-tips {
  padding: 12px 16px 0;
  display: flex;
  gap: 8px;
}

.agreement {
  padding: 0 16px 20px;
}

.agreement-text {
  font-size: 12px;
  color: #666;
}

.link-text {
  color: #667eea;
}

.register-btn {
  margin: 0 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 600;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-link .link {
  color: #667eea;
  margin-left: 4px;
}

:deep(.van-checkbox__icon--checked .van-icon) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}
</style>
