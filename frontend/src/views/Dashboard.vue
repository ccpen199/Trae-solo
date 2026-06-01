<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">风险看板</h1>
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="card-stats">
            <div class="stat-value" style="color: #409EFF;">{{ summary.totalDomains }}</div>
            <div class="stat-label">域名总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="card-stats">
            <div class="stat-value" style="color: #67C23A;">{{ summary.totalCerts }}</div>
            <div class="stat-label">证书总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="card-stats">
            <div class="stat-value" style="color: #E6A23C;">{{ summary.activeTasks }}</div>
            <div class="stat-label">进行中任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="card-stats">
            <div class="stat-value" style="color: #F56C6C;">{{ summary.failedTasks }}</div>
            <div class="stat-label">失败任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="card-stats">
            <div class="stat-value" style="color: #E6A23C;">{{ summary.expiring30 }}</div>
            <div class="stat-label">30天内过期</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="card-stats">
            <div class="stat-value" style="color: #F56C6C;">{{ summary.expired }}</div>
            <div class="stat-label">已过期证书</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="risk-card">
          <template #header>
            <span style="color: #F56C6C;">
              <el-icon><Warning /></el-icon>
              即将过期 ({{ counts.expiringSoon }})
            </span>
          </template>
          <div class="risk-list">
            <div v-if="risks.expiringSoon.length === 0" class="empty-state">暂无数据</div>
            <div v-for="item in risks.expiringSoon.slice(0, 5)" :key="item.id" class="risk-item">
              <div class="risk-main">
                <span class="risk-domain">{{ item.common_name }}</span>
                <span :class="getDaysClass(item.days_left)" class="days-badge">{{ item.days_left }}天</span>
              </div>
              <div class="risk-sub">
                <span>{{ item.ca_provider }}</span>
                <span>{{ item.business_owner || '无归属' }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="risk-card">
          <template #header>
            <span style="color: #F56C6C;">
              <el-icon><CircleClose /></el-icon>
              已过期证书 ({{ counts.expired }})
            </span>
          </template>
          <div class="risk-list">
            <div v-if="risks.expired.length === 0" class="empty-state">暂无数据</div>
            <div v-for="item in risks.expired.slice(0, 5)" :key="item.id" class="risk-item">
              <div class="risk-main">
                <span class="risk-domain">{{ item.common_name }}</span>
                <span class="days-badge days-critical">已过期{{ Math.abs(item.days_left) }}天</span>
              </div>
              <div class="risk-sub">
                <span>{{ item.ca_provider }}</span>
                <span>{{ item.business_owner || '无归属' }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8">
        <el-card class="risk-card">
          <template #header>
            <span style="color: #E6A23C;">
              <el-icon><Key /></el-icon>
              弱算法证书 ({{ counts.weakAlgorithms }})
            </span>
          </template>
          <div class="risk-list">
            <div v-if="risks.weakAlgorithms.length === 0" class="empty-state">暂无数据</div>
            <div v-for="item in risks.weakAlgorithms.slice(0, 5)" :key="item.id" class="risk-item">
              <div class="risk-main">
                <span class="risk-domain">{{ item.full_domain }}</span>
                <el-tag type="danger" size="small">{{ item.algorithm }}</el-tag>
              </div>
              <div class="risk-sub">
                <span>{{ item.ca_provider }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="risk-card">
          <template #header>
            <span style="color: #E6A23C;">
              <el-icon><User /></el-icon>
              无人负责域名 ({{ counts.noContact }})
            </span>
          </template>
          <div class="risk-list">
            <div v-if="risks.noContact.length === 0" class="empty-state">暂无数据</div>
            <div v-for="item in risks.noContact.slice(0, 5)" :key="item.id" class="risk-item">
              <div class="risk-main">
                <span class="risk-domain">{{ item.full_domain }}</span>
              </div>
              <div class="risk-sub">
                <span>{{ item.business_owner || '无业务归属' }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="risk-card">
          <template #header>
            <span style="color: #F56C6C;">
              <el-icon><CircleClose /></el-icon>
              失败任务 ({{ counts.failedTasks }})
            </span>
          </template>
          <div class="risk-list">
            <div v-if="risks.failedTasks.length === 0" class="empty-state">暂无数据</div>
            <div v-for="item in risks.failedTasks.slice(0, 5)" :key="item.id" class="risk-item">
              <div class="risk-main">
                <span class="risk-domain">{{ item.common_name }}</span>
              </div>
              <div class="risk-sub">
                <span>{{ item.business_owner }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="risk-card">
          <template #header>
            <span>证书状态分布</span>
          </template>
          <div ref="chartStatus" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="risk-card">
          <template #header>
            <span>CA机构分布</span>
          </template>
          <div ref="chartCA" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Warning, CircleClose, Key, User } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import api from '@/utils/api'

const summary = ref({
  totalDomains: 0,
  totalCerts: 0,
  activeTasks: 0,
  failedTasks: 0,
  expiring30: 0,
  expired: 0
})

const risks = ref({
  expiringSoon: [],
  expired: [],
  weakAlgorithms: [],
  noContact: [],
  mismatched: [],
  failedTasks: [],
  noAutoRenew: []
})

const counts = ref({
  expiringSoon: 0,
  expired: 0,
  weakAlgorithms: 0,
  noContact: 0,
  mismatched: 0,
  failedTasks: 0,
  noAutoRenew: 0
})

const chartStatus = ref(null)
const chartCA = ref(null)

const getDaysClass = (days) => {
  if (days <= 7) return 'days-critical'
  if (days <= 30) return 'days-warning'
  return 'days-normal'
}

const loadData = async () => {
  try {
    const [summaryRes, risksRes, statusRes, caRes] = await Promise.all([
      api.get('/dashboard/summary'),
      api.get('/dashboard/risks'),
      api.get('/dashboard/charts/cert-status'),
      api.get('/dashboard/charts/ca-distribution')
    ])

    summary.value = summaryRes.data.summary
    risks.value = risksRes.data.risks
    counts.value = risksRes.data.counts

    nextTick(() => {
      renderStatusChart(statusRes.data.data)
      renderCAChart(caRes.data.data)
    })
  } catch (e) {
    console.error(e)
  }
}

const renderStatusChart = (data) => {
  if (!chartStatus.value) return
  
  const chart = echarts.init(chartStatus.value)
  const statusMap = {
    'valid': { name: '有效', color: '#67C23A' },
    'expiring_soon': { name: '即将过期', color: '#E6A23C' },
    'expired': { name: '已过期', color: '#F56C6C' },
    'revoked': { name: '已吊销', color: '#909399' }
  }

  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      data: data.map(d => ({
        value: d.count,
        name: statusMap[d.status]?.name || d.status,
        itemStyle: { color: statusMap[d.status]?.color || '#909399' }
      }))
    }]
  })
}

const renderCAChart = (data) => {
  if (!chartCA.value) return
  
  const chart = echarts.init(chartCA.value)
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9b59b6']

  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true },
      data: data.map((d, i) => ({
        value: d.value,
        name: d.name,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }]
  })
}

const refreshData = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.risk-list {
  max-height: 300px;
  overflow-y: auto;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #909399;
}

.risk-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.risk-item:last-child {
  border-bottom: none;
}

.risk-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.risk-domain {
  font-weight: 500;
  color: #303133;
}

.risk-sub {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}
</style>
