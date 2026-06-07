<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1>仪表盘</h1>
      <p>实时监控平台数据，掌握全局运营状况</p>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <el-col :xs="12" :sm="6" v-for="stat in stats" :key="stat.label">
        <div :class="['stat-card', stat.type]">
          <div class="stat-icon" :style="{ background: stat.gradient }">
            <el-icon :size="24" color="#fff"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
              <el-icon><ArrowUp v-if="stat.trend > 0" /><ArrowDown v-else /></el-icon>
              {{ Math.abs(stat.trend) }}% 较上周
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :lg="16" :md="24">
        <div class="card chart-card">
          <div class="card-header">
            <h3>品牌评分分布</h3>
            <el-radio-group v-model="chartType" size="small" @change="updateChart">
              <el-radio-button label="line">折线图</el-radio-button>
              <el-radio-button label="bar">柱状图</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="scoreChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :lg="8" :md="24">
        <div class="card chart-card">
          <div class="card-header">
            <h3>行业分布</h3>
          </div>
          <div ref="industryChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :lg="12" :md="24">
        <div class="card">
          <div class="card-header">
            <h3>最近品牌</h3>
            <el-button type="primary" link @click="goToBrands">查看全部</el-button>
          </div>
          <el-table :data="recentBrands" v-loading="loading">
            <el-table-column prop="logo" label="Logo" width="60">
              <template #default="{ row }">
                <img :src="row.logo" :alt="row.name" class="table-logo" @error="handleLogoError" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="品牌名称" />
            <el-table-column prop="industry" label="行业" width="120" />
            <el-table-column prop="level" label="等级" width="80">
              <template #default="{ row }">
                <el-tag :type="getLevelType(row.level)" size="small">{{ row.level }}级</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="score" label="评分" width="100">
              <template #default="{ row }">
                <span class="score-text">{{ row.score?.toFixed(1) || '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :lg="12" :md="24">
        <div class="card">
          <div class="card-header">
            <h3>最近知识</h3>
            <el-button type="primary" link @click="goToKnowledge">查看全部</el-button>
          </div>
          <el-table :data="recentKnowledge" v-loading="loading">
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="viewCount" label="浏览" width="80" align="center" />
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="card">
      <div class="card-header">
        <h3>系统活动</h3>
      </div>
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in activities"
          :key="index"
          :timestamp="activity.time"
          :type="activity.type"
          :icon="activity.icon"
          size="large"
        >
          <h4>{{ activity.title }}</h4>
          <p>{{ activity.description }}</p>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import {
  Shop, Document, Bell, User, ArrowUp, ArrowDown, DataLine,
  Wallet, Warning, CircleCheck, ChatDotRound
} from '@element-plus/icons-vue'
import { adminAPI, brandAPI, knowledgeAPI } from '@/utils/api'

const router = useRouter()
const loading = ref(false)
const chartType = ref('line')
const scoreChartRef = ref(null)
const industryChartRef = ref(null)

let scoreChart = null
let industryChart = null

const stats = ref([
  { label: '品牌总数', value: 0, type: 'primary', icon: Shop, gradient: 'linear-gradient(135deg, #409eff, #1890ff)', trend: 12 },
  { label: '知识条目', value: 0, type: 'success', icon: Document, gradient: 'linear-gradient(135deg, #67c23a, #2f9e44)', trend: 8 },
  { label: '待处理预警', value: 0, type: 'warning', icon: Bell, gradient: 'linear-gradient(135deg, #e6a23c, #f56c6c)', trend: -5 },
  { label: '用户总数', value: 0, type: 'danger', icon: User, gradient: 'linear-gradient(135deg, #f56c6c, #c45656)', trend: 15 }
])

const recentBrands = ref([])
const recentKnowledge = ref([])
const activities = ref([])

async function loadDashboard() {
  loading.value = true
  try {
    const [dashboardRes, brandsRes, knowledgeRes] = await Promise.all([
      adminAPI.getDashboard(),
      brandAPI.getList({ page: 1, pageSize: 5, sortBy: 'createdAt' }),
      knowledgeAPI.getList({ page: 1, pageSize: 5, sortBy: 'createdAt' })
    ])

    const data = dashboardRes.data || {}
    stats.value[0].value = data.brandCount || 0
    stats.value[1].value = data.knowledgeCount || 0
    stats.value[2].value = data.alertCount || 0
    stats.value[3].value = data.userCount || 0

    recentBrands.value = brandsRes.data?.data || []
    recentKnowledge.value = knowledgeRes.data?.data || []

    activities.value = [
      {
        title: '数据采集完成',
        description: `成功采集 ${data.collectedToday || 0} 条品牌数据`,
        time: formatDate(new Date()),
        type: 'success',
        icon: CircleCheck
      },
      {
        title: '榜单计算完成',
        description: '本月度品牌竞争力榜单已生成',
        time: formatDate(Date.now() - 86400000),
        type: 'primary',
        icon: DataLine
      },
      {
        title: '新用户注册',
        description: '新增用户 5 人，其中专家用户 2 人',
        time: formatDate(Date.now() - 172800000),
        type: 'success',
        icon: User
      },
      {
        title: '政策变动预警',
        description: '检测到相关行业政策更新，需要修订知识库',
        time: formatDate(Date.now() - 259200000),
        type: 'warning',
        icon: Warning
      },
      {
        title: '专家评审完成',
        description: '3 份榜单通过专家评审并发布',
        time: formatDate(Date.now() - 345600000),
        type: 'success',
        icon: ChatDotRound
      }
    ]

    await nextTick()
    initCharts(data)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function initCharts(data) {
  if (scoreChartRef.value) {
    scoreChart = echarts.init(scoreChartRef.value)
    updateChart()
    window.addEventListener('resize', handleResize)
  }

  if (industryChartRef.value) {
    industryChart = echarts.init(industryChartRef.value)
    const industryData = data.industryDistribution || [
      { value: 35, name: '消费电子' },
      { value: 25, name: '服装服饰' },
      { value: 20, name: '食品饮料' },
      { value: 12, name: '美妆护肤' },
      { value: 8, name: '其他' }
    ]

    industryChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: industryData
      }]
    })
  }
}

