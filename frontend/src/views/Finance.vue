<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const loading = ref(false)
const error = ref(null)
const allocations = ref([])
const budgets = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const activeTab = ref('allocations')
const groupBy = ref('project')
const warningOnly = ref(false)
const period = ref('2026-05')
const exportData = ref(null)

let deptChart = null

const groupOptions = [
  { value: 'project', label: '按项目' },
  { value: 'department', label: '按部门' },
  { value: 'product_line', label: '按产品线' }
]

const statusMap = {
  normal: { label: '正常', class: 'tag-success' },
  warning: { label: '预警', class: 'tag-warning' },
  over: { label: '超支', class: 'tag-error' }
}

const formatCurrency = (value) => {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(2)}万`
  }
  return `¥${Number(value || 0).toLocaleString()}`
}

const fetchAllocations = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      group_by: groupBy.value,
      period: period.value
    }
    const data = await request.get('/finance/allocations', { params })
    allocations.value = data.list
    total.value = data.total
    await nextTick()
    initDeptChart()
  } catch (err) {
    error.value = err.message || '加载数据失败'
    console.error('获取费用分摊失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchBudgets = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      period: period.value,
      warning_only: warningOnly.value ? 1 : 0
    }
    const data = await request.get('/finance/budgets', { params })
    budgets.value = data.list
    total.value = data.total
  } catch (err) {
    error.value = err.message || '加载数据失败'
    console.error('获取预算对比失败:', err)
  } finally {
    loading.value = false
  }
}

const initDeptChart = () => {
  const deptEl = document.getElementById('dept-chart')
  if (!deptEl || !allocations.value.length) return

  if (deptChart) {
    deptChart.dispose()
  }

  deptChart = echarts.init(deptEl)
  const deptData = {}
  allocations.value.forEach(item => {
    const dept = item.department || '未分配'
    if (!deptData[dept]) {
      deptData[dept] = {
        compute: 0,
        storage: 0,
        network: 0,
        database: 0,
        other: 0
      }
    }
    deptData[dept].compute += item.compute_cost || 0
    deptData[dept].storage += item.storage_cost || 0
    deptData[dept].network += item.network_cost || 0
    deptData[dept].database += item.database_cost || 0
    deptData[dept].other += item.other_cost || 0
  })

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#f1f5f9' }
    },
    legend: {
      textStyle: { color: '#94a3b8' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Object.keys(deptData),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: (value) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value
      }
    },
    series: [
      { name: '计算费用', type: 'bar', stack: 'total', data: Object.values(deptData).map(d => d.compute), itemStyle: { color: '#1890ff' } },
      { name: '存储费用', type: 'bar', stack: 'total', data: Object.values(deptData).map(d => d.storage), itemStyle: { color: '#52c41a' } },
      { name: '网络费用', type: 'bar', stack: 'total', data: Object.values(deptData).map(d => d.network), itemStyle: { color: '#faad14' } },
      { name: '数据库费用', type: 'bar', stack: 'total', data: Object.values(deptData).map(d => d.database), itemStyle: { color: '#722ed1' } },
      { name: '其他费用', type: 'bar', stack: 'total', data: Object.values(deptData).map(d => d.other), itemStyle: { color: '#13c2c2' } }
    ]
  }
  deptChart.setOption(option)
}

const handleTabChange = (tab) => {
  activeTab.value = tab
  page.value = 1
  if (tab === 'allocations') {
    fetchAllocations()
  } else {
    fetchBudgets()
  }
}

const handleGroupChange = (value) => {
  groupBy.value = value
  page.value = 1
  fetchAllocations()
}

const handlePageChange = (newPage) => {
  page.value = newPage
  if (activeTab.value === 'allocations') {
    fetchAllocations()
  } else {
    fetchBudgets()
  }
}

const handleWarningToggle = () => {
  warningOnly.value = !warningOnly.value
  page.value = 1
  fetchBudgets()
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const budgetSummary = computed(() => {
  if (!budgets.value.length) return null
  const sum = budgets.value.reduce((acc, item) => ({
    budget_amount: acc.budget_amount + (item.budget_amount || 0),
    actual_cost: acc.actual_cost + (item.actual_cost || 0)
  }), { budget_amount: 0, actual_cost: 0 })
  return {
    ...sum,
    usage_rate: sum.budget_amount > 0 ? (sum.actual_cost / sum.budget_amount * 100).toFixed(2) : 0,
    remaining: Math.max(0, sum.budget_amount - sum.actual_cost)
  }
})

const handleExport = async () => {
  try {
    exportData.value = await request.get('/finance/allocations/export', {
      params: { period: period.value }
    })

    const blob = new Blob(['\ufeff' + exportData.value.csv_content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `费用分摊报表_${period.value}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    alert('导出成功')
  } catch (err) {
    console.error('导出失败:', err)
    alert('导出失败: ' + err.message)
  }
}

