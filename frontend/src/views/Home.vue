<template>
  <div class="home-page">
    <div class="header">
      <div class="user-info">
        <div class="avatar">👤</div>
        <div>
          <h3>{{ userInfo.merchantName }}</h3>
          <p>{{ userInfo.phone }}</p>
        </div>
      </div>
    </div>

    <div class="credit-card">
      <div class="credit-header">
        <span class="label">授信额度</span>
        <span class="status" :class="userInfo.creditStatus">{{ statusText }}</span>
      </div>
      <div class="credit-amount">
        <span class="symbol">¥</span>
        <span class="number">{{ userInfo.availableLimit || 0 }}</span>
      </div>
      <div class="credit-footer">
        <span>总额度：¥{{ userInfo.creditLimit || 0 }}</span>
      </div>
    </div>

    <div class="menu-grid">
      <div class="menu-item" @click="goTo('/commission')">
        <div class="icon">💰</div>
        <span>我的佣金</span>
      </div>
      <div class="menu-item" @click="goTo('/credit')">
        <div class="icon">📋</div>
        <span>授信申请</span>
      </div>
      <div class="menu-item" @click="goTo('/bank')">
        <div class="icon">💳</div>
        <span>账户绑定</span>
      </div>
      <div class="menu-item" @click="goToAdvance">
        <div class="icon">🚀</div>
        <span>申请垫付</span>
      </div>
    </div>

    <div class="quick-stats">
      <div class="stat-item">
        <div class="stat-value">¥{{ pendingCommission }}</div>
        <div class="stat-label">待结佣金</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">¥{{ advancedAmount }}</div>
        <div class="stat-label">已垫付</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, getCommissionOverview } from '../api'

const router = useRouter()
const userInfo = ref({})
const pendingCommission = ref(0)
const advancedAmount = ref(0)

const statusText = computed(() => {
  const map = { none: '未申请', processing: '审核中', approved: '已通过' }
  return map[userInfo.value.creditStatus] || '未申请'
})

const loadData = async () => {
  try {
    const userRes = await getUserInfo()
    userInfo.value = userRes.user
  } catch (e) {
    console.error('用户信息加载失败', e)
  }
  
  try {
    const commRes = await getCommissionOverview()
    pendingCommission.value = commRes.data.pendingCommission
    advancedAmount.value = commRes.data.advancedAmount
  } catch (e) {
    console.error('佣金数据加载失败', e)
  }
}

onMounted(() => {
  loadData()
})

const goTo = (path) => router.push(path)
const goToAdvance = () => router.push('/advance/1')
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding-bottom: 30px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 50px 20px 80px;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

h3 {
  font-size: 18px;
  margin-bottom: 4px;
}

.header p {
  opacity: 0.8;
  font-size: 14px;
}

.credit-card {
  margin: -50px 20px 20px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.credit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.label {
  color: #646566;
  font-size: 14px;
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.status.processing {
  background: #e6a23c;
  color: white;
}

.status.approved {
  background: #67c23a;
  color: white;
}

.status.none {
  background: #909399;
  color: white;
}

.credit-amount {
  margin-bottom: 12px;
}

.symbol {
  font-size: 18px;
  color: #323233;
}

.number {
  font-size: 36px;
  font-weight: bold;
  color: #323233;
}

.credit-footer {
  color: #969799;
  font-size: 14px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 0 20px;
  margin-bottom: 20px;
}

.menu-item {
  background: white;
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
}

.menu-item .icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.menu-item span {
  font-size: 12px;
  color: #323233;
}

.quick-stats {
  display: flex;
  background: white;
  margin: 0 20px;
  border-radius: 12px;
  padding: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.stat-divider {
  width: 1px;
  background: #ebedf0;
}
</style>
