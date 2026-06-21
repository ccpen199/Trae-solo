<template>
  <div class="code-page">
    <div class="blue-header">
      <van-nav-bar title="电子身份码" left-text="返回" left-arrow @click-left="router.back()" />
    </div>

    <div class="page-content">
      <div class="code-card">
        <div class="card-top">
          <div class="user-row">
            <div class="avatar">{{ userInfo?.real_name?.charAt(0) || '用' }}</div>
            <div class="user-detail">
              <div class="name">{{ userInfo?.real_name || '***' }}</div>
              <div class="id-row">
                <span class="id-num">{{ maskedIdCard }}</span>
                <span class="risk-tag" :class="'rt-' + riskLevel">{{ riskText }}</span>
              </div>
            </div>
          </div>
          <div class="mode-switch">
            <div class="switch-btn" :class="{ active: !isOffline }" @click="switchDynamic">动态码</div>
            <div class="switch-btn" :class="{ active: isOffline }" @click="switchOffline">离线码</div>
          </div>
        </div>

        <div class="qr-area" @click="goVerify">
          <div class="qr-frame">
            <img v-if="qrDataUrl" :src="qrDataUrl" class="qr-img" />
            <div v-else class="qr-loading">
              <van-loading size="36" color="#1976d2" />
              <span>正在生成...</span>
            </div>
          </div>
          <div class="code-meta">
            <div class="meta-left">
              <span class="pulse-dot" :class="isOffline ? 'offline' : 'online'"></span>
              <span>{{ isOffline ? '离线码 · 7天有效' : '动态码 · 5分钟刷新' }}</span>
            </div>
            <div class="meta-right" v-if="expireAt">到期：{{ expireAt }}</div>
          </div>
          <div class="countdown" v-if="!isOffline && countdown > 0">
            <van-circle :current-rate="countdownPercent" :rate="countdownPercent" :speed="100" size="28px" :stroke-width="60" color="#1976d2" layer-color="#e3f2fd">
              <span class="cd-num">{{ countdown }}</span>
            </van-circle>
            <span class="cd-text">秒后刷新</span>
          </div>
        </div>

        <div class="cert-summary">
          <div class="summary-title">已整合证件 <span class="summary-count">{{ certList.length }}/12</span></div>
          <div class="cert-row">
            <div class="cert-chip" v-for="c in certList.slice(0, 6)" :key="c.type" :class="{ verified: c.verified }">
              <span class="chip-icon">{{ c.icon }}</span>
              <span class="chip-name">{{ c.short }}</span>
              <van-icon v-if="c.verified" name="passed" size="12" color="#43a047" />
              <van-icon v-else name="warning-o" size="12" color="#ff9800" />
            </div>
          </div>
          <div class="cert-row" v-if="certList.length > 6">
            <div class="cert-chip" v-for="c in certList.slice(6, 12)" :key="c.type" :class="{ verified: c.verified }">
              <span class="chip-icon">{{ c.icon }}</span>
              <span class="chip-name">{{ c.short }}</span>
              <van-icon v-if="c.verified" name="passed" size="12" color="#43a047" />
              <van-icon v-else name="warning-o" size="12" color="#ff9800" />
            </div>
          </div>
          <div class="view-all" @click="goCerts">查看全部证件 →</div>
        </div>
      </div>

      <div class="risk-section card">
        <div class="section-head">
          <div class="section-title">动态风险校验</div>
          <span class="refresh-btn" @click="refreshRisk"><van-icon name="replay" size="14" /> 刷新</span>
        </div>
        <div class="risk-overview">
          <div class="risk-score-ring" :class="'ring-' + riskLevel">
            <span class="score-num">{{ riskData.total_score || 0 }}</span>
            <span class="score-label">/100</span>
          </div>
          <div class="risk-dims">
            <div class="dim-item" v-for="d in riskDimensions" :key="d.key">
              <div class="dim-head">
                <span class="dim-name">{{ d.icon }} {{ d.name }}</span>
                <span class="dim-val" :class="'dv-' + d.level">{{ d.score }}分</span>
              </div>
              <div class="dim-bar">
                <div class="dim-fill" :style="{ width: d.score + '%', background: d.color }"></div>
              </div>
            </div>
          </div>
        </div>
        <van-button plain block size="small" @click="goRiskDetail">查看风险评估详情</van-button>
      </div>

      <div class="actions-row">
        <div class="act-btn" @click="refreshCode">
          <div class="act-icon"><van-icon name="replay" size="22" /></div>
          <span>刷新码</span>
        </div>
        <div class="act-btn" @click="goRecords">
          <div class="act-icon"><van-icon name="clock-o" size="22" /></div>
          <span>亮码记录</span>
        </div>
        <div class="act-btn" @click="goRiskDetail">
          <div class="act-icon"><van-icon name="shield-o" size="22" /></div>
          <span>风险详情</span>
        </div>
        <div class="act-btn" @click="goCerts">
          <div class="act-icon"><van-icon name="description" size="22" /></div>
          <span>证件管理</span>
        </div>
      </div>

      <div class="notice-bar">
        <van-icon name="info-o" color="#ff9800" size="14" />
        <span>电子身份码与实体证件具有同等法律效力，请在政务服务窗口出示</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import QRCode from 'qrcode'
