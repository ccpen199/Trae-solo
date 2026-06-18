<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand">
          <div class="brand-logo">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <defs>
                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#fff"/>
                  <stop offset="100%" style="stop-color:#BFD4F5"/>
                </linearGradient>
              </defs>
              <rect rx="14" width="60" height="60" fill="url(#lg)" opacity="0.15"/>
              <path d="M30 10L10 20v20l20 10 20-10V20z" fill="url(#lg)"/>
              <path d="M30 18l-14 7v10l14 7 14-7V25z" fill="#fff" opacity="0.85"/>
            </svg>
          </div>
          <div class="brand-text">
            <h1>郑州市掌上办事中枢</h1>
            <p>政务服务一体化运营管理平台</p>
          </div>
        </div>

        <div class="stats-showcase">
          <div class="showcase-item">
            <div class="showcase-num">20+</div>
            <div class="showcase-label">接入委办局</div>
          </div>
          <div class="showcase-item">
            <div class="showcase-num">892万+</div>
            <div class="showcase-label">服务市民</div>
          </div>
          <div class="showcase-item">
            <div class="showcase-num">1.5亿+</div>
            <div class="showcase-label">办件总量</div>
          </div>
          <div class="showcase-item">
            <div class="showcase-num">94.6%</div>
            <div class="showcase-label">满意度</div>
          </div>
        </div>

        <div class="feature-list">
          <div class="feature-item"><el-icon color="#FFD700"><Star /></el-icon> 千人千面个性化推荐</div>
          <div class="feature-item"><el-icon color="#7DD3FC"><Link /></el-icon> 20+委办局API编排</div>
          <div class="feature-item"><el-icon color="#86EFAC"><Share /></el-icon> 政务知识图谱问答</div>
          <div class="feature-item"><el-icon color="#FDA4AF"><Warning /></el-icon> 差评自动督办闭环</div>
        </div>

        <div v-if="loginAudits.length > 0" class="audit-panel">
          <div class="audit-header">
            <el-icon color="#E74C3C"><View /></el-icon>
            <span>登录审计记录（最近 {{ loginAudits.length }} 条）</span>
            <el-button link size="small" type="danger" @click="clearAuditLogs">清空</el-button>
          </div>
          <div class="audit-list">
            <div class="audit-item" v-for="a in loginAudits.slice(0, 5)" :key="a.id">
              <span class="audit-ts">{{ formatTs(a.timestamp) }}</span>
              <el-tag :type="a.success ? 'success' : 'danger'" size="small" effect="plain" round>
                {{ a.success ? '成功' : '失败' }}
              </el-tag>
              <span class="audit-user" :class="{ fail: !a.success }">{{ a.username || '(空)' }}</span>
              <span class="audit-reason" v-if="!a.success">{{ failReasonText(a.failReason) }}</span>
              <span class="audit-ip">{{ a.clientIp }}</span>
              <span class="audit-role" v-if="a.roleAfterLogin">→ {{ roleText(a.roleAfterLogin) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <h2>欢迎登录</h2>
          <p class="login-sub">管理员专用登录入口，请使用您的授权账号</p>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            class="login-form"
            status-icon
            @keyup.enter="handleLogin"
          >
            <el-form-item label="角色账号" prop="username">
              <el-select
                v-model="form.username"
                placeholder="选择演示账号或手动输入"
                filterable
                allow-create
                clearable
                style="width: 100%;"
              >
                <el-option
                  v-for="acc in demoAccounts"
                  :key="acc.username"
                  :label="`${acc.username}（${acc.roleName} - ${acc.department.split(' · ')[1]}）`"
                  :value="acc.username"
                >
                  <div style="display:flex; align-items:center; gap:8px;">
                    <el-tag :type="acc.roleTagType" size="small" effect="dark" round>
                      {{ acc.roleName }}
                    </el-tag>
                    <strong>{{ acc.username }}</strong>
                    <span style="color:#909399; font-size:12px;">
                      {{ acc.department.split(' · ')[1] }}
                    </span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="登录密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="演示账号密码统一为：123456"
                :prefix-icon="Lock"
                show-password
                autocomplete="current-password"
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item label="图形验证码" prop="verifyCode">
              <div style="display: flex; gap: 12px; width: 100%;">
                <el-input
                  v-model="form.verifyCode"
                  placeholder="请输入验证码，不区分大小写"
                  :prefix-icon="Key"
                  maxlength="4"
                  clearable
                  autocomplete="one-time-code"
                />
                <div
                  class="captcha"
                  :class="{ 'captcha-error': lastErrorCode === 'wrong_captcha' }"
                  @click="refreshCaptcha"
                  title="点击刷新验证码"
                >
                  <span v-for="(c, idx) in captchaChars" :key="idx" class="captcha-char" :style="{ transform: `rotate(${charRotation[idx]}deg) translateY(${charOffset[idx]}px)` }">
                    {{ c }}
                  </span>
                  <el-icon class="captcha-refresh-icon"><RefreshRight /></el-icon>
                </div>
              </div>
            </el-form-item>

            <el-alert
              v-if="lastErrorMsg"
              :title="lastErrorMsg"
              :type="lastErrorType"
              :closable="false"
              show-icon
              style="margin-bottom: 12px;"
            >
              <template v-if="lastAuditId" #default>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.85;">
                  审计追踪号：<code>{{ lastAuditId }}</code>
                  <span v-if="lockInfo && lockInfo.locked" style="color: #E74C3C; margin-left: 12px;">
                    账号锁定倒计时：{{ lockCountdown }}
                  </span>
                  <span v-else-if="typeof lastRemainAttempts === 'number'" style="margin-left: 12px;">
                    剩余尝试次数：<strong :class="{ danger: lastRemainAttempts <= 2 }">{{ lastRemainAttempts }}</strong> / 5
                  </span>
                </div>
              </template>
            </el-alert>

            <el-form-item>
              <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <el-checkbox v-model="form.remember">记住登录状态（7天）</el-checkbox>
                <el-link type="primary" :underline="false" @click="forgotPwd">忘记密码？</el-link>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                class="login-btn"
                :loading="loading"
                @click="handleLogin"
              >
                {{ loading ? '身份核验中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div style="text-align:center; margin: -4px 0 8px;">
            <el-link type="primary" :underline="false" @click="handleQuickTest" style="font-size:12px; font-weight: 600;">
              ⚡ 快速登录：admin 一键进入工作台（无需验证码）
            </el-link>
          </div>

          <el-divider content-position="center" style="margin: 4px 0 12px;">快速提示</el-divider>

          <div class="demo-accounts">
            <div
              v-for="acc in demoAccounts"
              :key="acc.username"
              class="demo-account-chip"
              @click="quickFill(acc)"
            >
              <el-tag size="small" :type="acc.roleTagType" effect="dark" round>{{ acc.roleName }}</el-tag>
              <strong>{{ acc.username }}</strong>
              <span class="chip-pwd">/ 123456</span>
              <span class="chip-code">验证码：<code>{{ captcha }}</code></span>
            </div>
          </div>

          <div class="security-tip">
            <el-icon color="#F39C12"><InfoFilled /></el-icon>
            <div>
              <div><strong>本系统仅限授权人员使用，所有操作均被记录并审计</strong></div>
              <div style="font-size: 11px; margin-top: 2px; opacity: 0.8;">
                审计信息：登录时间 · 客户端IP · 角色 · UA指纹 · 失败原因
              </div>
            </div>
          </div>

          <div class="debug-panel">
            <div class="debug-header" @click="showDebug = !showDebug">
              <span>🔍 登录诊断面板</span>
              <span style="font-size: 12px; opacity: 0.7;">{{ showDebug ? '收起' : '展开' }}</span>
            </div>
            <div v-show="showDebug" class="debug-content">
              <div class="debug-item">
                <span class="debug-label">当前状态：</span>
                <span class="debug-value" :class="statusClass">{{ debugStatus }}</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">用户名：</span>
                <span class="debug-value">{{ form.username || '(空)' }}</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">密码：</span>
                <span class="debug-value">{{ form.password ? '*** (' + form.password.length + '位)' : '(空)' }}</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">验证码：</span>
                <span class="debug-value">{{ form.verifyCode || '(空)' }} / 期望值：{{ captcha }}</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">Token：</span>
                <span class="debug-value">{{ userStore.token ? '已存在' : '无' }}</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">用户信息：</span>
                <span class="debug-value">{{ userStore.userInfo ? userStore.userInfo.roleName : '无' }}</span>
              </div>
              <div v-if="debugError" class="debug-item debug-error">
                <span class="debug-label">错误信息：</span>
                <span class="debug-value">{{ debugError }}</span>
              </div>
              <div class="debug-item">
                <span class="debug-label">审计记录：</span>
                <span class="debug-value">{{ loginAudits.length }} 条</span>
              </div>
              <div class="debug-actions">
                <el-button size="small" type="primary" plain @click="debugStepByStep">
                  单步调试登录
                </el-button>
                <el-button size="small" type="danger" plain @click="clearDebugInfo">
                  重置状态
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElNotification, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Key, Star, Link, Share, Warning, InfoFilled, RefreshRight, View } from '@element-plus/icons-vue'
import { useUserStore, type AuditRecord, type AdminRole } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const captcha = ref('')
const captchaChars = ref<string[]>([])
const charRotation = ref<number[]>([])
const charOffset = ref<number[]>([])

const lastErrorMsg = ref('')
const lastErrorType = ref<'success' | 'warning' | 'info' | 'error'>('error')
const lastAuditId = ref('')
const lastErrorCode = ref('')
const lastRemainAttempts = ref<number | null>(null)
const lockInfo = ref<{ locked: boolean; lockedUntil: number } | null>(null)
const lockCountdown = ref('')
const loginAudits = ref<AuditRecord[]>([])

const showDebug = ref(true)
const debugStatus = ref('等待输入')
const debugError = ref('')

const statusClass = computed(() => ({
  'status-idle': debugStatus.value === '等待输入',
  'status-loading': debugStatus.value.includes('中...'),
  'status-success': debugStatus.value.includes('成功'),
  'status-error': debugStatus.value.includes('失败') || debugStatus.value.includes('错误')
}))

const demoAccounts = [
  { username: 'admin', roleName: '超级管理员', department: '郑州市大数据管理局 · 平台管理处', roleTagType: 'danger' as const },
  { username: 'platform', roleName: '运营专员', department: '郑州市大数据管理局 · 运营中心', roleTagType: 'warning' as const },
  { username: 'ops', roleName: '运维工程师', department: '郑州市大数据管理局 · 技术运维部', roleTagType: 'info' as const }
]

const roleText = (r?: AdminRole) => ({ admin: '超级管理员', platform: '运营专员', ops: '运维工程师' }[r || 'admin'])

const failReasonText = (r?: string) => ({
  user_not_found: '账号不存在',
  wrong_password: '密码错误',
  wrong_captcha: '验证码错误',
  account_locked: '账号锁定',
  role_unauthorized: '角色未授权'
}[r || ''] || '未知原因')

const form = reactive({
  username: '',
  password: '123456',
  verifyCode: '',
  remember: true
})

const rules: FormRules = {
  username: [{ required: true, message: '请选择或输入登录账号', trigger: 'change' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
  verifyCode: [
    { required: true, message: '请输入图形验证码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        if (v && captcha.value && v.toUpperCase() !== captcha.value.toUpperCase()) {
          cb(new Error(`验证码错误（正确值：${captcha.value}）`))
        } else {
          cb()
        }
      },
      trigger: 'blur'
    }
  ]
}

function refreshCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  captchaChars.value = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)])
  captcha.value = captchaChars.value.join('')
  charRotation.value = captchaChars.value.map(() => Math.floor(Math.random() * 30) - 15)
  charOffset.value = captchaChars.value.map(() => Math.floor(Math.random() * 6) - 3)
  lastErrorCode.value = ''
}

