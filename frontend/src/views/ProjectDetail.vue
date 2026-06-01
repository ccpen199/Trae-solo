<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getProjectDetail } from '@/api/project'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const error = ref(false)
const project = ref<any>(null)

const fetchProject = async () => {
  const id = route.params.id
  if (!id) return

  loading.value = true
  error.value = false
  try {
    const res = await getProjectDetail(Number(id))
    project.value = res.data
  } catch (err) {
    error.value = true
    console.error('Get project error:', err)
  } finally {
    loading.value = false
  }
}

const goToInvest = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push(`/invest/${project.value.id}`)
}

const formatRate = (rate: number) => {
  return rate ? rate.toFixed(1) : '0.0'
}

const formatAmount = (amount: number) => {
  if (!amount) return '0'
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(2)
}

onMounted(() => {
  fetchProject()
})
</script>

<template>
  <div class="project-detail-page">
    <van-nav-bar title="项目详情" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading" />

    <div v-else-if="error" class="error-container">
      <van-empty description="加载失败" />
      <van-button type="primary" @click="fetchProject">重试</van-button>
    </div>

    <div v-else-if="project" class="content">
      <div class="project-header">
        <div class="project-title">{{ project.title }}</div>
        <div class="project-desc">{{ project.description }}</div>
      </div>

      <div class="rate-section">
        <div class="rate-main">
          <span class="rate-value">{{ formatRate(project.interest_rate) }}</span>
          <span class="rate-unit">%</span>
        </div>
        <div class="rate-label">预期年化收益率</div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-value">{{ project.term }}{{ project.term_unit === 'month' ? '个月' : '天' }}</div>
          <div class="info-label">项目期限</div>
        </div>
        <div class="info-item">
          <div class="info-value">{{ formatAmount(project.amount) }}</div>
          <div class="info-label">项目总额</div>
        </div>
        <div class="info-item">
          <div class="info-value">{{ formatAmount(project.remaining_amount) }}</div>
          <div class="info-label">剩余可投</div>
        </div>
        <div class="info-item">
          <div class="info-value">{{ project.min_invest }}元起</div>
          <div class="info-label">起投金额</div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span>募集进度</span>
          <span>{{ (((project.amount - project.remaining_amount) / project.amount * 100) || 0).toFixed(1) }}%</span>
        </div>
        <van-progress :percentage="((project.amount - project.remaining_amount) / project.amount * 100) || 0" />
      </div>

      <div class="detail-section">
        <div class="section-title">项目详情</div>
        <div class="detail-item">
          <span class="detail-label">借款人</span>
          <span class="detail-value">{{ project.borrower || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">资金用途</span>
          <span class="detail-value">{{ project.purpose || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">风险等级</span>
          <van-tag type="primary" size="small">{{ project.risk_level || '中风险' }}</van-tag>
        </div>
      </div>

      <div class="safety-section">
        <div class="section-title">安全保障</div>
        <div class="safety-list">
          <div class="safety-item">
            <van-icon name="shield-o" size="20" color="#1989fa" />
            <span>第三方资金托管</span>
          </div>
          <div class="safety-item">
            <van-icon name="lock" size="20" color="#1989fa" />
            <span>银行级数据加密</span>
          </div>
          <div class="safety-item">
            <van-icon name="checked" size="20" color="#1989fa" />
            <span>严格风控审核</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="project" class="bottom-bar">
      <div class="balance-info">
        <span class="balance-label">账户余额</span>
        <span class="balance-value">¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</span>
      </div>
      <van-button
        type="primary"
        size="large"
        class="invest-btn"
        :disabled="project.remaining_amount <= 0"
        @click="goToInvest"
      >
        {{ project.remaining_amount > 0 ? '立即投资' : '已售罄' }}
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.project-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  gap: 16px;
}

.project-header {
  background: white;
  padding: 20px 16px;
}

.project-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.project-desc {
  font-size: 14px;
  color: #666;
}

.rate-section {
  background: white;
  padding: 24px 16px;
  margin-top: 12px;
  text-align: center;
}

.rate-main {
  margin-bottom: 8px;
}

.rate-value {
  font-size: 48px;
  font-weight: 700;
  color: #ff4d4f;
}

.rate-unit {
  font-size: 24px;
  color: #ff4d4f;
}

.rate-label {
  font-size: 14px;
  color: #999;
}

.info-grid {
  background: white;
  padding: 16px;
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  text-align: center;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.progress-section {
  background: white;
  padding: 16px;
  margin-top: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.detail-section,
.safety-section {
  background: white;
  padding: 16px;
  margin-top: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #666;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.safety-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.safety-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #333;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.balance-info {
  flex: 1;
}

.balance-label {
  font-size: 12px;
  color: #999;
  margin-right: 8px;
}

.balance-value {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
}

.invest-btn {
  width: 140px;
}
</style>