import { generateCode, getRiskAssessment, getCertificates } from '../api/identity'
import { getUserInfo } from '../api/users'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(null)
const codeInfo = ref(null)
const qrDataUrl = ref('')
const riskLevel = ref('low')
const riskData = ref({})
const isOffline = ref(false)
const certList = ref([])
const countdown = ref(300)
let refreshTimer = null
let countdownTimer = null

const riskText = computed(() => ({ low: '低风险', medium: '中风险', high: '高风险' }[riskLevel.value] || '低风险'))
const maskedIdCard = computed(() => userInfo.value?.id_card ? userInfo.value.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : '***')
const expireAt = computed(() => codeInfo.value?.expire_at ? codeInfo.value.expire_at.replace('T', ' ').slice(0, 16) : '-')
const countdownPercent = computed(() => (countdown.value / 300) * 100)

const riskDimensions = computed(() => {
  const factors = riskData.value?.factors || []
  const dimMap = {
    '实名认证状态': { name: '实名认证', icon: '🪪', key: 'identity' },
    '常用设备验证': { name: '设备安全', icon: '📱', key: 'device' },
    '地理位置校验': { name: '地理位置', icon: '📍', key: 'location' },
    '行为模式分析': { name: '行为模式', icon: '👤', key: 'behavior' }
  }
  return factors.map(f => {
    const dim = dimMap[f.name] || { name: f.name, icon: '📋', key: 'other' }
    const colorMap = { pass: '#43a047', warning: '#ff9800', fail: '#e53935' }
    const levelMap = { pass: 'low', warning: 'medium', fail: 'high' }
    return {
      ...dim,
      score: f.score || 0,
      level: levelMap[f.status] || 'low',
      color: colorMap[f.status] || '#43a047'
    }
  })
})

const allCertTypes = [
  { type: 'id_card', name: '居民身份证', short: '身份证', icon: '🪪' },
  { type: 'social_security', name: '社会保障卡', short: '社保卡', icon: '💳' },
  { type: 'driving_license', name: '驾驶证', short: '驾驶证', icon: '🚗' },
  { type: 'passport', name: '护照', short: '护照', icon: '🛂' },
  { type: 'hk_macau', name: '港澳通行证', short: '港澳证', icon: '🏗️' },
  { type: 'residence', name: '居住证', short: '居住证', icon: '🏠' },
  { type: 'birth_cert', name: '出生医学证明', short: '出生证', icon: '👶' },
  { type: 'marriage', name: '结婚证', short: '结婚证', icon: '💒' },
  { type: 'housing_fund', name: '公积金卡', short: '公积金', icon: '🏦' },
  { type: 'medical', name: '医保电子凭证', short: '医保', icon: '❤️‍🩹' },
  { type: 'business_license', name: '营业执照', short: '营业执照', icon: '💼' },
  { type: 'real_estate', name: '不动产权证', short: '房产证', icon: '🏡' }
]

function switchDynamic() { isOffline.value = false; generateIdentityCode() }
function switchOffline() { isOffline.value = true; generateIdentityCode() }
function goCerts() { router.push('/identity/certificates') }
function goRiskDetail() { router.push('/identity/risk') }
function goRecords() { router.push('/identity/records') }
function goVerify() { showToast('身份码校验中...') }

async function loadUserInfo() {
  try { userInfo.value = await getUserInfo(userStore.currentUserId) } catch (e) {}
}

async function loadCerts() {
  try {
    const data = await getCertificates(userStore.currentUserId)
    const userTypes = new Set((data || []).map(c => c.cert_type))
    certList.value = allCertTypes.map(ct => ({
      ...ct,
      verified: userTypes.has(ct.type)
    }))
  } catch (e) {
    certList.value = allCertTypes.map(ct => ({ ...ct, verified: ['id_card', 'social_security', 'driving_license', 'medical', 'birth_cert'].includes(ct.type) }))
  }
}

async function loadRisk() {
  try {
    riskData.value = await getRiskAssessment(userStore.currentUserId)
    riskLevel.value = riskData.value?.risk_level || 'low'
  } catch (e) {}
}

function refreshRisk() { loadRisk(); showToast('已刷新风险校验') }

async function generateIdentityCode() {
  try {
    qrDataUrl.value = ''
    const data = await generateCode({ userId: userStore.currentUserId, certType: 'all', isOffline: isOffline.value })
    codeInfo.value = data
    riskLevel.value = data.risk_level || riskLevel.value
    const qrStr = data.qr_data || data.code_token || 'CQGOV-' + Date.now()
    const url = await QRCode.toDataURL(qrStr, { width: 200, margin: 2, color: { dark: '#1565c0' } })
    qrDataUrl.value = url
    if (!isOffline.value) {
      countdown.value = 300
      startTimers()
    } else {
      stopTimers()
    }
  } catch (e) {
    const fallback = await QRCode.toDataURL('CQGOV-OFFLINE-' + Date.now(), { width: 200, margin: 2, color: { dark: '#1565c0' } })
    qrDataUrl.value = fallback
    codeInfo.value = { expire_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() }
  }
}