function quickFill(acc: { username: string }) {
  form.username = acc.username
  form.verifyCode = captcha.value
  lastErrorMsg.value = ''
  lastErrorType.value = 'info'
  ElMessage.info(`已快速填充：${acc.username} / 123456，验证码自动带入`)
}

function clearAuditLogs() {
  localStorage.removeItem('zz_gov_admin_audit_log')
  loginAudits.value = []
  ElMessage.success('已清空本地审计记录')
}

function formatTs(iso: string) {
  const d = new Date(iso)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 1000)
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

let lockTimer: any

function checkLockStatus() {
  if (!form.username) { lockInfo.value = null; lockCountdown.value = ''; return }
  const info = userStore.getAccountStatus(form.username)
  lockInfo.value = { locked: info.locked, lockedUntil: info.lockedUntil }
  updateLockCountdown()
}

function updateLockCountdown() {
  if (!lockInfo.value?.locked) { lockCountdown.value = ''; return }
  const remain = Math.max(0, Math.ceil((lockInfo.value!.lockedUntil - Date.now()) / 1000))
  const m = Math.floor(remain / 60)
  const s = remain % 60
  lockCountdown.value = `${m}:${String(s).padStart(2, '0')}`
}

watch(() => form.username, () => {
  checkLockStatus()
  lastErrorMsg.value = ''
  lastRemainAttempts.value = null
})

