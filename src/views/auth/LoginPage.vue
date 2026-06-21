<template>
  <div class="min-h-screen relative overflow-hidden bg-gov-gradient flex items-center justify-center p-4">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div class="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl animate-pulse-slow" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl"></div>
    </div>

    <svg
      class="absolute bottom-0 left-0 right-0 w-full h-64 text-white/5"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        d="M0,192L48,186.7C96,181,192,171,288,181.3C384,192,480,224,576,229.3C672,235,768,213,864,192C960,171,1056,149,1152,154.7C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>

    <div class="absolute bottom-0 left-0 right-0 h-48 flex items-end justify-center opacity-10">
      <svg viewBox="0 0 800 200" class="w-full max-w-5xl h-full" fill="currentColor" style="color: white;">
        <rect x="0" y="120" width="60" height="80" />
        <rect x="70" y="80" width="40" height="120" />
        <rect x="120" y="100" width="50" height="100" />
        <rect x="180" y="60" width="45" height="140" />
        <rect x="235" y="90" width="55" height="110" />
        <rect x="300" y="40" width="50" height="160" />
        <rect x="360" y="70" width="40" height="130" />
        <rect x="410" y="100" width="60" height="100" />
        <rect x="480" y="50" width="45" height="150" />
        <rect x="535" y="80" width="50" height="120" />
        <rect x="595" y="110" width="45" height="90" />
        <rect x="650" y="60" width="55" height="140" />
        <rect x="715" y="90" width="45" height="110" />
        <rect x="770" y="120" width="30" height="80" />
      </svg>
    </div>

    <div class="relative z-10 w-full max-w-md animate-fade-in">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
          <Building2 class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">抚州政务民生门户</h1>
        <p class="text-blue-100/80">高效便捷 · 智慧服务 · 为民服务</p>
      </div>

      <div class="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
        <el-tabs
          v-model="activeTab"
          class="login-tabs"
          :tab-position="'top'"
        >
          <el-tab-pane name="password">
            <template #label>
              <div class="flex items-center gap-1.5 py-1">
                <Lock class="w-4 h-4" />
                <span>账号密码</span>
              </div>
            </template>
          </el-tab-pane>
          <el-tab-pane name="sms">
            <template #label>
              <div class="flex items-center gap-1.5 py-1">
                <Smartphone class="w-4 h-4" />
                <span>短信验证</span>
              </div>
            </template>
          </el-tab-pane>
          <el-tab-pane name="face">
            <template #label>
              <div class="flex items-center gap-1.5 py-1">
                <ScanFace class="w-4 h-4" />
                <span>人脸识别</span>
              </div>
            </template>
          </el-tab-pane>
          <el-tab-pane name="ca">
            <template #label>
              <div class="flex items-center gap-1.5 py-1">
                <CreditCard class="w-4 h-4" />
                <span>CA证书</span>
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>

        <div v-show="activeTab === 'password'" class="space-y-5 animate-fade-in">
          <div>
            <label class="block text-sm text-white/80 mb-2">用户名 / 手机号</label>
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                v-model="passwordForm.username"
                type="text"
                placeholder="请输入用户名或手机号"
                class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm text-white/80 mb-2">密码</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                v-model="passwordForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                @keyup.enter="handlePasswordLogin"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm text-white/80 mb-2">验证码</label>
            <div class="flex gap-3">
              <div class="relative flex-1">
                <Shield class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  v-model="passwordForm.captcha"
                  type="text"
                  placeholder="请输入验证码"
                  maxlength="4"
                  class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                />
              </div>
              <div
                class="w-32 h-[46px] rounded-xl bg-white/15 border border-white/20 flex items-center justify-center cursor-pointer select-none hover:bg-white/20 transition-all overflow-hidden"
                @click="refreshCaptcha"
              >
                <span class="text-xl font-bold tracking-widest" :style="captchaStyle">
                  {{ captchaCode }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2 text-white/70 cursor-pointer">
              <input type="checkbox" v-model="passwordForm.remember" class="rounded" />
              <span>记住我</span>
            </label>
            <a href="#" class="text-blue-200 hover:text-white transition-colors">忘记密码？</a>
          </div>
          <button
            class="w-full py-3 bg-white text-gov-blue font-semibold rounded-xl hover:bg-blue-50 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="handlePasswordLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else class="flex items-center justify-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin" />
              登录中...
            </span>
          </button>
        </div>

        <div v-show="activeTab === 'sms'" class="space-y-5 animate-fade-in">
          <div>
            <label class="block text-sm text-white/80 mb-2">手机号码</label>
            <div class="relative">
              <Smartphone class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                v-model="smsForm.phone"
                type="tel"
                placeholder="请输入手机号"
                maxlength="11"
                class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm text-white/80 mb-2">短信验证码</label>
            <div class="flex gap-3">
              <div class="relative flex-1">
                <MessageSquare class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  v-model="smsForm.code"
                  type="text"
                  placeholder="请输入验证码"
                  maxlength="6"
                  class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                  @keyup.enter="handleSmsLogin"
                />
              </div>
              <button
                class="w-32 h-[46px] rounded-xl bg-white/15 border border-white/20 text-white text-sm font-medium hover:bg-white/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                :disabled="smsCountdown > 0 || !smsForm.phone || smsForm.phone.length !== 11"
                @click="sendSmsCode"
              >
                {{ smsCountdown > 0 ? `${smsCountdown}s 重发` : '获取验证码' }}
              </button>
            </div>
          </div>
          <button
            class="w-full py-3 bg-white text-gov-blue font-semibold rounded-xl hover:bg-blue-50 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="handleSmsLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else class="flex items-center justify-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin" />
              登录中...
            </span>
          </button>
        </div>

        <div v-show="activeTab === 'face'" class="space-y-5 animate-fade-in">
          <div class="flex flex-col items-center py-6">
            <div class="relative w-40 h-40 mb-6">
              <div class="absolute inset-0 rounded-full border-4 border-dashed border-white/30 animate-spin" style="animation-duration: 8s;"></div>
              <div class="absolute inset-3 rounded-full border-2 border-white/20"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div
                  class="w-28 h-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all"
                  :class="faceScanning ? 'ring-4 ring-blue-400/50' : ''"
                >
                  <ScanFace class="w-14 h-14 text-white/60" />
                </div>
              </div>
              <div
                v-if="faceScanning"
                class="absolute left-3 right-3 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full animate-bounce"
                style="top: 50%;"
              ></div>
            </div>
            <p class="text-white/80 text-sm mb-2 text-center">
              {{ faceScanning ? '正在识别中，请保持面部在框内...' : '请将面部对准识别区域' }}
            </p>
            <p class="text-white/50 text-xs text-center">
              识别成功后将自动登录
            </p>
          </div>
          <button
            class="w-full py-3 bg-white text-gov-blue font-semibold rounded-xl hover:bg-blue-50 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="faceScanning"
            @click="handleFaceLogin"
          >
            <span v-if="!faceScanning" class="flex items-center justify-center gap-2">
              <ScanFace class="w-5 h-5" />
              开始人脸识别
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin" />
              识别中...
            </span>
          </button>
        </div>

        <div v-show="activeTab === 'ca'" class="space-y-5 animate-fade-in">
          <div class="flex flex-col items-center py-6">
            <div
              class="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-white/30 mb-4 transition-all hover:bg-white/15 hover:border-white/50 cursor-pointer"
              @click="handleCaLogin"
            >
              <CreditCard class="w-12 h-12 text-white/60" />
            </div>
            <p class="text-white/80 text-sm mb-1 text-center">请插入CA证书USBKey</p>
            <p class="text-white/50 text-xs text-center mb-4">
              系统将自动检测并读取证书信息
            </p>
            <div class="flex items-center gap-2 text-sm">
              <div
                class="w-2 h-2 rounded-full"
                :class="caDetected ? 'bg-green-400' : 'bg-white/30'"
              ></div>
              <span class="text-white/70">
                {{ caDetected ? 'CA证书已检测到' : '未检测到CA证书' }}
              </span>
            </div>
          </div>
          <button
            class="w-full py-3 bg-white text-gov-blue font-semibold rounded-xl hover:bg-blue-50 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!caDetected || loading"
            @click="handleCaLogin"
          >
            <span v-if="!loading">使用CA证书登录</span>
            <span v-else class="flex items-center justify-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin" />
              验证中...
            </span>
          </button>
        </div>

        <div class="mt-6 pt-6 border-t border-white/10">
          <div class="flex items-center justify-center gap-4 text-sm">
            <a href="#" class="text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
              <BadgeCheck class="w-4 h-4" />
              实名认证
            </a>
            <span class="text-white/20">|</span>
            <a href="#" class="text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
              <UserPlus class="w-4 h-4" />
              注册账号
            </a>
            <span class="text-white/20">|</span>
            <router-link to="/" class="text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
              <Home class="w-4 h-4" />
              返回首页
            </router-link>
          </div>
        </div>
      </div>

      <p class="text-center text-white/50 text-xs mt-6">
        登录即表示您已阅读并同意
        <a href="#" class="text-white/70 hover:text-white">《用户服务协议》</a>
        和
        <a href="#" class="text-white/70 hover:text-white">《隐私政策》</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import {
  Building2,
  User,
  Lock,
  Smartphone,
  ScanFace,
  CreditCard,
  Eye,
  EyeOff,
  Shield,
  MessageSquare,
  Loader2,
  BadgeCheck,
  UserPlus,
  Home,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref<'password' | 'sms' | 'face' | 'ca'>('password')
const loading = ref(false)
const showPassword = ref(false)
const faceScanning = ref(false)
const caDetected = ref(false)
const smsCountdown = ref(0)

const passwordForm = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: false,
})