function refreshCode() { generateIdentityCode(); showToast('已刷新') }

function startTimers() {
  stopTimers()
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) { generateIdentityCode() }
  }, 1000)
}

function stopTimers() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

onMounted(async () => {
  await Promise.all([loadUserInfo(), loadCerts(), loadRisk()])
  generateIdentityCode()
})

onUnmounted(() => { stopTimers() })
</script>

<style scoped>
.code-page { min-height: 100vh; background: #f5f7fa; }
.blue-header :deep(.van-nav-bar) { background: #1565c0; }
.blue-header :deep(.van-nav-bar__title),
.blue-header :deep(.van-nav-bar__text),
.blue-header :deep(.van-icon-arrow-left) { color: #fff; }
.page-content { padding: 12px; }

.code-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-bottom: 12px;
}
.card-top { margin-bottom: 16px; }
.user-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, #1e88e5, #1565c0);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 600;
}
.name { font-size: 17px; font-weight: 600; color: #333; margin-bottom: 3px; }
.id-row { display: flex; align-items: center; gap: 8px; }
.id-num { font-size: 13px; color: #999; }
.risk-tag {
  font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500;
}
.rt-low { background: #e8f5e9; color: #43a047; }
.rt-medium { background: #fff3e0; color: #ff9800; }
.rt-high { background: #ffebee; color: #e53935; }

.mode-switch {
  display: flex; background: #f5f5f5; border-radius: 20px; padding: 3px;
}
.switch-btn {
  flex: 1; text-align: center; padding: 8px 0; border-radius: 18px;
  font-size: 14px; color: #666; transition: all 0.2s;
}
.switch-btn.active {
  background: #1976d2; color: #fff; font-weight: 600;
  box-shadow: 0 2px 8px rgba(25,118,210,0.3);
}

.qr-area {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px; background: #f0f7ff; border-radius: 14px; margin-bottom: 16px;
}
.qr-frame {
  width: 200px; height: 200px; background: #fff; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  border: 3px solid #e3f2fd; padding: 10px; margin-bottom: 12px;
}
.qr-img { width: 100%; height: 100%; object-fit: contain; }
.qr-loading { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #999; font-size: 14px; }
.code-meta {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: #666;
}
.meta-left { display: flex; align-items: center; gap: 6px; }
.pulse-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 1.5s infinite; }
.pulse-dot.online { background: #43a047; }
.pulse-dot.offline { background: #ff9800; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.countdown {
  display: flex; align-items: center; gap: 6px; margin-top: 8px;
  font-size: 12px; color: #1976d2;
}
.cd-num { font-size: 11px; font-weight: 600; }

.cert-summary {
  padding: 14px; background: #f8f9fa; border-radius: 12px;
}
.summary-title {
  font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.summary-count { font-size: 13px; color: #1976d2; font-weight: 500; }
.cert-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
.cert-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 8px; background: #fff; border-radius: 14px;
  font-size: 11px; color: #666; border: 1px solid #eee;
}
.cert-chip.verified { border-color: #c8e6c9; background: #f1f8e9; }
.chip-icon { font-size: 14px; }
.chip-name { max-width: 48px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.view-all { font-size: 12px; color: #1976d2; text-align: center; padding-top: 6px; }

.card { background: #fff; border-radius: 14px; padding: 16px; margin-bottom: 12px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-title { font-size: 15px; font-weight: 600; color: #333; }
.refresh-btn { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #1976d2; }

.risk-overview { display: flex; gap: 16px; align-items: center; margin-bottom: 14px; }
.risk-score-ring {
  width: 72px; height: 72px; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex-shrink: 0; border: 3px solid;
}
.ring-low { border-color: #43a047; background: #e8f5e9; }
.ring-medium { border-color: #ff9800; background: #fff3e0; }
.ring-high { border-color: #e53935; background: #ffebee; }
.score-num { font-size: 22px; font-weight: 700; color: #333; line-height: 1; }
.score-label { font-size: 10px; color: #999; }
.risk-dims { flex: 1; }
.dim-item { margin-bottom: 10px; }
.dim-item:last-child { margin-bottom: 0; }
.dim-head { display: flex; justify-content: space-between; margin-bottom: 4px; }
.dim-name { font-size: 12px; color: #666; }
.dim-val { font-size: 12px; font-weight: 500; }
.dv-low { color: #43a047; }
.dv-medium { color: #ff9800; }
.dv-high { color: #e53935; }
.dim-bar { height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.dim-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }

.actions-row {
  display: flex; justify-content: space-around;
  background: #fff; border-radius: 14px; padding: 16px 8px; margin-bottom: 12px;
}
.act-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.act-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: #e3f2fd; display: flex; align-items: center; justify-content: center; color: #1976d2;
}
.act-btn span { font-size: 12px; color: #666; }

.notice-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 14px; background: #fffbe6; border-radius: 10px;
  font-size: 12px; color: #b26a00; line-height: 1.5;
}
</style>