const handleResize = () => {
  deptChart?.resize()
}

onMounted(() => {
  fetchAllocations()
  window.addEventListener('resize', handleResize)
})
</script>

<template>
  <div class="finance-page">
    <div v-if="activeTab === 'allocations' && budgetSummary" class="grid grid-cols-4 gap-4 mb-4">
      <div class="stat-card">
        <div class="stat-label">总预算</div>
        <div class="stat-value text-primary">{{ formatCurrency(budgetSummary.budget_amount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">实际支出</div>
        <div class="stat-value" :class="budgetSummary.usage_rate >= 100 ? 'text-error' : 'text-success'">
          {{ formatCurrency(budgetSummary.actual_cost) }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">预算使用率</div>
        <div class="stat-value" :class="budgetSummary.usage_rate >= 100 ? 'text-error' : budgetSummary.usage_rate >= 80 ? 'text-warning' : 'text-success'">
          {{ budgetSummary.usage_rate }}%
        </div>
        <div class="progress-bar mt-2">
          <div
            class="progress-bar-fill"
            :class="{ warning: budgetSummary.usage_rate >= 80, danger: budgetSummary.usage_rate >= 100 }"
            :style="{ width: Math.min(budgetSummary.usage_rate, 100) + '%' }"
          ></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">剩余预算</div>
        <div class="stat-value" :class="budgetSummary.remaining <= 0 ? 'text-error' : 'text-success'">
          {{ formatCurrency(budgetSummary.remaining) }}
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">💰 财务报表</h3>
        <div class="flex items-center gap-3">
          <input
            v-model="period"
            type="month"
            class="input"
            style="width: 150px;"
          />
          <button
            v-if="activeTab === 'budgets'"
            class="btn"
            :class="{ 'btn-warning': warningOnly }"
            @click="handleWarningToggle"
          >
            {{ warningOnly ? '⚠️ 仅显示预警' : '📊 全部显示' }}
          </button>
          <button class="btn btn-success" @click="handleExport">
            📥 导出报表
          </button>
        </div>
      </div>

      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'allocations' }"
          @click="handleTabChange('allocations')"
        >
          📊 费用分摊
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'budgets' }"
          @click="handleTabChange('budgets')"
        >
          📈 预算对比
        </button>
      </div>

      <div v-if="activeTab === 'allocations'" class="flex gap-3 mb-4">
        <label class="form-label" style="margin: 0; line-height: 38px;">聚合方式:</label>
        <select v-model="groupBy" class="select" style="width: 150px;" @change="handleGroupChange(groupBy)">
          <option v-for="opt in groupOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="activeTab === 'allocations'" class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">📊 部门费用构成</h3>
      </div>
      <div id="dept-chart" style="height: 300px;"></div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span class="ml-2">加载中...</span>
      </div>

      <div v-else-if="error" class="error">
        <span>⚠️</span>
        <span>{{ error }}</span>
        <button class="btn btn-primary btn-sm mt-2" @click="activeTab === 'allocations' ? fetchAllocations() : fetchBudgets()">重试</button>
      </div>

      <template v-else>
        <template v-if="activeTab === 'allocations'">
          <div v-if="allocations.length === 0" class="empty">
            <span>📊</span>
            <span>暂无费用分摊数据</span>
          </div>
          <div v-else>
            <div class="mb-3 text-sm text-secondary">共 {{ total }} 条记录</div>
            <div class="table-container overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th v-if="groupBy === 'project'">项目</th>
                    <th v-if="groupBy === 'project'">项目编码</th>
                    <th v-if="groupBy === 'project'">负责人</th>
                    <th v-if="groupBy === 'department' || groupBy === 'product_line'">部门</th>
                    <th v-if="groupBy === 'product_line'">产品线</th>
                    <th v-if="groupBy !== 'project'">项目数</th>
                    <th>总费用</th>
                    <th>计算费用</th>
                    <th>存储费用</th>
                    <th>网络费用</th>
                    <th>数据库费用</th>
                    <th>其他费用</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in allocations" :key="index">
                    <td v-if="groupBy === 'project'" class="font-medium">{{ item.project_name }}</td>
                    <td v-if="groupBy === 'project'" class="font-mono text-sm">{{ item.project_code }}</td>
                    <td v-if="groupBy === 'project'">{{ item.owner || '-' }}</td>
                    <td v-if="groupBy === 'department' || groupBy === 'product_line'">{{ item.department || '-' }}</td>
                    <td v-if="groupBy === 'product_line'">{{ item.product_line || '-' }}</td>
                    <td v-if="groupBy !== 'project'">{{ item.project_count }}</td>
                    <td class="font-semibold text-primary">{{ formatCurrency(item.total_cost) }}</td>
                    <td>{{ formatCurrency(item.compute_cost) }}</td>
                    <td>{{ formatCurrency(item.storage_cost) }}</td>
                    <td>{{ formatCurrency(item.network_cost) }}</td>
                    <td>{{ formatCurrency(item.database_cost) }}</td>
                    <td>{{ formatCurrency(item.other_cost) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template v-else>
          <div v-if="budgets.length === 0" class="empty">
            <span>📈</span>
            <span>暂无预算数据</span>
          </div>
          <div v-else>
            <div class="mb-3 flex justify-between items-center">
              <span class="text-sm text-secondary">共 {{ total }} 条记录</span>
              <div class="flex gap-2">
                <span class="tag tag-success">正常</span>
                <span class="tag tag-warning">预警</span>
                <span class="tag tag-error">超支</span>
              </div>
            </div>
            <div class="table-container overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>项目编码</th>
                    <th>部门</th>
                    <th>产品线</th>
                    <th>负责人</th>
                    <th>预算金额</th>
                    <th>实际支出</th>
                    <th>使用率</th>
                    <th>剩余预算</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in budgets" :key="index">
                    <td class="font-medium">{{ item.project_name }}</td>
                    <td class="font-mono text-sm">{{ item.project_code }}</td>
                    <td>{{ item.department || '-' }}</td>
                    <td>{{ item.product_line || '-' }}</td>
                    <td>{{ item.owner || '-' }}</td>
                    <td>{{ formatCurrency(item.budget_amount) }}</td>
                    <td class="font-semibold" :class="item.usage_rate >= 100 ? 'text-error' : 'text-primary'">
                      {{ formatCurrency(item.actual_cost) }}
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="progress-bar" style="width: 100px; height: 6px;">
                          <div
                            class="progress-bar-fill"
                            :class="{ warning: item.status === 'warning', danger: item.status === 'over' }"
                            :style="{ width: Math.min(item.usage_rate, 100) + '%' }"
                          ></div>
                        </div>
                        <span class="text-sm">{{ item.usage_rate }}%</span>
                      </div>
                    </td>
                    <td :class="item.remaining_budget <= 0 ? 'text-error' : 'text-success'">
                      {{ formatCurrency(item.remaining_budget) }}
                    </td>
                    <td>
                      <span class="tag" :class="statusMap[item.status]?.class">
                        {{ statusMap[item.status]?.label }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <div class="pagination">
          <button
            class="pagination-btn"
            :disabled="page <= 1"
            @click="handlePageChange(page - 1)"
          >
            上一页
          </button>
          <button
            v-for="p in Math.min(5, totalPages)"
            :key="p"
            class="pagination-btn"
            :class="{ active: page === p }"
            @click="handlePageChange(p)"
          >
            {{ p }}
          </button>
          <span v-if="totalPages > 5" class="text-secondary">...</span>
          <button
            class="pagination-btn"
            :disabled="page >= totalPages"
            @click="handlePageChange(page + 1)"
          >
            下一页
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.finance-page {
  min-height: 100%;
}

.overflow-x-auto {
  overflow-x: auto;
}

.font-mono {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>