function updateChart() {
  if (!scoreChart) return

  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  const sData = [85, 92, 88, 95, 90, 96]
  const aData = [72, 78, 75, 82, 80, 85]
  const bData = [60, 65, 68, 70, 72, 75]
  const cData = [45, 48, 50, 52, 55, 58]

  scoreChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['S级', 'A级', 'B级', 'C级'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: chartType.value === 'bar', data: months },
    yAxis: { type: 'value', max: 100 },
    color: ['#fcc200', '#67c23a', '#409eff', '#909399'],
    series: [
      { name: 'S级', type: chartType.value, data: sData, smooth: true, areaStyle: chartType.value === 'line' ? { opacity: 0.1 } : undefined },
      { name: 'A级', type: chartType.value, data: aData, smooth: true, areaStyle: chartType.value === 'line' ? { opacity: 0.1 } : undefined },
      { name: 'B级', type: chartType.value, data: bData, smooth: true, areaStyle: chartType.value === 'line' ? { opacity: 0.1 } : undefined },
      { name: 'C级', type: chartType.value, data: cData, smooth: true, areaStyle: chartType.value === 'line' ? { opacity: 0.1 } : undefined }
    ]
  })
}

function handleResize() {
  scoreChart?.resize()
  industryChart?.resize()
}

function getLevelType(level) {
  const types = { S: 'warning', A: 'success', B: 'primary', C: 'info' }
  return types[level] || 'info'
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

function goToBrands() {
  router.push('/admin/brands')
}

function goToKnowledge() {
  router.push('/admin/knowledge')
}

onMounted(() => {
  loadDashboard()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  scoreChart?.dispose()
  industryChart?.dispose()
})
</script>

<style scoped>
.dashboard-page {
  padding-bottom: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 8px;
}

.page-header p {
  color: #606266;
  font-size: 14px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  margin-bottom: 20px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2f3d;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

.chart-row {
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0;
}

.chart-card {
  height: 100%;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.table-logo {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  background: #f0f2f5;
}

.score-text {
  font-weight: 600;
  color: #409eff;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
}

:deep(.el-timeline-item__content h4) {
  font-size: 15px;
  color: #303133;
  margin-bottom: 4px;
}

:deep(.el-timeline-item__content p) {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

:deep(.el-timeline-item__icon) {
  width: 36px;
  height: 36px;
  font-size: 16px;
}
</style>