const smsForm = reactive({
  phone: '',
  code: '',
})

const captchaCode = ref('')
const captchaStyle = computed(() => {
  return {
    fontFamily: 'Georgia, serif',
    color: `hsl(${Math.random() * 60 + 200}, 70%, 85%)`,
    letterSpacing: '4px',
    transform: `skew(${Math.random() * 10 - 5}deg, ${Math.random() * 6 - 3}deg)`,
  }
})

const refreshCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaCode.value = code
}
refreshCaptcha()

let countdownTimer: ReturnType<typeof setInterval> | null = null

const sendSmsCode = () => {
  if (!smsForm.phone || smsForm.phone.length !== 11) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  smsCountdown.value = 60
  ElMessage.success('验证码已发送')
  countdownTimer = setInterval(() => {
    smsCountdown.value--
    if (smsCountdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
    }
  }, 1000)
}

const doLogin = async (credentials: Parameters<typeof userStore.login>[0]) => {
  loading.value = true
  try {
    await userStore.login(credentials)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || (userStore.isAdmin ? '/admin' : '/dashboard')
    router.push(redirect)
  } catch (e) {
    ElMessage.error('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

const handlePasswordLogin = () => {
  if (!passwordForm.username.trim()) {
    ElMessage.warning('请输入用户名或手机号')
    return
  }
  if (!passwordForm.password) {
    ElMessage.warning('请输入密码')
    return
  }
  if (!passwordForm.captcha.trim()) {
    ElMessage.warning('请输入验证码')
    return
  }
  if (passwordForm.captcha.toUpperCase() !== captchaCode.value) {
    ElMessage.error('验证码错误')
    refreshCaptcha()
    return
  }
  doLogin({
    authType: 'password',
    username: passwordForm.username,
    password: passwordForm.password,
  })
}

const handleSmsLogin = () => {
  if (!smsForm.phone || smsForm.phone.length !== 11) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!smsForm.code || smsForm.code.length !== 6) {
    ElMessage.warning('请输入6位验证码')
    return
  }
  doLogin({
    authType: 'sms',
    phone: smsForm.phone,
    smsCode: smsForm.code,
  })
}

const handleFaceLogin = () => {
  faceScanning.value = true
  setTimeout(() => {
    faceScanning.value = false
    doLogin({ authType: 'face' })
  }, 2500)
}

const handleCaLogin = () => {
  caDetected.value = true
  setTimeout(() => {
    doLogin({ authType: 'ca' })
  }, 500)
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style>
.login-tabs :deep(.el-tabs__header) {
  margin: 0 0 24px 0;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: rgba(255, 255, 255, 0.1);
}

.login-tabs :deep(.el-tabs__item) {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  padding: 0 12px;
  height: 40px;
  line-height: 40px;
}

.login-tabs :deep(.el-tabs__item:hover),
.login-tabs :deep(.el-tabs__item.is-active) {
  color: white !important;
}

.login-tabs :deep(.el-tabs__active-bar) {
  background-color: white !important;
  height: 2px;
}

.login-tabs :deep(.el-tabs__nav) {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.login-tabs :deep(.el-tabs__nav .el-tabs__item) {
  flex: 1;
  text-align: center;
}
</style>
