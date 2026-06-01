<template>
  <div class="page-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <el-card class="card-shadow stat-card" shadow="hover">
          <div class="flex-between">
            <div>
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-value" :class="card.color">{{ card.value }}</div>
              <div class="stat-sub">{{ card.sub }}</div>
            </div>
            <el-icon :size="48" :color="card.iconColor">
              <component :is="card.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="12">
        <el-card class="card-shadow" shadow="hover">
          <template #header>
            <div class="flex-between">
              <span class="card-title">维度进度分布</span>
              <el-tag type="info">{{ currentYear }}年</el-tag>
            </div>
          </template>
          <div ref="dimensionChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" shadow="hover">
          <template #header>
            <div class="flex-between">
              <span class="card-title">月度投入时间</span>
              <el-tag type="info">{{ currentYear }}年</el-tag>
            </div>
          </template>
          <div ref="monthlyChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow" shadow="hover">
      <template #header>
        <div class="flex-between">
          <span class="card-title">近期待办任务</span>
          <el-button type="primary" link @click="goToExecution">
            查看全部 <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>
      <el-table :data="upcomingTasks" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="任务名称" min-width="200">
          <template #default="{ row }">
            <div class="flex gap-10 items-center">
              <el-checkbox v-model="row.completed" @change="handleTaskComplete(row)" />
              <span :class="{ 'task-completed': row.completed }">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">{{ getPriorityLabel(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="截止日期" width="120" />
        <el-table-column prop="key_result_title" label="关联关键结果" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="row.key_result_title" size="small" type="info">{{ row.key_result_title }}</el-tag>
            <span v-else class="text-info">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToExecution">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && upcomingTasks.length === 0" description="暂无待办任务" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { goalApi, deviationApi, executionApi } from '@/api'

const router = useRouter()
const currentYear = ref(new Date().getFullYear())
const loading = ref(false)

const goals = ref([])
const annualReview = ref(null)
const upcomingTasks = ref([])

const dimensionChartRef = ref(null)
const monthlyChartRef = ref(null)
let dimensionChart = null
let monthlyChart = null

const statCards = computed(() => [
  {
    label: '总目标数',
    value: goals.value.length,
    sub: `${currentYear.value}年度`,
    icon: 'Target',
    color: 'text-primary',
    iconColor: '#409eff'
  },
  {
    label: '已完成目标',
    value: computed(() => goals.value.filter(g => g.progress >= 100).length).value,
    sub: '达成率 ' + (goals.value.length ? Math.round((goals.value.filter(g => g.progress >= 100).length / goals.value.length) * 100) : 0) + '%',
    icon: 'CircleCheck',
    color: 'text-success',
    iconColor: '#67c23a'
  },
  {
    label: '平均进度',
    value: (computed(() => {
      if (!goals.value.length) return '0%'
      const avg = goals.value.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.value.length
      return Math.round(avg) + '%'
    }).value),
    sub: '整体推进中',
    icon: 'DataLine',
    color: 'text-warning',
    iconColor: '#e6a23c'
  },
  {
    label: '总投入时间',
    value: (annualReview.value?.total_time || 0) + 'h',
    sub: '年度累计',
    icon: 'Clock',
    color: 'text-danger',
    iconColor: '#f56c6c'
  }
])

function getPriorityType(priority) {
  const map = { high: 'danger', medium: 'warning', low: 'success' }
  return map[priority] || 'info'
}

function getPriorityLabel(priority) {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

function getStatusType(status) {
  const map = { pending: 'info', in_progress: 'warning', completed: 'success' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { pending: '待办', in_progress: '进行中', completed: '已完成' }
  return map[status] || status
}

function getDimensionColor(dimension) {
  const map = {
    '事业': '#409eff',
    '健康': '#67c23a',
    '财务': '#e6a23c',
    '学习': '#909399',
    '关系': '#f56c6c',
    '其他': '#606266'
  }
  return map[dimension] || '#606266'
}

async function fetchData() {
  loading.value = true
  try {
    const [goalsRes, reviewRes, planRes] = await Promise.all([
      goalApi.getGoals({ year: currentYear.value }),
      deviationApi.getAnnualReview(currentYear.value),
      executionApi.getCurrentWeekPlan().catch(() => null)
    ])
    goals.value = goalsRes || []
    annualReview.value = reviewRes || null
    if (planRes?.tasks) {
      upcomingTasks.value = planRes.tasks
        .filter(t => t.status !== 'completed')
        .slice(0, 10)
    }
    await nextTick()
    initCharts()
  } catch (err) {
    ElMessage.error('数据加载失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

function initCharts() {
  initDimensionChart()
  initMonthlyChart()
}

function initDimensionChart() {
  if (!dimensionChartRef.value) return
  dimensionChart = echarts.init(dimensionChartRef.value)
  
  const dimensionData = {}
  goals.value.forEach(g => {
    if (!dimensionData[g.dimension]) {
      dimensionData[g.dimension] = { total: 0, completed: 0, progress: 0, count: 0 }
    }
    dimensionData[g.dimension].count++
    dimensionData[g.dimension].total++
    dimensionData[g.dimension].progress += g.progress || 0
    if (g.progress >= 100) dimensionData[g.dimension].completed++
  })
  
  const pieData = Object.entries(dimensionData).map(([name, data]) => ({
    name,
    value: Math.round(data.progress / data.count)
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [
      {
        name: '维度进度',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: pieData.map(item => ({
          ...item,
          itemStyle: { color: getDimensionColor(item.name) }
        }))
      }
    ]
  }
  dimensionChart.setOption(option)
}

function initMonthlyChart() {
  if (!monthlyChartRef.value) return
  monthlyChart = echarts.init(monthlyChartRef.value)
  
  const monthlyData = annualReview.value?.monthly_time || {}
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const values = months.map((_, i) => monthlyData[i + 1] || 0)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>投入时间: {c}h'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        interval: 0,
        rotate: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '小时'
    },
    series: [
      {
        name: '投入时间',
        type: 'bar',
        data: values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#409eff' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '50%'
      }
    ]
  }
  monthlyChart.setOption(option)
}

function handleResize() {
  dimensionChart?.resize()
  monthlyChart?.resize()
}

async function handleTaskComplete(row) {
  try {
    await executionApi.updateWeeklyTask(row.id, {
      status: row.completed ? 'completed' : 'pending',
      completed: row.completed
    })
    ElMessage.success(row.completed ? '已标记完成' : '已取消完成')
  } catch (err) {
    row.completed = !row.completed
    ElMessage.error('操作失败')
  }
}

function goToExecution() {
  router.push('/execution')
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  dimensionChart?.dispose()
  monthlyChart?.dispose()
})
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
}

.text-primary {
  color: #409eff;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 320px;
}

.task-completed {
  text-decoration: line-through;
  color: #c0c4cc;
}
</style>
