<template>
  <div class="dashboard">
    <h2 class="page-title">数据概览</h2>
    
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card total">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">问题总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card pending">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card overdue">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.overdue }}</div>
              <div class="stat-label">超期风险</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card closed">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.closed }}</div>
              <div class="stat-label">已关闭</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>按责任单位分布</span>
          </template>
          <div class="chart-container">
            <div v-for="org in stats.byOrg" :key="org.id" class="chart-item">
              <div class="chart-label">{{ org.name }}</div>
              <el-progress :percentage="org.percent" :stroke-width="20" :show-text="false" />
              <div class="chart-value">{{ org.count }} 个</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>按专业分布</span>
          </template>
          <div class="chart-container">
            <div v-for="item in stats.bySpecialty" :key="item.specialty" class="chart-item">
              <div class="chart-label">{{ specialtyMap[item.specialty] || item.specialty }}</div>
              <el-progress :percentage="item.percent" :stroke-width="20" :show-text="false" color="#67C23A" />
              <div class="chart-value">{{ item.count }} 个</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="recent-issues">
      <template #header>
        <span>最近问题</span>
        <el-button type="primary" link @click="$router.push('/issues')">查看全部</el-button>
      </template>
      <el-table :data="recentIssues" stripe>
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="title" label="问题标题" />
        <el-table-column prop="specialty" label="专业" width="100">
          <template #default="{ row }">
            {{ specialtyMap[row.specialty] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { issuesAPI } from '../api'

const router = useRouter()
const stats = ref({
  total: 0,
  pending: 0,
  overdue: 0,
  closed: 0,
  byOrg: [],
  bySpecialty: []
})
const recentIssues = ref([])

const statusMap = {
  draft: '草稿',
  pending: '待派发',
  assigned: '已派发',
  fixed: '待复验',
  rejected: '已退回',
  verified: '已验收',
  reopened: '已重开',
  closed: '已关闭'
}

const statusTypeMap = {
  draft: 'info',
  pending: 'warning',
  assigned: 'primary',
  fixed: 'success',
  rejected: 'danger',
  verified: 'success',
  reopened: 'warning',
  closed: 'info'
}

const specialtyMap = {
  architecture: '建筑',
  structure: '结构',
  mep: '机电',
  civil: '土建',
  hvac: '暖通',
  plumbing: '给排水',
  electrical: '电气'
}

const loadStats = async () => {
  try {
    const res = await issuesAPI.stats()
    const data = res.data
    
    const statusCounts = {}
    data.byStatus.forEach(s => {
      statusCounts[s.status] = s.count
    })
    
    const total = data.byStatus.reduce((sum, s) => sum + s.count, 0)
    
    stats.value = {
      total,
      pending: (statusCounts.pending || 0) + (statusCounts.assigned || 0) + (statusCounts.fixed || 0),
      overdue: data.overdue,
      closed: statusCounts.closed || 0,
      byOrg: data.byOrg.map(o => ({
        ...o,
        percent: total > 0 ? Math.round((o.count / total) * 100) : 0
      })),
      bySpecialty: data.bySpecialty.map(s => ({
        ...s,
        percent: total > 0 ? Math.round((s.count / total) * 100) : 0
      }))
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const loadRecentIssues = async () => {
  try {
    const res = await issuesAPI.list({})
    recentIssues.value = res.data.slice(0, 5)
  } catch (e) {
    console.error('加载最近问题失败', e)
  }
}

const viewDetail = (id) => {
  router.push(`/issues/${id}`)
}

onMounted(() => {
  loadStats()
  loadRecentIssues()
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 20px;
}
.page-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
}
.stats-cards {
  margin-bottom: 20px;
}
.stat-card {
  border-radius: 8px;
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.total .stat-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
.pending .stat-icon { background: linear-gradient(135deg, #f6d365, #fda085); }
.overdue .stat-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
.closed .stat-icon { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.charts-row {
  margin-bottom: 20px;
}
.chart-container {
  min-height: 200px;
}
.chart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.chart-label {
  width: 100px;
  font-size: 14px;
  color: #606266;
}
.chart-item .el-progress {
  flex: 1;
}
.chart-value {
  width: 60px;
  text-align: right;
  font-size: 14px;
  color: #909399;
}
.recent-issues .el-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