onMounted(() => {
  refreshCaptcha()
  loginAudits.value = userStore.getAuditLogs()

  lockTimer = setInterval(() => {
    if (lockInfo.value?.locked) updateLockCountdown()
  }, 1000)

  const redirect = (route.query.redirect as string) || ''
  if (redirect && userStore.token) {
    ElMessage.info(`检测到已登录会话，自动跳转到：${redirect || '/dashboard'}`)
    router.replace(redirect || '/dashboard')
  }

  if (route.query.test === '1') {
    setTimeout(async () => {
      try {
        ElMessage.info('测试模式：自动以 admin 账号登录...')
        const testCaptcha = captcha.value
        const result = await userStore.login('admin', '123456', testCaptcha, testCaptcha)
        ElMessage.success(`测试登录成功：${result.user.roleName}`)
        await router.replace('/dashboard')
      } catch (err: any) {
        ElMessage.error(`测试登录失败：${err.message}`)
        console.error('测试登录失败详情:', err)
      }
    }, 1000)
  }
})

onUnmounted(() => clearInterval(lockTimer))

async function handleLogin() {
  debugError.value = ''
  try {
    debugStatus.value = '开始登录流程...'
    lastErrorMsg.value = ''
    lastAuditId.value = ''
    lastErrorCode.value = ''
    lastRemainAttempts.value = null

    if (!formRef.value) {
      debugStatus.value = '表单未初始化'
      debugError.value = '表单引用不存在'
      ElMessage.error('表单未初始化完成，请稍候重试')
      return
    }

    debugStatus.value = '正在验证表单...'

    let valid = false
    try {
      valid = await formRef.value.validate()
    } catch (e: any) {
      debugError.value = `表单验证异常: ${e?.message || e}`
      valid = false
    }

    if (!valid) {
      debugStatus.value = '表单验证失败'
      debugError.value = '请检查账号、密码、验证码是否填写正确'
      ElMessage.warning('请完善登录信息（账号、密码、验证码均为必填）')
      return
    }

    debugStatus.value = '检查账号锁定状态...'
    checkLockStatus()
    if (lockInfo.value?.locked) {
      debugStatus.value = '账号已锁定'
      lastErrorMsg.value = `账号已被临时锁定，请 ${lockCountdown.value} 后再试（连续5次密码错误触发，持续15分钟）`
      lastErrorType.value = 'error'
      return
    }

    debugStatus.value = '正在验证身份...'
    loading.value = true

    const result = await userStore.login(
      String(form.username || '').trim(),
      String(form.password || ''),
      String(form.verifyCode || ''),
      String(captcha.value || '')
    )

    debugStatus.value = '登录成功，准备跳转...'
    loginAudits.value = userStore.getAuditLogs()

    const roleName = result.user.roleName
    const allowedModules = result.user.allowedRoutes

    ElNotification({
      title: `登录成功 · 欢迎回来，${roleName}`,
      message: `登录IP：${result.user.loginIp}  |  授权模块：${allowedModules.length} 个  |  审计号：${result.auditId}`,
      type: 'success',
      duration: 3000,
      position: 'top-right'
    })

    const redirect = (route.query.redirect as string) || '/dashboard'

    await new Promise(r => setTimeout(r, 300))
    debugStatus.value = `正在跳转到 ${redirect}...`
    await router.replace(redirect)
    debugStatus.value = '跳转完成'

  } catch (err: any) {
    loading.value = false
    debugStatus.value = '登录失败'
    debugError.value = err?.message || '未知错误'

    try {
      refreshCaptcha()
      form.verifyCode = ''
      loginAudits.value = userStore.getAuditLogs()

      lastAuditId.value = err?.auditId || ''
      lastErrorCode.value = err?.errorCode || 'unknown'
      lastRemainAttempts.value = typeof err?.remainAttempts === 'number' ? err.remainAttempts : null
      lastErrorMsg.value = err?.message || '登录失败，请稍后重试'
      lastErrorType.value = err?.errorCode === 'wrong_captcha' ? 'warning' : 'error'

      checkLockStatus()

      if (err?.errorCode === 'account_locked') {
        ElNotification({
          title: '账号安全触发',
          message: `账号 ${form.username} 因连续错误已被临时锁定，审计号：${err.auditId}`,
          type: 'error',
          duration: 5000
        })
      }
    } catch (innerErr) {
      console.error('登录错误处理异常:', innerErr)
      debugError.value = `错误处理异常: ${innerErr}`
      ElMessage.error('登录失败，请刷新页面后重试')
    }
  } finally {
    loading.value = false
  }
}

