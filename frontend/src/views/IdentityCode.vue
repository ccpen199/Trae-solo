<template>
  <div class="code-page">
    <div class="page-header">
      <van-nav-bar
        title="电子身份码"
        left-text="返回"
        left-arrow
        @click-left="onBack"
      />
    </div>

    <div class="code-container">
      <div class="code-card">
        <div class="code-header">
          <div class="user-avatar">
            {{ userInfo?.real_name?.charAt(0) || '用' }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ userInfo?.real_name || '***' }}</div>
            <div class="user-idcard">{{ maskedIdCard }}</div>
          </div>
          <div class="risk-badge" :class="'risk-' + riskLevel">
            {{ riskText }}
          </div>
        </div>

        <div class="qr-wrapper">
          <div class="qr-code" ref="qrCode">
            <canvas v-if="qrDataUrl" />
            <div v-else class="qr-loading">
              <van-loading size="32" />
              <span>生成中...</span>
            </div>
          </div>
          <div v-if="codeInfo" class="code-tip">
            <van-icon name="info-o" />
            <span>{{ isOffline ? '离线码有效期7天' : '动态码每5分钟刷新' }}</span>
          </div>
        </div>

        <div class="code-info-grid">
          <div class="info-item">
            <div class="info-label">证件类型</div>
            <div class="info-value">居民身份证</div>
          </div>
          <div class="info-item">
            <div class="info-label">有效期至</div>
            <div class="info-value">{{ expireAt }}</div>
          </div>
        </div>
      </div>

      <div class="action-section">
        <div class="action-row">
          <div class="action-btn" @click="refreshCode">
            <van-icon name="replay" size="24" />
            <span>刷新</span>
          </div>
          <div class="action-btn" @click="toggleOffline">
            <van-icon :name="isOffline ? 'wap-home-o' : 'signal-o'" size="24" />
            <span>{{ isOffline ? '在线码' : '离线码' }}</span>
          </div>
          <div class="action-btn" @click="showRiskDetail">
            <van-icon name="shield-o" size="24" />
            <span>安全等级</span>
          </div>
        </div>
      </div>

      <div class="cert-types card">
        <div class="section-title">选择证件类型</div>
        <div class="cert-tabs">
          <div 
            v-for="type in certTypes" 
            :key="type.value"
            class="cert-tab"
            :class="{ active: currentCertType === type.value }"
            @click="switchCertType(type.value)"
          >
            <span class="cert-icon">{{ type.icon }}</span>
            <span class="cert-name">{{ type.name }}</span>
          </div>
        </div>
      </div>

      <div class="notice-card">
        <van-icon name="info-o" color="#ff9800" />
        <div class="notice-text">
          电子身份码与实体证件具有同等法律效力，请在政务服务窗口出示使用
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast, showDialog } from 'vant'
import QRCode from 'qrcode'
import { generateCode, getRiskAssessment } from '../api/identity'
import { getUserInfo } from '../api/users'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(null)
const codeInfo = ref(null)
const qrDataUrl = ref('')
const riskLevel = ref('low')
const currentCertType = ref('id_card')
const isOffline = ref(false)

let refreshTimer = null

const riskText = computed(() => {
  const map = { low: '低风险', medium: '中风险', high: '高风险' }
  return map[riskLevel.value] || '低风险'
})

const maskedIdCard = computed(() => {
  if (userInfo.value?.id_card) {
    return userInfo.value.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }
  return '***'
})

const expireAt = computed(() => {
  if (codeInfo.value?.expire_at) {
    return codeInfo.value.expire_at.replace('T', ' ').slice(0, 16)
  }
  return '-'
})

const certTypes = [
  { value: 'id_card', name: '身份证', icon: '🪪' },
  { value: 'social_security', name: '社保卡', icon: '💳' },
  { value: 'driving_license', name: '驾驶证', icon: '🚗' },
  { value: 'all', name: '全部', icon: '📋' },
]

function onBack() {
  router.back()
}

async function loadUserInfo() {
  try {
    const data = await getUserInfo(userStore.currentUserId)
    userInfo.value = data
  } catch (e) {
    console.error(e)
  }
}

async function generateIdentityCode() {
  try {
    qrDataUrl.value = ''
    const data = await generateCode({
      userId: userStore.currentUserId,
      certType: currentCertType.value,
      isOffline: isOffline.value
    })
    codeInfo.value = data
    riskLevel.value = data.risk_level
    
    const qrData = data.qr_data || data.code_token
    QRCode.toDataURL(qrData, { width: 220, margin: 2 }).then(url => {
      qrDataUrl.value = url
      const canvas = document.querySelector('.qr-code canvas')
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
        }
        img.src = url
      }
    })
    
    if (!isOffline.value) {
      startAutoRefresh()
    }
  } catch (e) {
    console.error('生成身份码失败', e)
    showToast('生成失败，请重试')
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = setInterval(() => {
    generateIdentityCode()
  }, 4 * 60 * 1000)
}

function refreshCode() {
  generateIdentityCode()
  showToast('已刷新')
}

function toggleOffline() {
  isOffline.value = !isOffline.value
  generateIdentityCode()
}

function switchCertType(type) {
  currentCertType.value = type
  generateIdentityCode()
}

async function showRiskDetail() {
  try {
    const data = await getRiskAssessment(userStore.currentUserId)
    showDialog({
      title: '安全风险评估',
      message: `风险等级：${data.risk_level === 'low' ? '低风险' : data.risk_level === 'medium' ? '中风险' : '高风险'}\n风险评分：${data.total_score}\n${data.suggestions}`,
      confirmButtonText: '知道了'
    })
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  isOffline.value = route.query.offline === '1'
  loadUserInfo()
  generateIdentityCode()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.code-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1e88e5 0%, #1565c0 30%, #f5f7fa 30%);
}

.page-header {
  background: transparent;
  :deep(.van-nav-bar) {
    background: transparent;
    color: #fff;
  }
  :deep(.van-nav-bar__title) {
    color: #fff;
  }
  :deep(.van-nav-bar__text) {
    color: #fff;
  }
  :deep(.van-icon-arrow-left) {
    color: #fff;
  }
}

.code-container {
  padding: 0 16px;
}

.code-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-top: 10px;
}

.code-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e88e5, #1565c0);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  margin-right: 14px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-idcard {
  font-size: 13px;
  color: #999;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  margin-bottom: 20px;
}

.qr-code {
  width: 220px;
  height: 220px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.qr-code canvas {
  width: 200px;
  height: 200px;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #999;
  font-size: 14px;
}

.code-tip {
  margin-top: 16px;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.code-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.info-item {
  text-align: center;
}

.info-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.info-value {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.action-section {
  margin: 20px 0;
}

.action-row {
  display: flex;
  justify-content: space-around;
  background: #fff;
  border-radius: 12px;
  padding: 20px 10px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
  font-size: 13px;
  gap: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.cert-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cert-tab {
  flex: 1;
  min-width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.cert-tab.active {
  background: #e3f2fd;
  border-color: #1e88e5;
}

.cert-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.cert-name {
  font-size: 12px;
  color: #333;
}

.notice-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  background: #fff8e1;
  border-radius: 10px;
  margin-top: 16px;
}

.notice-text {
  flex: 1;
  font-size: 13px;
  color: #f57c00;
  line-height: 1.6;
}
</style>
