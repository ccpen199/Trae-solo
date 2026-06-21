<template>
  <div class="identity-page">
    <div class="page-header primary-gradient">
      <div class="header-title">码上办</div>
      <div class="header-subtitle">12类证件一码通行</div>
    </div>

    <div class="page-content">
      <div class="code-card card" @click="showIdentityCode">
        <div class="code-header">
          <div class="code-title">电子身份码</div>
          <div class="risk-tag" :class="'risk-' + riskLevel">{{ riskText }}</div>
        </div>
        <div class="qr-placeholder">
          <van-icon name="qr" size="80" color="#ccc" />
          <div class="qr-tip">点击展示身份码</div>
        </div>
        <div class="code-footer">
          <div class="code-info">
            <span class="label">姓名</span>
            <span class="value">{{ userInfo?.real_name || '***' }}</span>
          </div>
          <div class="code-info">
            <span class="label">证件号</span>
            <span class="value">{{ maskedIdCard }}</span>
          </div>
        </div>
      </div>

      <div class="action-grid card">
        <div class="action-item" @click="showIdentityCode">
          <div class="action-icon code-icon">
            <van-icon name="qr" size="24" />
          </div>
          <div class="action-text">亮码</div>
        </div>
        <div class="action-item" @click="goToCertificates">
          <div class="action-icon cert-icon">
            <van-icon name="description" size="24" />
          </div>
          <div class="action-text">我的证件</div>
        </div>
        <div class="action-item" @click="checkRisk">
          <div class="action-icon risk-icon">
            <van-icon name="shield-o" size="24" />
          </div>
          <div class="action-text">风险评估</div>
        </div>
        <div class="action-item" @click="showOfflineCode">
          <div class="action-icon offline-icon">
            <van-icon name="signal-o" size="24" />
          </div>
          <div class="action-text">离线码</div>
        </div>
      </div>

      <div class="cert-list card">
        <div class="section-title">
          <span>我的证件 ({{ certCount }})</span>
          <span class="more" @click="goToCertificates">全部 <van-icon name="arrow" /></span>
        </div>
        <div class="cert-grid">
          <div 
            v-for="cert in certificates.slice(0, 6)" 
            :key="cert.id" 
            class="cert-item"
            @click="showCertDetail(cert)"
          >
            <div class="cert-icon">{{ cert.type_info?.icon }}</div>
            <div class="cert-name">{{ cert.cert_name }}</div>
          </div>
        </div>
      </div>

      <div class="feature-list card">
        <div class="section-title">热门服务</div>
        <div class="feature-item">
          <div class="feature-icon">🪪</div>
          <div class="feature-info">
            <div class="feature-name">身份证补办</div>
            <div class="feature-desc">全程网办，最快当日可取</div>
          </div>
          <van-icon name="arrow" color="#ccc" />
        </div>
        <div class="feature-item">
          <div class="feature-icon">💳</div>
          <div class="feature-info">
            <div class="feature-name">社保查询</div>
            <div class="feature-desc">实时查询缴费记录</div>
          </div>
          <van-icon name="arrow" color="#ccc" />
        </div>
        <div class="feature-item">
          <div class="feature-icon">🚗</div>
          <div class="feature-info">
            <div class="feature-name">驾驶证换证</div>
            <div class="feature-desc">线上申请，邮寄到家</div>
          </div>
          <van-icon name="arrow" color="#ccc" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import { getCertificates, getRiskAssessment } from '../api/identity'
import { getUserInfo } from '../api/users'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(null)
const certificates = ref([])
const riskLevel = ref('low')
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

const certCount = computed(() => certificates.value.length)

async function loadUserInfo() {
  try {
    const data = await getUserInfo(userStore.currentUserId)
    userInfo.value = data
  } catch (e) {
    console.error(e)
  }
}

async function loadCertificates() {
  try {
    const data = await getCertificates(userStore.currentUserId)
    certificates.value = data || []
  } catch (e) {
    console.error(e)
  }
}

async function checkRisk() {
  try {
    const data = await getRiskAssessment(userStore.currentUserId)
    riskLevel.value = data.risk_level
    showToast(`当前风险等级：${riskText.value}`)
  } catch (e) {
    console.error(e)
  }
}

function showIdentityCode() {
  router.push('/identity/code')
}

function showOfflineCode() {
  router.push({ path: '/identity/code', query: { offline: 1 } })
}

function goToCertificates() {
  router.push('/identity/certificates')
}

function showCertDetail(cert) {
  showToast(cert.cert_name + ' - ' + cert.cert_number)
}

onMounted(() => {
  loadUserInfo()
  loadCertificates()
  checkRisk()
})
</script>

<style scoped>
.identity-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  padding: 40px 20px 60px;
  color: #fff;
  text-align: center;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.page-content {
  margin-top: -40px;
  padding: 0 12px;
}

.code-card {
  padding: 20px;
  margin-bottom: 12px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.code-title {
  font-size: 18px;
  font-weight: 600;
}

.risk-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 16px;
}

.qr-tip {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

.code-footer {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.code-info {
  text-align: center;
  .label {
    font-size: 12px;
    color: #999;
    display: block;
    margin-bottom: 4px;
  }
  .value {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px 10px;
  margin-bottom: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 8px;
}

.code-icon {
  background: linear-gradient(135deg, #1e88e5, #1565c0);
}

.cert-icon {
  background: linear-gradient(135deg, #43a047, #2e7d32);
}

.risk-icon {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.offline-icon {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
}

.action-text {
  font-size: 13px;
  color: #333;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.section-title .more {
  font-size: 13px;
  color: #999;
  font-weight: normal;
}

.cert-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cert-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: #f8f9fa;
  border-radius: 10px;
}

.cert-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.cert-name {
  font-size: 13px;
  color: #333;
  text-align: center;
}

.feature-list {
  .feature-item {
    display: flex;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .feature-item:last-child {
    border-bottom: none;
  }
}

.feature-icon {
  font-size: 28px;
  margin-right: 14px;
}

.feature-info {
  flex: 1;
}

.feature-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.feature-desc {
  font-size: 12px;
  color: #999;
}
</style>
