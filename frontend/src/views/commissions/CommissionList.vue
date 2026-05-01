<template>
  <div class="commissions-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="stat-card">
          <el-row :gutter="40">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">可提现余额</div>
                <div class="stat-value primary">{{ formatAmount(stats.availableBalance) }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">冻结中</div>
                <div class="stat-value warning">{{ formatAmount(stats.frozenBalance) }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">累计收益</div>
                <div class="stat-value success">{{ formatAmount(stats.totalEarnings) }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">累计提现</div>
                <div class="stat-value">{{ formatAmount(stats.totalWithdrawn) }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>佣金明细</span>
          <div class="header-actions">
            <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px; margin-right: 12px">
              <el-option label="冻结中" value="FROZEN" />
              <el-option label="待结算" value="PENDING_SETTLEMENT" />
              <el-option label="已结算" value="SETTLED" />
              <el-option label="已取消" value="CANCELLED" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 12px; width: 240px"
            />
            <el-button type="primary" @click="fetchCommissions">查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="commissions" style="width: 100%">
        <el-table-column prop="commissionNo" label="佣金单号" width="200" />
        <el-table-column prop="order.orderNo" label="关联订单" width="200">
          <template #default="{ row }">
            {{ row.order?.orderNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="distributionLevel" label="层级" width="80">
          <template #default="{ row }">
            <span>{{ row.distributionLevel }}级</span>
          </template>
        </el-table-column>
        <el-table-column prop="frozenAmount" label="冻结金额" width="120">
          <template #default="{ row }">
            ¥{{ (row.frozenAmount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实际发放" width="120">
          <template #default="{ row }">
            <span v-if="row.actualAmount !== null" class="amount">¥{{ (row.actualAmount / 100).toFixed(2) }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="frozenAt" label="冻结时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.frozenAt) }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchCommissions"
        @current-change="fetchCommissions"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const stats = ref({
  availableBalance: 0,
  frozenBalance: 0,
  totalEarnings: 0,
  totalWithdrawn: 0,
})

const statusFilter = ref<string>('')
const dateRange = ref<Date[]>([])
const commissions = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

function formatAmount(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`
}

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    FROZEN: 'warning',
    PENDING_SETTLEMENT: 'info',
    SETTLED: 'success',
    CANCELLED: 'danger',
    DEDUCTED: 'danger',
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    FROZEN: '冻结中',
    PENDING_SETTLEMENT: '待结算',
    SETTLED: '已结算',
    CANCELLED: '已取消',
    DEDUCTED: '已扣除',
  }
  return map[status] || status
}

async function fetchStats() {
  try {
    const result = await api.get('/commissions/stats')
    if (result.success) {
      stats.value = result.data
    }
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
}

async function fetchCommissions() {
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].toISOString()
      params.endDate = dateRange.value[1].toISOString()
    }
    const result = await api.get('/commissions', { params })
    if (result.success) {
      commissions.value = result.data || []
      total.value = result.total || 0
    }
  } catch (e) {
    console.error('获取佣金列表失败', e)
  }
}

onMounted(() => {
  fetchStats()
  fetchCommissions()
})
</script>

<style scoped>
.commissions-container {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.success {
  color: #67c23a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.amount {
  color: #67c23a;
  font-weight: 600;
}

.text-gray {
  color: #c0c4cc;
}
</style>
