<template>
  <div class="min-h-screen bg-white flex flex-col">
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div class="text-6xl mb-2">🛒</div>
      <h1 class="text-2xl font-bold text-pdd-red mb-1">拼多多</h1>
      <p class="text-gray-400 text-sm mb-8">拼着买才便宜</p>

      <div class="w-full max-w-sm">
        <div class="flex gap-2 mb-6">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="currentTab = tab.key"
            class="flex-1 py-2 text-sm border-b-2"
            :class="currentTab === tab.key ? 'border-pdd-red text-pdd-red font-medium' : 'border-transparent text-gray-400'"
          >
            {{ tab.name }}
          </button>
        </div>

        <div v-if="currentTab === 'phone'" class="space-y-4">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+86</span>
            <input
              v-model="phone"
              type="tel"
              maxlength="11"
              placeholder="请输入手机号"
              class="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-pdd-red outline-none"
            />
          </div>
          <div class="relative">
            <input
              v-model="code"
              type="tel"
              maxlength="6"
              placeholder="请输入验证码"
              class="w-full pl-4 pr-28 py-3 border border-gray-200 rounded-lg text-sm focus:border-pdd-red outline-none"
            />
            <button
              @click="sendCode"
              :disabled="countdown > 0 || !isPhoneValid"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
              :class="countdown > 0 || !isPhoneValid ? 'text-gray-300' : 'text-pdd-red'"
            >
              {{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
            </button>
          </div>
          <button
            @click="loginWithPhone"
            :disabled="!isPhoneValid || !code || loading"
            class="w-full py-3 bg-pdd-red text-white rounded-lg font-medium disabled:bg-gray-300"
          >
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>

        <div v-if="currentTab === 'third'" class="flex flex-col items-center gap-4 py-8">
          <button
            @click="loginWithWechat"
            class="w-full py-3 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <span class="text-xl">💬</span>
            微信登录
          </button>
          <button
            @click="loginWithQQ"
            class="w-full py-3 bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <span class="text-xl">🐧</span>
            QQ登录
          </button>
        </div>

        <p class="text-center text-gray-400 text-xs mt-6">
          登录即表示同意
          <span class="text-pdd-red">《用户协议》</span>
          和
          <span class="text-pdd-red">《隐私政策》</span>
        </p>
      </div>
    </div>

    <div class="text-center text-gray-300 text-xs py-4">
      没有账号？登录后自动注册
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToast } from '../stores/toast'
import { authApi } from '../api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const tabs = [
  { key: 'phone', name: '手机号登录' },
  { key: 'third', name: '微信/QQ登录' }
]

const currentTab = ref('phone')
const phone = ref('')
const code = ref('')
const countdown = ref(0)
const loading = ref(false)

let countdownTimer = null

const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(phone.value))

function startCountdown() {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function sendCode() {
  if (!isPhoneValid.value || countdown.value > 0) return
  
  try {
    const res = await authApi.sendCode(phone.value)
    if (res.success) {
      startCountdown()
      toast.success('验证码已发送')
    }
  } catch (e) {
    console.error('发送验证码失败:', e)
  }
}

async function loginWithPhone() {
  if (!isPhoneValid.value || !code.value) return
  
  loading.value = true
  try {
    await userStore.login('phone', { phone: phone.value, code: code.value })
    toast.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    console.error('登录失败:', e)
  } finally {
    loading.value = false
  }
}

async function loginWithWechat() {
  loading.value = true
  try {
    const openId = 'wx_' + Date.now()
    await userStore.login('wechat', {
      openId,
      nickname: '微信用户',
      avatar: 'https://picsum.photos/100/100?random=' + Date.now()
    })
    toast.success('微信登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    console.error('微信登录失败:', e)
  } finally {
    loading.value = false
  }
}

async function loginWithQQ() {
  loading.value = true
  try {
    const openId = 'qq_' + Date.now()
    await userStore.login('qq', {
      openId,
      nickname: 'QQ用户',
      avatar: 'https://picsum.photos/100/100?random=' + Date.now()
    })
    toast.success('QQ登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    console.error('QQ登录失败:', e)
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>
