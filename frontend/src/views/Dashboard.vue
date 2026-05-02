<template>
  <div class="dashboard">
    <el-row :gutter="24" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon invoice-icon">
              <el-icon size="28"><Ticket /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalInvoices || 0 }}</div>
              <div class="stat-label">本月发票数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon amount-icon">
              <el-icon size="28"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatAmount(stats.totalAmount) }}</div>
              <div class="stat-label">本月开票金额</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending-icon">
              <el-icon size="28"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ pendingCount }}</div>
              <div class="stat-label">待开票</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon quota-icon">
              <el-icon size="28"><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ quotaStatus?.usage_rate || '0%' }}</div>
              <div class="stat-label">额度使用率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" v-if="userStore.isInternal">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>发票状态统计</span>
            </div>
          </template>

          <div class="status-stats">
            <div 
              v-for="stat in stats.status_stats" 
              :key="stat.status"
              class="status-item"
            >
              <div class="status-item-header">
                <span :class="`status-tag status-${stat.status}`">
                  {{ stat.status_name }}
                </span>
              </div>
              <div class="status-item-body">
                <div class="status-count">{{ stat.count }} 张</div>
                <div class="status-amount">¥{{ formatAmount(stat.total_amount) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>开票额度</span>
            </div>
          </template>

          <div class="quota-info" v-if="quotaStatus">
            <el-progress 
              :percentage="parseFloat(quotaStatus.usage_rate)" 
              :color="quotaStatus.status === 'critical' ? '#f56c6c' : 
                     quotaStatus.status === 'warning' ? '#e6a23c' : '#67c23a'"
            />
            <div class="quota-details">
              <div class="quota-item">
                <span class="quota-label">总额度</span>
                <span class="quota-value">¥{{ formatAmount(quotaStatus.total) }}</span>
              </div>
              <div class="quota-item">
                <span class="quota-label">已使用</span>
                <span class="quota-value">¥{{ formatAmount(quotaStatus.used) }}</span>
              </div>
              <div class="quota-item">
                <span class="quota-label">剩余</span>
                <span class="quota-value">¥{{ formatAmount(quotaStatus.remaining) }}</span>
              </div>
            </div>

            <el-alert
              v-if="quotaStatus.alerts?.length > 0"
              :title="quotaStatus.alerts[0].message"
              :type="quotaStatus.alerts[0].level === 'high' ? 'error' : 'warning'"
              show-icon
              class="quota-alert"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="mt-24">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近操作记录</span>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.created_at"
              placement="top"
            >
              <el-card shadow="hover">
                <h4>{{ activity.action }}</h4>
                <p>
                  <el-tag size="small">{{ activity.operator_name }}</el-tag>
                  <span class="text-muted">{{ activity.operator_role }}</span>
                </p>
                <p v-if="activity.from_status || activity.to_status" class="status-flow">
                  <span v-if="activity.from_status">{{ activity.from_status }}</span>
                  <el-icon v-if="activity.from_status && activity.to_status"><ArrowRight /></el-icon>
                  <span v-if="activity.to_status" class="text-primary">{{ activity.to_status }}</span>
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <el-empty v-if="recentActivities.length === 0" description="暂无操作记录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const userStore = useUserStore()

const stats = ref({
  totalInvoices: 0,
  totalAmount: 0,
  status_stats: []
})

const pendingCount = ref(0)
const quotaStatus = ref(null)
const recentActivities = ref([])

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const loadStats = async () => {
  try {
    if (userStore.isInternal) {
      const data = await api.get('/invoices/stats/summary')
      stats.value = {
        totalInvoices: data.total_invoices,
        totalAmount: data.total_amount,
        status_stats: data.status_stats
      }
      recentActivities.value = data.recent_audits || []
    }

    const pendingData = await api.get('/invoices/pending/count')
    pendingCount.value = pendingData.count

    if (userStore.isFinance || userStore.isTax) {
      const quotaData = await api.get('/reports/quota/status')
      quotaStatus.value = quotaData.quota
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.invoice-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.amount-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.pending-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.quota-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.status-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.status-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.status-item-body {
  margin-top: 12px;
}

.status-count {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.status-amount {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.quota-details {
  margin-top: 20px;
}

.quota-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.quota-label {
  color: #909399;
}

.quota-value {
  font-weight: 500;
  color: #333;
}

.quota-alert {
  margin-top: 16px;
}

.mt-24 {
  margin-top: 24px;
}

.text-muted {
  color: #909399;
  margin-left: 8px;
}

.text-primary {
  color: #409eff;
}

.status-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}
</style>
