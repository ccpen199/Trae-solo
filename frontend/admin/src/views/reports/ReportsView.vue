<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/utils/api'

const loading = ref(false)
const activeTab = ref('sales')

const dateRange = ref<[string, string]>([
  new Date().toISOString().split('T')[0],
  new Date().toISOString().split('T')[0],
])

const salesData = ref({
  totalRevenue: 0,
  totalOrders: 0,
  avgOrderValue: 0,
  totalCustomers: 0,
  dailySales: [] as any[],
  paymentBreakdown: [] as any[],
  categorySales: [] as any[],
})

const tabOptions = [
  { label: '销售报表', value: 'sales' },
  { label: '订单统计', value: 'orders' },
  { label: '客流分析', value: 'traffic' },
]

const fetchReports = async () => {
  loading.value = true
  try {
    const [summary, daily, payment, category] = await Promise.all([
      request.get('/reports/sales/summary', {
        params: { dateFrom: dateRange.value[0], dateTo: dateRange.value[1] },
      }),
      request.get('/reports/sales/daily', {
        params: { dateFrom: dateRange.value[0], dateTo: dateRange.value[1] },
      }),
      request.get('/reports/sales/payment', {
        params: { dateFrom: dateRange.value[0], dateTo: dateRange.value[1] },
      }),
      request.get('/reports/sales/category', {
        params: { dateFrom: dateRange.value[0], dateTo: dateRange.value[1] },
      }),
    ])

    salesData.value = {
      totalRevenue: summary.totalRevenue || 0,
      totalOrders: summary.totalOrders || 0,
      avgOrderValue: summary.avgOrderValue || 0,
      totalCustomers: summary.totalCustomers || 0,
      dailySales: daily || [],
      paymentBreakdown: payment || [],
      categorySales: category || [],
    }
  } catch (error) {
    ElMessage.error('加载报表数据失败')
    salesData.value = {
      totalRevenue: 12580.5,
      totalOrders: 156,
      avgOrderValue: 80.64,
      totalCustomers: 132,
      dailySales: [
        { date: '2024-01-01', revenue: 2500, orders: 30 },
        { date: '2024-01-02', revenue: 3200, orders: 38 },
        { date: '2024-01-03', revenue: 2800, orders: 35 },
        { date: '2024-01-04', revenue: 4080.5, orders: 53 },
      ],
      paymentBreakdown: [
        { method: 'wechat', amount: 4500, percentage: 35.8 },
        { method: 'alipay', amount: 3800, percentage: 30.2 },
        { method: 'cash', amount: 2200, percentage: 17.5 },
        { method: 'member', amount: 1500, percentage: 11.9 },
        { method: 'card', amount: 580.5, percentage: 4.6 },
      ],
      categorySales: [
        { category: '热菜', amount: 4800, orders: 85 },
        { category: '凉菜', amount: 1800, orders: 45 },
        { category: '主食', amount: 1200, orders: 60 },
        { category: '饮品', amount: 2500, orders: 95 },
        { category: '甜品', amount: 2280.5, orders: 50 },
      ],
    }
  } finally {
    loading.value = false
  }
}

const paymentMethodLabels: Record<string, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '银行卡',
  member: '会员余额',
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
}

onMounted(() => {
  fetchReports()
})
</script>

<template>
  <div class="reports-page">
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <span class="card-title">报表中心</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="margin-right: 12px"
            />
            <el-button type="primary" size="small" @click="fetchReports">
              <el-icon><Refresh /></el-icon>
              查询
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="tab in tabOptions"
          :key="tab.value"
          :label="tab.label"
          :name="tab.value"
        />
      </el-tabs>
    </el-card>

    <el-card class="stats-card" v-loading="loading">
      <template #header>
        <span class="card-title">数据概览</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon revenue">
              <el-icon :size="24"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <span class="stat-label">营业收入</span>
              <span class="stat-value">¥{{ salesData.totalRevenue.toFixed(2) }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon orders">
              <el-icon :size="24"><List /></el-icon>
            </div>
            <div class="stat-content">
              <span class="stat-label">订单总数</span>
              <span class="stat-value">{{ salesData.totalOrders }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon avg">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <span class="stat-label">客单价</span>
              <span class="stat-value">¥{{ salesData.avgOrderValue.toFixed(2) }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon customers">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div class="stat-content">
              <span class="stat-label">客流人数</span>
              <span class="stat-value">{{ salesData.totalCustomers }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="chart-card" v-loading="loading">
          <template #header>
            <span class="card-title">每日销售趋势</span>
          </template>
          <div class="chart-placeholder">
            <el-table :data="salesData.dailySales" size="small" stripe>
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="revenue" label="营业收入">
                <template #default="{ row }">
                  <span class="revenue">¥{{ row.revenue.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="orders" label="订单数" width="100" />
              <el-table-column prop="avgOrderValue" label="客单价">
                <template #default="{ row }">
                  ¥{{ (row.revenue / row.orders).toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="chart-card" v-loading="loading">
          <template #header>
            <span class="card-title">支付方式分布</span>
          </template>
          <div class="chart-placeholder">
            <div
              v-for="item in salesData.paymentBreakdown"
              :key="item.method"
              class="payment-item"
            >
              <div class="payment-header">
                <span class="payment-label">{{ paymentMethodLabels[item.method] || item.method }}</span>
                <span class="payment-amount">¥{{ item.amount.toFixed(2) }}</span>
              </div>
              <el-progress :percentage="item.percentage" :stroke-width="8" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card mt-20" v-loading="loading">
      <template #header>
        <span class="card-title">品类销售排行</span>
      </template>
      <el-table :data="salesData.categorySales" stripe>
        <el-table-column prop="category" label="品类" width="150">
          <template #default="{ row, $index }">
            <div class="rank-row">
              <el-tag
                v-if="$index < 3"
                :type="$index === 0 ? 'warning' : $index === 1 ? 'info' : ''"
                size="small"
              >
                {{ $index + 1 }}
              </el-tag>
              <span v-else class="rank-number">{{ $index + 1 }}</span>
              <span class="category-name">{{ row.category }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="销售金额">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orders" label="订单数" width="120" />
        <el-table-column prop="percentage" label="占比" width="120">
          <template #default="{ row }">
            {{ ((row.amount / salesData.totalRevenue) * 100).toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column label="进度条" min-width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="((row.amount / salesData.totalRevenue) * 100)"
              :stroke-width="12"
              :show-text="false"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card,
.stats-card,
.chart-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.mt-20 {
  margin-top: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.revenue {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &.orders {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #fff;
  }

  &.avg {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
  }

  &.customers {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    color: #fff;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.chart-placeholder {
  min-height: 200px;
}

.payment-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.payment-label {
  font-size: 14px;
  color: #606266;
}

.payment-amount {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank-number {
  width: 24px;
  text-align: center;
  font-size: 14px;
  color: #909399;
}

.category-name {
  font-size: 14px;
  color: #303133;
}

.revenue,
.amount {
  font-weight: 600;
  color: #f56c6c;
}
</style>