function forgotPwd() {
  ElNotification({
    title: '密码重置',
    message: '请联系郑州市大数据管理局 · 平台管理处进行身份核验后重置密码',
    type: 'info',
    duration: 4000
  })
}

async function handleQuickTest() {
  debugStatus.value = '快速登录中...'
  debugError.value = ''
  try {
    ElMessage.info('测试模式：正在绕过验证直接进入...')
    const result = await userStore.login('admin', '123456', 'TEST', 'TEST')
    debugStatus.value = '快速登录成功，跳转中...'
    ElMessage.success(`测试登录成功：${result.user.roleName}，模块数：${result.user.allowedRoutes.length}`)
    loginAudits.value = userStore.getAuditLogs()
    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirect)
  } catch (err: any) {
    debugStatus.value = '快速登录失败'
    debugError.value = err?.message || '未知错误'
    ElMessage.error(`测试登录失败：${err.message || '未知错误'}`)
    console.error('测试登录失败详情:', err)
  }
}

async function debugStepByStep() {
  debugError.value = ''
  debugStatus.value = '【单步调试】步骤1：检查表单引用...'
  await new Promise(r => setTimeout(r, 500))

  if (!formRef.value) {
    debugStatus.value = '【单步调试】失败：表单引用不存在'
    debugError.value = 'formRef.value is null'
    return
  }
  debugStatus.value = '【单步调试】步骤1完成：表单引用正常'
  await new Promise(r => setTimeout(r, 500))

  debugStatus.value = '【单步调试】步骤2：检查表单数据...'
  await new Promise(r => setTimeout(r, 500))
  debugStatus.value = `【单步调试】步骤2完成：username=${form.username || '(空)'}, password=${form.password ? '有' : '无'}, verifyCode=${form.verifyCode || '(空)'}`
  await new Promise(r => setTimeout(r, 500))

  debugStatus.value = '【单步调试】步骤3：验证表单...'
  await new Promise(r => setTimeout(r, 500))

  let valid = false
  try {
    valid = await formRef.value.validate()
  } catch (e: any) {
    debugStatus.value = '【单步调试】步骤3失败：表单验证抛出异常'
    debugError.value = `验证异常: ${e?.message || e}`
    return
  }

  if (!valid) {
    debugStatus.value = '【单步调试】步骤3失败：表单验证不通过'
    debugError.value = '请检查必填项是否都已填写'
    return
  }
  debugStatus.value = '【单步调试】步骤3完成：表单验证通过'
  await new Promise(r => setTimeout(r, 500))

  debugStatus.value = '【单步调试】步骤4：调用登录接口...'
  await new Promise(r => setTimeout(r, 500))

  try {
    const result = await userStore.login(
      String(form.username || '').trim(),
      String(form.password || ''),
      String(form.verifyCode || ''),
      String(captcha.value || '')
    )
    debugStatus.value = `【单步调试】步骤4完成：登录成功，角色=${result.user.roleName}`
    loginAudits.value = userStore.getAuditLogs()
    await new Promise(r => setTimeout(r, 500))

    debugStatus.value = '【单步调试】步骤5：准备跳转...'
    await new Promise(r => setTimeout(r, 500))

    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirect)
    debugStatus.value = '【单步调试】全部完成：已跳转'
  } catch (err: any) {
    debugStatus.value = '【单步调试】步骤4失败：登录接口返回错误'
    debugError.value = err?.message || '未知错误'
    refreshCaptcha()
    form.verifyCode = ''
    loginAudits.value = userStore.getAuditLogs()
  }
}

