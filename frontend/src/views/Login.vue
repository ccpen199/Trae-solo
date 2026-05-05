<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">
        <el-icon size="48"><Car /></el-icon>
      </div>
      <h1>汽车养护服务平台</h1>
      <p>专业的汽车养护预约服务</p>
    </div>

    <div class="login-form">
      <div class="form-item">
        <div class="input-wrapper">
          <el-input
            v-model="phone"
            placeholder="请输入手机号"
            maxlength="11"
            prefix-icon="Phone"
            :disabled="countdown > 0"
          />
        </div>
      </div>

      <div class="form-item">
        <div class="input-wrapper code-input">
          <el-input
            v-model="code"
            placeholder="请输入验证码"
            maxlength="6"
            prefix-icon="Key"
          />
          <el-button
            type="primary"
            :disabled="!canSendCode || countdown > 0"
            @click="sendCode"
            class="code-btn"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </el-button>
        </div>
      </div>

      <el-button
        type="primary"
        size="large"
        :loading="loading"
        :disabled="!canLogin"
        @click="doLogin"
        class="login-btn"
      >
        登录 / 注册
      </el-button>

      <div class="tips">
        <p>新用户输入手机号即可完成注册</p>
        <p class="debug-tip" v-if="debugCode">
          当前验证码：<strong>{{ debugCode }}</strong>
        </p>
      </div>
    </div>

    <div class="login-footer">
      <p>登录即表示同意</p>
      <p>
        <span class="link">用户协议</span>
        <span class="divider">和</span>
        <span class="link">隐私政策</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const countdown = ref(0)
const loading = ref(false)
const debugCode = ref('')

const canSendCode = computed(() => {
  return /^1[3-9]\d{9}$/.test(phone.value)
})

const canLogin = computed(() => {
  return canSendCode.value && code.value.length === 6
})

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const sendCode = async () => {
  if (!canSendCode.value) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  const result = await userStore.sendSmsCode(phone.value)
  if (result.success) {
    startCountdown()
    if (result.debugCode) {
      debugCode.value = result.debugCode
    }
  }
}

const doLogin = async () => {
  if (!canLogin.value) {
    ElMessage.warning('请输入完整的手机号和验证码')
    return
  }

  loading.value = true
  try {
    const result = await userStore.login(phone.value, code.value)
    if (result.success) {
      const redirect = route.query.redirect || '/'
      router.replace(redirect)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  userStore.initFromStorage()
  if (userStore.isLoggedIn) {
    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 40px 24px;
}

.login-header {
  text-align: center;
  color: #fff;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.login-header h1 {
  font-size: 24px;
  margin-bottom: 8px;
  font-weight: 600;
}

.login-header p {
  font-size: 14px;
  opacity: 0.8;
}

.login-form {
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  flex: 1;
}

.form-item {
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
}

.code-input {
  display: flex;
  gap: 12px;
}

.code-input :deep(.el-input) {
  flex: 1;
}

.code-btn {
  white-space: nowrap;
  padding: 0 16px;
}

.login-btn {
  width: 100%;
  margin-top: 24px;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
}

.tips {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.tips p {
  margin: 4px 0;
}

.debug-tip {
  color: #f56c6c;
}

.debug-tip strong {
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.login-footer p {
  margin: 4px 0;
}

.link {
  color: #fff;
  cursor: pointer;
}

.divider {
  margin: 0 4px;
}
</style>
