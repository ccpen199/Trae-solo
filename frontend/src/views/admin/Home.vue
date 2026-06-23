<template>
  <div class="admin-home">
    <div class="header-bar">
      <div class="user-info">
        <div class="avatar">
          <el-icon :size="28"><UserFilled /></el-icon>
        </div>
        <div class="user-detail">
          <div class="user-name">{{ admin.name || '管理员' }}</div>
          <div class="user-id">{{ admin.role === 'super_admin' ? '超级管理员' : (admin.role || '系统管理员') }}</div>
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

      <div class="domain-section">
        <div class="section-title">四大业务域汇总</div>
        <div class="domain-grid">
          <div class="domain-card social">
            <div class="domain-icon">🛡️</div>
            <div class="domain-info">
              <div class="domain-name">社保</div>
              <div class="domain-stat">{{ stats.social_insurance || 0 }} 项</div>
              <div class="domain-detail">合同 {{ stats.total_contracts || 0 }} · 失业登记 {{ stats.unemployment_count || 0 }}</div>
            </div>
          </div>
          <div class="domain-card employ">
            <div class="domain-icon">💼</div>
            <div class="domain-info">
              <div class="domain-name">就业</div>
              <div class="domain-stat">{{ stats.employment || 0 }} 项</div>
              <div class="domain-detail">失业登记 {{ stats.unemployment_count || 0 }} · 培训补贴 {{ stats.training_subsidies || 0 }}</div>
            </div>
          </div>
          <div class="domain-card talent">
            <div class="domain-icon">🎓</div>
            <div class="domain-info">
              <div class="domain-name">人才</div>
              <div class="domain-stat">{{ stats.talent || 0 }} 项</div>
              <div class="domain-detail">职称申报 {{ stats.title_applications || 0 }} · 待审 {{ stats.pending_title || 0 }}</div>
            </div>
          </div>
          <div class="domain-card labor">
            <div class="domain-icon">⚖️</div>
            <div class="domain-info">
              <div class="domain-name">劳动监察</div>
              <div class="domain-stat">{{ stats.labor_supervision || 0 }} 项</div>
              <div class="domain-detail">工资专户 {{ stats.wage_accounts || 0 }} · 高危预警 {{ stats.opinion_summary?.high || 0 }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-stats">
        <div class="stat-card">
          <div class="label">用户数</div>
          <div class="value">{{ stats.total_users || 0 }}</div>
        </div>
        <div class="stat-card green">
          <div class="label">企业数</div>
          <div class="value">{{ stats.total_enterprises || 0 }}</div>
        </div>
        <div class="stat-card orange">
          <div class="label">合同数</div>
          <div class="value">{{ stats.total_contracts || 0 }}</div>
        </div>
        <div class="stat-card purple">
          <div class="label">失业登记</div>
          <div class="value">{{ stats.unemployment_count || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="label">职称申报</div>
          <div class="value">{{ stats.title_applications || 0 }}</div>
        </div>
        <div class="stat-card green">
          <div class="label">工资专户数</div>
          <div class="value">{{ stats.wage_accounts || 0 }}</div>
        </div>
        <div class="stat-card orange">
          <div class="label">培训补贴</div>
          <div class="value">{{ stats.training_subsidies || 0 }}</div>
        </div>
        <div class="stat-card purple">
          <div class="label">舆情总数</div>
          <div class="value">{{ stats.opinion_count || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="label">预警数</div>
          <div class="value">{{ stats.warning_opinions || 0 }}</div>
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
          <div class="section-title">预警等级分布</div>
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
const stats = ref({})

const pieChartRef = ref(null)
const barChartRef = ref(null)
let pieChart = null
let barChart = null

async function loadData() {
  try {
    const res = await api.get('/admin/dashboard/stats')
    const data = res.data.data || {}
    stats.value = data
    admin.value = auth.user || {}
    initPieChart(data.platform_distribution)
    initBarChart(data.opinion_summary || {})
  } catch (e) {
    ElMessage.error('看板数据加载失败：' + (e.response?.data?.message || e.message || '网络错误'))
  }
}

function initPieChart(platformData) {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()
  pieChart = echarts.init(pieChartRef.value)
  const data = platformData && platformData.length ? platformData : [
    { value: 0, name: '暂无数据' }
  ]
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
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

function initBarChart(opinionSummary) {
  if (!barChartRef.value) return
  if (barChart) barChart.dispose()
  barChart = echarts.init(barChartRef.value)
  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['高等级预警', '中等级预警', '一般', '未处置'], axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#6b7280', fontSize: 11 } },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: [
        { value: opinionSummary.high || 0, itemStyle: { color: '#ef4444', borderRadius: [6, 6, 0, 0] } },
        { value: opinionSummary.medium || 0, itemStyle: { color: '#f59e0b', borderRadius: [6, 6, 0, 0] } },
        { value: opinionSummary.normal || 0, itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] } },
        { value: opinionSummary.unhandled || 0, itemStyle: { color: '#6b7280', borderRadius: [6, 6, 0, 0] } }
      ],
      label: { show: true, position: 'top', fontSize: 12, color: '#1f2937', fontWeight: 600 }
    }]
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
.domain-section {
  margin-bottom: 20px;
}
.domain-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.domain-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border-left: 4px solid;
}
.domain-card.social { border-left-color: #1d4ed8; }
.domain-card.employ { border-left-color: #059669; }
.domain-card.talent { border-left-color: #7c3aed; }
.domain-card.labor { border-left-color: #dc2626; }
.domain-icon {
  font-size: 36px;
}
.domain-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}
.domain-stat {
  font-size: 24px;
  font-weight: 700;
  color: #1d4ed8;
  margin-top: 2px;
}
.domain-detail {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
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
  .domain-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
</style>