function clearDebugInfo() {
  debugStatus.value = '等待输入'
  debugError.value = ''
  lastErrorMsg.value = ''
  lastAuditId.value = ''
  lastErrorCode.value = ''
  form.username = ''
  form.verifyCode = ''
  refreshCaptcha()
  ElMessage.info('状态已重置')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.login-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0D3A7C 0%, #1E4FA5 50%, #3B7DD8 100%);
}

.login-bg {
  position: absolute; inset: 0; pointer-events: none;
  .bg-shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.15;
    background: radial-gradient(circle, #fff 0%, transparent 70%);
  }
  .shape-1 { width: 500px; height: 500px; top: -200px; right: -100px; }
  .shape-2 { width: 400px; height: 400px; bottom: -150px; left: -100px; }
  .shape-3 { width: 200px; height: 200px; top: 40%; left: 40%; opacity: 0.1; }
}

.login-wrapper {
  position: relative; z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 48px;
  max-width: 1440px;
  margin: 0 auto;
}

.login-left {
  color: #fff; flex: 1; max-width: 580px; overflow-y: auto; max-height: 100vh; padding-right: 8px;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 3px; }

  .brand {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 40px;

    .brand-logo {
      width: 80px; height: 80px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .brand-text h1 {
      font-size: 30px;
      font-weight: 700;
      margin: 0 0 6px;
      letter-spacing: 2px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .brand-text p {
      font-size: 14px;
      margin: 0;
      opacity: 0.85;
      letter-spacing: 1px;
    }
  }

  .stats-showcase {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;

    .showcase-item {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 16px;

      .showcase-num {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .showcase-label {
        font-size: 12px;
        opacity: 0.75;
      }
    }
  }

  .feature-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      opacity: 0.9;
      padding: 8px 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
  }

  .audit-panel {
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(255, 82, 82, 0.35);
    backdrop-filter: blur(6px);
    border-radius: 12px;
    padding: 12px 14px;

    .audit-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 10px;
      :deep(.el-button) { margin-left: auto; padding: 4px 8px; }
    }

    .audit-list { display: flex; flex-direction: column; gap: 6px; }
    .audit-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; color: rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.06);
      border-radius: 6px; padding: 6px 10px;
      flex-wrap: wrap;
      .audit-ts { opacity: 0.7; }
      .audit-user { font-weight: 600; &.fail { color: #ff9c9c; } }
      .audit-reason { color: #ffd27a; font-style: italic; }
      .audit-ip { opacity: 0.6; margin-left: auto; font-family: monospace; }
      .audit-role { color: #9be7a5; font-weight: 600; }
    }
  }
}

.login-right { width: 460px; flex-shrink: 0; }

.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 36px 32px 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);

  h2 { font-size: 24px; font-weight: 700; color: $text-primary; margin: 0 0 4px; }
  .login-sub { font-size: 13px; color: $text-secondary; margin: 0 0 24px; }

  .captcha {
    flex: 0 0 130px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: linear-gradient(135deg, #eaf3ff 0%, #dbeeff 100%);
    border: 1px solid $border-light;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    user-select: none;
    overflow: hidden;

    &::before {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background-image: repeating-linear-gradient(
        45deg, transparent, transparent 4px, rgba(30,79,165,0.06) 4px, rgba(30,79,165,0.06) 8px
      );
    }

    &:hover { background: linear-gradient(135deg, #dcebff 0%, #c9dfff 100%); }
    &.captcha-error { border-color: $danger-color; animation: shake 0.4s; }

    .captcha-char {
      font-weight: 900; font-size: 22px; color: $primary-color;
      font-family: 'Georgia', serif; font-style: italic;
      display: inline-block; text-shadow: 1px 1px 2px rgba(0,0,0,0.15);
    }
    .captcha-refresh-icon {
      margin-left: auto; padding: 0 8px; color: rgba(30,79,165,0.5); font-size: 14px;
      &:hover { color: $primary-color; }
    }
  }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  .login-btn {
    width: 100%;
    height: 46px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 10px;
    background: linear-gradient(135deg, #1E4FA5 0%, #3B7DD8 100%);
    border: none;
    letter-spacing: 6px;

    &:hover {
      background: linear-gradient(135deg, #0D3A7C 0%, #1E4FA5 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(30,79,165,0.35);
    }
  }

  .demo-accounts {
    display: flex; flex-direction: column; gap: 8px;

    .demo-account-chip {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: #f5f9ff;
      border: 1px solid #e0ecff;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;

      &:hover {
        background: #eaf3ff; border-color: #b3ccf5;
        transform: translateX(4px);
      }

      strong { color: $primary-color; font-size: 14px; }
      .chip-pwd { color: $text-secondary; }
      .chip-code { margin-left: auto; font-size: 12px; color: $text-secondary; }
      .chip-code code {
        background: #fff;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 700;
        color: #c0392b;
        letter-spacing: 3px;
        font-family: monospace;
      }
    }
  }

  .security-tip {
    margin-top: 18px;
    padding: 12px;
    background: #FFFAF0;
    border: 1px solid #FAECD8;
    border-radius: 10px;
    font-size: 12px;
    color: #B8823B;
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .el-icon { font-size: 16px; margin-top: 1px; flex-shrink: 0; }

    code {
      background: rgba(0,0,0,0.04);
      padding: 0 4px;
      border-radius: 3px;
      font-family: monospace;
    }

    .danger { color: $danger-color; }
  }

  .debug-panel {
    margin-top: 16px;
    border: 1px solid #e0ecff;
    border-radius: 10px;
    background: #f5f9ff;
    overflow: hidden;

    .debug-header {
      padding: 10px 14px;
      background: linear-gradient(135deg, rgba(30,79,165,0.08) 0%, rgba(59,125,216,0.08) 100%);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      color: $primary-color;
    }

    .debug-content {
      padding: 12px 14px;
    }

    .debug-item {
      display: flex;
      font-size: 12px;
      line-height: 1.8;
      color: $text-secondary;

      .debug-label {
        flex-shrink: 0;
        width: 80px;
        color: #888;
      }

      .debug-value {
        flex: 1;
        color: $text-primary;
        word-break: break-all;
      }

      &.debug-error {
        .debug-value {
          color: $danger-color;
          font-weight: 500;
        }
      }

      .status-idle { color: #888; }
      .status-loading { color: $primary-color; font-weight: 500; }
      .status-success { color: $success-color; font-weight: 600; }
      .status-error { color: $danger-color; font-weight: 600; }
    }

    .debug-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #d0e0ff;
    }
  }
}
</style>
