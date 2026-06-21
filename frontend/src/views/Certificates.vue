<template>
  <div class="certificates-page">
    <van-nav-bar
      title="我的证件"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div class="page-content">
      <div class="cert-stats card">
        <div class="stat-item">
          <div class="stat-number">{{ certificates.length }}</div>
          <div class="stat-label">已添加证件</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ validCount }}</div>
          <div class="stat-label">有效证件</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">12</div>
          <div class="stat-label">支持种类</div>
        </div>
      </div>

      <div class="cert-list">
        <div 
          v-for="cert in certificates" 
          :key="cert.id" 
          class="cert-card card"
          @click="showCertDetail(cert)"
        >
          <div class="cert-icon">{{ cert.type_info?.icon || '📄' }}</div>
          <div class="cert-info">
            <div class="cert-name">{{ cert.cert_name }}</div>
            <div class="cert-number">{{ cert.cert_number }}</div>
            <div class="cert-date">有效期至：{{ cert.expire_date }}</div>
          </div>
          <div class="cert-status">
            <van-tag :type="cert.status ? 'success' : 'danger'" size="medium">
              {{ cert.status ? '有效' : '已失效' }}
            </van-tag>
          </div>
        </div>
      </div>

      <div class="add-tip">
        <van-icon name="info-o" />
        <span>支持12类证件，点击"+"添加更多证件</span>
      </div>
    </div>

    <van-popup v-model:show="showDetail" round position="bottom" :style="{ height: '60%' }">
      <div class="detail-content" v-if="currentCert">
        <div class="detail-header">
          <div class="detail-icon">{{ currentCert.type_info?.icon }}</div>
          <div class="detail-title">{{ currentCert.cert_name }}</div>
        </div>
        <div class="detail-list">
          <div class="detail-item">
            <span class="label">证件号码</span>
            <span class="value">{{ currentCert.cert_number }}</span>
          </div>
          <div class="detail-item">
            <span class="label">签发日期</span>
            <span class="value">{{ currentCert.issue_date }}</span>
          </div>
          <div class="detail-item">
            <span class="label">有效期至</span>
            <span class="value">{{ currentCert.expire_date }}</span>
          </div>
          <div class="detail-item">
            <span class="label">证件状态</span>
            <span class="value">{{ currentCert.status ? '有效' : '已失效' }}</span>
          </div>
        </div>
        <van-button type="primary" block round @click="showQRCode">
          出示证件码
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { getCertificates } from '../api/identity'

const router = useRouter()
const userStore = useUserStore()

const certificates = ref([])
const showDetail = ref(false)
const currentCert = ref(null)

const validCount = computed(() => {
  return certificates.value.filter(c => c.status).length
})

function onBack() {
  router.back()
}

async function loadCertificates() {
  try {
    const data = await getCertificates(userStore.currentUserId)
    certificates.value = data || []
  } catch (e) {
    console.error(e)
  }
}

function showCertDetail(cert) {
  currentCert.value = cert
  showDetail.value = true
}

function showQRCode() {
  showDetail.value = false
  router.push({ path: '/identity/code', query: { type: currentCert.value.cert_type } })
}

onMounted(() => {
  loadCertificates()
})
</script>

<style scoped>
.certificates-page {
  min-height: 100vh;
  background: #f5f7fa;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-content {
  padding: 12px;
}

.cert-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.cert-list {
  .cert-card {
    display: flex;
    align-items: center;
    padding: 16px;
    margin-bottom: 10px;
  }
}

.cert-icon {
  font-size: 40px;
  margin-right: 16px;
}

.cert-info {
  flex: 1;
}

.cert-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.cert-number {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.cert-date {
  font-size: 12px;
  color: #999;
}

.cert-status {
  flex-shrink: 0;
}

.add-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  font-size: 13px;
  color: #999;
}

.detail-content {
  padding: 20px;
}

.detail-header {
  text-align: center;
  padding: 20px 0 30px;
}

.detail-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.detail-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.detail-list {
  margin-bottom: 30px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item .label {
  color: #999;
  font-size: 14px;
}

.detail-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}
</style>
