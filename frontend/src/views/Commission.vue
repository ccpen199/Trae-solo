<template>
  <div class="commission-page">
    <van-nav-bar title="我的佣金" left-arrow @click-left="$router.back()" />

    <div class="summary-card">
      <div class="summary-item">
        <div class="label">待结佣金</div>
        <div class="value">¥{{ overview.pendingCommission || 0 }}</div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <div class="label">已垫付金额</div>
        <div class="value">¥{{ overview.advancedAmount || 0 }}</div>
      </div>
    </div>

    <div class="section-title">佣金批次</div>

    <div class="batch-list">
      <div v-for="batch in overview.batches" :key="batch.id" class="batch-card">
        <div class="batch-header">
          <span class="batch-no">{{ batch.batchNo }}</span>
          <span class="batch-status" :class="batch.status">{{ getStatusText(batch.status) }}</span>
        </div>
        <div class="batch-info">
          <div class="info-item">
            <span class="label">佣金总额</span>
            <span class="amount">¥{{ batch.totalAmount }}</span>
          </div>
          <div class="info-item">
            <span class="label">已垫付</span>
            <span class="amount">¥{{ batch.advancedAmount }}</span>
          </div>
          <div class="info-item">
            <span class="label">可垫付</span>
            <span class="amount highlight">¥{{ batch.availableAmount }}</span>
          </div>
        </div>
        <div class="batch-footer">
          <span v-if="!batch.hasInvoice" class="invoice-tip">⚠️ 未开发票</span>
          <van-button
            v-if="batch.hasInvoice && batch.availableAmount > 0"
            type="primary"
            size="small"
            round
            @click="applyAdvance(batch.id)"
          >
            申请垫付
          </van-button>
          <van-button
            v-else-if="batch.hasInvoice"
            disabled
            size="small"
            round
          >
            无可垫付金额
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCommissionOverview } from '../api'

const router = useRouter()
const overview = ref({})

const loadData = async () => {
  try {
    const res = await getCommissionOverview()
    overview.value = res.data
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})

const getStatusText = (status) => {
  const map = { pending: '待结', partial: '部分垫付', completed: '已结清' }
  return map[status] || status
}

const applyAdvance = (batchId) => {
  router.push(`/advance/${batchId}`)
}
</script>

<style scoped>
.commission-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 30px;
}

.summary-card {
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-item .label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.summary-item .value {
  font-size: 22px;
  font-weight: bold;
}

.summary-divider {
  width: 1px;
  background: rgba(255,255,255,0.3);
}

.section-title {
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.batch-card {
  background: white;
  margin: 0 16px 12px;
  border-radius: 12px;
  padding: 16px;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebedf0;
}

.batch-no {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.batch-status {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.batch-status.pending {
  background: #e6a23c;
  color: white;
}

.batch-status.partial {
  background: #1989fa;
  color: white;
}

.batch-status.completed {
  background: #67c23a;
  color: white;
}

.batch-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #646566;
  font-size: 14px;
}

.info-item .amount {
  color: #323233;
  font-size: 14px;
}

.info-item .amount.highlight {
  color: #667eea;
  font-weight: 500;
}

.batch-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.invoice-tip {
  font-size: 12px;
  color: #e6a23c;
}
</style>
