<template>
  <div class="reports">
    <el-row :gutter="24">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>财税合规报表</span>
              <el-select 
                v-model="reportPeriod" 
                style="width: 150px" 
                @change="loadReport"
              >
                <el-option
                  v-for="period in periodOptions"
                  :key="period.value"
                  :label="period.label"
                  :value="period.value"
                />
              </el-select>
            </div>
          </template>

          <el-row :gutter="24">
            <el-col :span="6">
              <el-statistic title="本月发票数" :value="reportData?.total_invoices || 0">
                <template #suffix>张</template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="本月开票金额" :value="reportData?.total_amount || 0" :precision="2">
                <template #prefix>¥</template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="红冲数量" :value="reportData?.red_credit_summary?.count || 0">
                <template #suffix>笔</template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="红冲金额" :value="reportData?.red_credit_summary?.total_amount || 0" :precision="2">
                <template #prefix>¥</template>
              </el-statistic>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="mt-24">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>发票状态分布</span>
            </div>
          </template>

          <el-table :data="reportData?.invoice_summary || []" v-loading="loading" style="width: 100%">
            <el-table-column prop="status_name" label="状态" width="120">
              <template #default="{ row }">
                <span :class="`status-tag status-${row.status}`">{{ row.status_name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" width="100" align="right">
              <template #default="{ row }">
                <strong>{{ row.count }} 张</strong>
              </template>
            </el-table-column>
            <el-table-column prop="total_amount" label="金额" width="150" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ formatAmount(row.total_amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="占比">
              <template #default="{ row }">
                <el-progress 
                  :percentage="calculatePercentage(row.count, reportData?.total_invoices)" 
                  :stroke-width="16"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>开票额度</span>
            </div>
          </template>

          <div class="quota-info" v-if="quotaData">
            <el-progress 
              type="dashboard"
              :percentage="parseFloat(quotaData.usage_rate)" 
              :width="180"
              :color="quotaData.status === 'critical' ? '#f56c6c' : 
                     quotaData.status === 'warning' ? '#e6a23c' : '#67c23a'"
            >
              <template #default="{ percentage }">
                <span class="percentage-value">{{ percentage }}%</span>
                <span class="percentage-label">使用率</span>
              </template>
            </el-progress>

            <div class="quota-details">
              <div class="quota-item">
                <span class="quota-label">总额度</span>
                <span class="quota-value">¥{{ formatAmount(quotaData.total) }}</span>
              </div>
              <div class="quota-item">
                <span class="quota-label">已使用</span>
                <span class="quota-value used">¥{{ formatAmount(quotaData.used) }}</span>
              </div>
              <div class="quota-item">
                <span class="quota-label">剩余</span>
                <span class="quota-value remaining">¥{{ formatAmount(quotaData.remaining) }}</span>
              </div>
            </div>

            <el-alert
              v-if="quotaData.alerts?.length > 0"
              :title="quotaData.alerts[0].message"
              :type="quotaData.alerts[0].level === 'high' ? 'error' : 'warning'"
              show-icon
              class="quota-alert"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="mt-24">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>大客户开票排行</span>
            </div>
          </template>

          <el-table :data="reportData?.top_customers || []" style="width: 100%">
            <el-table-column label="排名" width="60" align="center">
              <template #default="{ $index }">
                <el-tag v-if="$index < 3" :type="getRankTagType($index)" size="small">
                  {{ $index + 1 }}
                </el-tag>
                <span v-else>{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="customer_name" label="客户名称" />
            <el-table-column prop="invoice_count" label="开票数" width="100" align="right" />
            <el-table-column prop="total_amount" label="开票金额" width="150" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ formatAmount(row.total_amount) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>风险预警</span>
            </div>
          </template>

          <el-table :data="reportData?.risk_summary || []" style="width: 100%">
            <el-table-column prop="risk_level" label="风险等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getRiskTagType(row.risk_level)">
                  {{ row.risk_level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total" label="总数" width="80" align="right" />
            <el-table-column prop="resolved" label="已解决" width="80" align="right">
              <template #default="{ row }">
                <span class="resolved">{{ row.resolved }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unresolved" label="未解决" width="80" align="right">
              <template #default="{ row }">
                <span class="unresolved" :class="{ 'text-danger': row.unresolved > 0 }">
                  {{ row.unresolved }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="mt-24">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>报表导出</span>
              <div>
                <el-button type="primary" @click="exportReport('json')">
                  <el-icon><Download /></el-icon>
                  导出 JSON
                </el-button>
                <el-button type="success" @click="exportReport('csv')">
                  <el-icon><Download /></el-icon>
                  导出 CSV
                </el-button>
              </div>
            </div>
          </template>

          <el-alert
            title="导出说明"
            type="info"
            :closable="false"
          >
            <p>• JSON 格式：包含完整的报表数据和审计信息</p>
            <p>• CSV 格式：包含发票列表的简要信息，便于 Excel 分析</p>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const loading = ref(false)
const reportData = ref(null)
const quotaData = ref(null)
const reportPeriod = ref(new Date().toISOString().slice(0, 7))

const periodOptions = computed(() => {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = date.toISOString().slice(0, 7)
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
    options.push({ value, label })
  }
  return options
})

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const calculatePercentage = (count, total) => {
  if (!total) return 0
  return Math.round((count / total) * 100)
}

const getRankTagType = (index) => {
  const types = ['danger', 'warning', 'primary']
  return types[index] || 'info'
}

const getRiskTagType = (level) => {
  const types = {
    '高': 'danger',
    '中': 'warning',
    '低': 'info'
  }
  return types[level] || 'info'
}

const loadReport = async () => {
  loading.value = true
  try {
    const [reportRes, quotaRes] = await Promise.all([
      api.get('/reports/compliance/summary', { params: { period: reportPeriod.value } }),
      api.get('/reports/quota/status')
    ])
    reportData.value = reportRes
    quotaData.value = quotaRes.quota
  } catch (e) {
    console.error('Failed to load report:', e)
  } finally {
    loading.value = false
  }
}

const exportReport = async (format) => {
  try {
    const data = await api.get('/reports/compliance/export', {
      params: { period: reportPeriod.value, format },
      responseType: format === 'csv' ? 'blob' : 'json'
    })

    if (format === 'csv') {
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `compliance-report-${reportPeriod.value}.csv`
      link.click()
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `compliance-report-${reportPeriod.value}.json`
      link.click()
    }

    ElMessage.success('导出成功')
  } catch (e) {
    console.error('Export failed:', e)
  }
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped>
.reports {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.mt-24 {
  margin-top: 24px;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.resolved {
  color: #67c23a;
}

.unresolved {
  color: #909399;
}

.text-danger {
  color: #f56c6c !important;
}

.quota-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.percentage-value {
  display: block;
  font-size: 28px;
  font-weight: 600;
}

.percentage-label {
  display: block;
  font-size: 12px;
  color: #909399;
}

.quota-details {
  width: 100%;
  margin-top: 20px;
}

.quota-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.quota-label {
  color: #909399;
}

.quota-value {
  font-weight: 500;
  color: #333;
}

.quota-value.used {
  color: #409eff;
}

.quota-value.remaining {
  color: #67c23a;
}

.quota-alert {
  margin-top: 16px;
  width: 100%;
}
</style>
