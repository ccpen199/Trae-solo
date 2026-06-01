<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { sendCode, register } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const code = ref('')
const gesturePassword = ref('')
const showGesture = ref(false)
const countdown = ref(0)
const loading = ref(false)
const codeLoading = ref(false)
const testCode = ref('')
const showTestCode = ref(false)

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const handleSendCode = async () => {
  if (!phone.value) {
    return showToast({ message: '请输入手机号', type: 'fail' })
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    return showToast({ message: '请输入正确的手机号', type: 'fail' })
  }

  codeLoading.value = true
  try {
    const res: any = await sendCode(phone.value)
    if (res.code) {
      testCode.value = res.code
      showTestCode.value = true
      showToast({ message: `测试验证码：${res.code}`, type: 'success', duration: 10000 })
    } else {
      showToast({ message: '验证码已发送', type: 'success' })
    }
    startCountdown()
  } catch (err) {
    console.error('Send code error:', err)
  } finally {
    codeLoading.value = false
  }
}

const fillCode = () => {
  code.value = testCode.value
}

const handleRegister = async () => {
  if (!phone.value) {
    return showToast({ message: '请输入手机号', type: 'fail' })
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    return showToast({ message: '请输入正确的手机号', type: 'fail' })
  }
  if (!code.value) {
    return showToast({ message: '请输入验证码', type: 'fail' })
  }
  if (!password.value) {
    return showToast({ message: '请输入密码', type: 'fail' })
  }
  if (password.value.length < 6) {
    return showToast({ message: '密码至少6位', type: 'fail' })
  }
  if (password.value !== confirmPassword.value) {
    return showToast({ message: '两次密码不一致', type: 'fail' })
  }

  loading.value = true
  try {
    const res = await register({
      phone: phone.value,
      password: password.value,
      code: code.value,
      gesturePassword: gesturePassword.value || undefined
    })
    userStore.setToken(res.data.token)
    userStore.setUser(res.data.user)
    
    showToast({ message: '注册成功', type: 'success' })
    setTimeout(() => {
      router.push('/home')
    }, 1000)
  } catch (err) {
    console.error('Register error:', err)
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-page">
    <van-nav-bar title="注册" left-arrow @click-left="router.back()" />

    <div class="register-content">
      <div class="form-section">
        <van-field
          v-model="phone"
          type="tel"
          label="手机号"
          placeholder="请输入手机号"
          maxlength="11"
        >
          <template #left-icon>
            <van-icon name="phone-o" />
          </template>
        </van-field>

        <van-field
          v-model="code"
          type="number"
          label="验证码"
          placeholder="请输入验证码"
          maxlength="6"
        >
          <template #left-icon>
            <van-icon name="shield-o" />
          </template>
          <template #button>
            <van-button
              size="small"
              type="primary"
              plain
              :disabled="countdown > 0"
              :loading="codeLoading"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>

        <div v-if="showTestCode" class="test-code-section">
          <van-icon name="info-o" size="16" color="#1989fa" />
          <span class="test-code-label">测试验证码：</span>
          <span class="test-code-value">{{ testCode }}</span>
          <van-button size="mini" type="primary" plain @click="fillCode">
            一键填充
          </van-button>
        </div>

        <van-field
          v-model="password"
          type="password"
          label="设置密码"
          placeholder="请输入6-20位密码"
        >
          <template #left-icon>
            <van-icon name="lock" />
          </template>
        </van-field>

        <van-field
          v-model="confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入密码"
        >
          <template #left-icon>
            <van-icon name="lock" />
          </template>
        </van-field>

        <div class="gesture-section">
          <div class="gesture-header">
            <span class="gesture-label">手势密码 (可选)</span>
            <van-switch v-model="showGesture" size="20" />
          </div>
          <div v-if="showGesture" class="gesture-tip">
            <van-icon name="info-o" size="14" color="#999" />
            <span>请牢记手势密码，用于快速登录</span>
          </div>
        </div>

        <div class="form-actions">
          <van-button
            type="primary"
            block
            size="large"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </van-button>
        </div>

        <div class="login-link">
          已有账号？
          <span class="link" @click="goToLogin">立即登录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background: white;
}

.register-content {
  padding: 24px;
}

.form-section {
  max-width: 400px;
  margin: 0 auto;
}

.gesture-section {
  padding: 16px 12px;
  border-bottom: 1px solid #eee;
}

.gesture-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gesture-label {
  font-size: 14px;
  color: #333;
}

.gesture-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.form-actions {
  margin-top: 32px;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.link {
  color: #1989fa;
  cursor: pointer;
}

.test-code-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e8f3ff;
  border-radius: 8px;
  margin-top: 8px;
}

.test-code-label {
  font-size: 14px;
  color: #666;
}

.test-code-value {
  font-size: 18px;
  font-weight: 600;
  color: #1989fa;
  letter-spacing: 2px;
}
</style>
