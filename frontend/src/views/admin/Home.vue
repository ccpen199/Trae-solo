<template>
  <div class="admin-home">
    <div class="header-bar">
      <div class="user-info">
        <div class="avatar">
          <el-icon :size="28"><UserFilled /></el-icon>
        </div>
        <div class="user-detail">
          <div class="user-name">{{ admin.name || '管理员' }}</div>
          <div class="user-id">{{ admin.role || '系统管理员' }}</div>
        </div>
      </div>
      <el-button type="danger" plain size="small" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon> 退出
      </el-button>
    </div>

    <div class="page-container">
      <div class="page-title">
        <el-icon><HomeFilled /></el-icon> 管理后台数据看板
      </div>

      <div class="grid-stats">
        <div class="stat-card">
          <div class="label">用户数</div>
          <div class="value">{{ stats.users || 0 }}</div>
        </div>
        <div class="stat-card green">
          <div class="label">企业数</div>
          <div class="value">{{ stats.enterprises || 0 }}</div>
        </div>
        <div class="stat-card orange">
          <div class="label">合同数</div>
          <div class="value">{{ stats.contracts || 0 }}</div>
        </div>
        <div class="stat-card purple">
          <div class="label">失业登记</div>
          <div class="value">{{ stats.unemployment || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="label">职称申报</div>
          <div class="value">{{ stats.titles || 0 }}</div>
        </div>
        <div class="stat-card green">
          <div class="label">工资专户数</div>
          <div class="value">{{ stats.wageAccounts || 0 }}</div>
        </div>
        <div class="stat-card orange">
          <div class="label">培训补贴</div>
          <div class="value">{{ stats.subsidies || 0 }}</div>
        </div>
        <div class="stat-card purple">
          <div class="label">舆情数</div>
          <div class="value">{{ stats.opinions || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="label">预警数</div>
          <div class="value">{{ stats.warnings || 0 }}</div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">快捷入口</div>
        <div class="service-grid">
          <div class="service-card" @click="go('/admin/cross')">
            <div class="icon"><el-icon><Connection /></el-icon></div>
            <div class="title">跨系统数据</div>
            <div class="desc">多部门数据融合</div>
          </div>
          <div class="service-card" @click="go('/admin/title')">
            <div class="icon" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #047857;">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="title">职称预审</div>
            <div class="desc">申报材料在线审核</div>
          </div>
          <div class="service-card" @click="go('/admin/subsidy')">
            <div class="icon" style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #b45309;">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="title">培训补贴审核</div>
            <div class="desc">技能补贴在线审批</div>
          </div>
          <div class="service-card" @click="go('/admin/dispute')">
            <div class="icon" style="background: linear-gradient(135deg, #ede9fe, #ddd6fe); color: #6d28d9;">
              <el-icon><ScaleToBalance /></el-icon>
            </div>
            <div class="title">劳动争议调解</div>
            <div class="desc">争议案件在线处理</div>
          </div>
          <div class="service-card" @click="go('/admin/opinion')">
            <div class="icon" style="background: linear-gradient(135deg, #fee2e2, #fecaca); color: #b91c1c;">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="title">舆情监测</div>
            <div class="desc">全网舆情实时监控</div>
          </div>
          <div class="service-card" @click="go('/admin/policy')">
            <div class="icon" style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1d4ed8;">
              <el-icon><Calculator /></el-icon>
            </div>
            <div class="title">政策计算器记录</div>
            <div class="desc">试算记录查询管理</div>
          </div>
        </div>
      </div>

      <div class="chart-row">
        <div class="card chart-card">
          <div class="section-title">舆情按平台分布</div>
          <div ref="pieChartRef" class="chart-box"></div>
        </div>
        <div class="card chart-card">
          <div class="section-title">按月申请趋势</div>
          <div ref="barChartRef" class="chart-box"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store/auth'
import api from '../../store/auth'
import * as echarts from 'echarts'

const router = useRouter()
const auth = useAuthStore()
const admin = ref({})
const stats = ref({
  users: 0,
  enterprises: 0,
  contracts: 0,
  unemployment: 0,
  titles: 0,
  wageAccounts: 0,
  subsidies: 0,
  opinions: 0,
  warnings: 0
})

const pieChartRef = ref(null)
const barChartRef = ref(null)
let pieChart = null
let barChart = null

async function loadData() {
  try {
    const res = await api.get('/admin/dashboard/stats')
    const data = res.data.data || {}
    stats.value = {
      users: data.users || 0,
      enterprises: data.enterprises || 0,
      contracts: data.contracts || 0,
      unemployment: data.unemployment || 0,
      titles: data.titles || 0,
      wageAccounts: data.wageAccounts || 0,
      subsidies: data.subsidies || 0,
      opinions: data.opinions || 0,
      warnings: data.warnings || 0
    }
    admin.value = auth.user || {}
    initPieChart(data.opinionByPlatform)
    initBarChart(data.monthlyTrend)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  }
}

function initPieChart(platformData) {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  const data = platformData && platformData.length ? platformData : [
    { value: 120, name: '微博' },
    { value: 80, name: '微信' },
    { value: 60, name: '抖音' },
    { value: 45, name: '知乎' },
    { value: 35, name: '小红书' },
    { value: 50, name: '今日头条' }
  ]
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { bottom: '0%', left: 'center', icon: 'circle', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12 } },
    color: ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
    series: [{
      name: '舆情平台分布',
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data
    }]
  })
}

function initBarChart(trendData) {
  if (!barChartRef.value) return
  barChart = echarts.init(barChartRef.value)
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  let contracts = new Array(12).fill(0)
  let titles = new Array(12).fill(0)
  let subsidies = new Array(12).fill(0)
  if (trendData && trendData.length) {
    trendData.forEach(item => {
      const idx = Number(item.month) - 1
      if (idx >= 0 && idx < 12) {
        contracts[idx] = item.contracts || 0
        titles[idx] = item.titles || 0
        subsidies[idx] = item.subsidies || 0
      }
    })
  } else {
    contracts = [120, 132, 101, 134, 90, 230, 210, 180, 150, 170, 200, 220]
    titles = [60, 72, 81, 54, 70, 110, 95, 88, 76, 85, 98, 110]
    subsidies = [40, 52, 61, 44, 50, 80, 75, 68, 56, 65, 78, 90]
  }
  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: '0%', left: 'center', icon: 'rect', itemWidth: 14, itemHeight: 8, textStyle: { fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: months, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#6b7280', fontSize: 11 } },
    series: [
      { name: '合同', type: 'bar', data: contracts, itemStyle: { color: '#1d4ed8', borderRadius: [3, 3, 0, 0] }, barWidth: 16 },
      { name: '职称', type: 'bar', data: titles, itemStyle: { color: '#10b981', borderRadius: [3, 3, 0, 0] }, barWidth: 16 },
      { name: '补贴', type: 'bar', data: subsidies, itemStyle: { color: '#f97316', borderRadius: [3, 3, 0, 0] }, barWidth: 16 }
    ]
  })
}

function handleResize() {
  pieChart?.resize()
  barChart?.resize()
}

function go(path) {
  router.push(path)
}

function handleLogout() {
  auth.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped>
.admin-home {
  min-height: 100vh;
  background: #f5f7fa;
}
.header-bar {
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%);
  padding: 24px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-name {
  font-size: 18px;
  font-weight: 600;
}
.user-id {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #1d4ed8;
}
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart-card {
  margin-bottom: 0;
}
.chart-box {
  width: 100%;
  height: 320px;
}
@media (max-width: 768px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}
</style>
