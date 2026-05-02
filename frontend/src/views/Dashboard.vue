<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="4" v-for="stat in statsData" :key="stat.key">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="28" color="#fff"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近任务</span>
              <el-button type="primary" link @click="$router.push('/orders')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" v-loading="loading" stripe>
            <el-table-column prop="order_no" label="主单号" width="200" />
            <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :class="['status-tag', row.status]">
                  {{ row.statusLabel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="creator_name" label="创建人" width="100" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewDetail(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>状态分布</span>
          </template>
          <div class="status-chart">
            <div class="status-item" v-for="item in statusList" :key="item.status">
              <div class="status-item-header">
                <span class="status-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="status-name">{{ item.label }}</span>
                <span class="status-count">{{ item.count }}</span>
              </div>
              <el-progress :percentage="item.percentage" :color="item.color" :stroke-width="8" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="4">
              <el-button type="primary" size="large" style="width: 100%; height: 80px" @click="$router.push('/orders/create')">
                <el-icon size="24"><Plus /></el-icon>
                <div style="margin-top: 8px">新建日志采集</div>
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button size="large" style="width: 100%; height: 80px" @click="filterByStatus('pending_collect')">
                <el-icon size="24" color="#1890ff"><Upload /></el-icon>
                <div style="margin-top: 8px">待采集 ({{ stats.pending_collect }})</div>
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button size="large" style="width: 100%; height: 80px" @click="filterByStatus('pending_parse')">
                <el-icon size="24" color="#fa8c16"><Setting /></el-icon>
                <div style="margin-top: 8px">待解析 ({{ stats.pending_parse }})</div>
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button size="large" style="width: 100%; height: 80px" @click="filterByStatus('pending_query')">
                <el-icon size="24" color="#52c41a"><Search /></el-icon>
                <div style="margin-top: 8px">待查询 ({{ stats.pending_query }})</div>
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button size="large" style="width: 100%; height: 80px" @click="filterByStatus('pending_alert')">
                <el-icon size="24" color="#f5222d"><Warning /></el-icon>
                <div style="margin-top: 8px">待告警 ({{ stats.pending_alert }})</div>
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button size="large" style="width: 100%; height: 80px" @click="filterByStatus('archived')">
                <el-icon size="24" color="#8c8c8c"><Box /></el-icon>
                <div style="margin-top: 8px">已归档 ({{ stats.archived }})</div>
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getStatistics } from '@/api/orders'

const router = useRouter()
const loading = ref(false)
const stats = reactive({
  total: 0,
  pending_collect: 0,
  pending_parse: 0,
  pending_query: 0,
  pending_alert: 0,
  archived: 0
})
const recentOrders = ref([])

const statsData = computed(() => [
  { key: 'total', label: '总任务数', value: stats.total, icon: 'Document', color: '#409EFF' },
  { key: 'pending_collect', label: '待采集', value: stats.pending_collect, icon: 'Upload', color: '#1890ff' },
  { key: 'pending_parse', label: '待解析', value: stats.pending_parse, icon: 'Setting', color: '#fa8c16' },
  { key: 'pending_query', label: '待查询', value: stats.pending_query, icon: 'Search', color: '#52c41a' },
  { key: 'pending_alert', label: '待告警', value: stats.pending_alert, icon: 'Warning', color: '#f5222d' },
  { key: 'archived', label: '已归档', value: stats.archived, icon: 'Box', color: '#8c8c8c' }
])

const statusList = computed(() => {
  const total = stats.total || 1
  return [
    { status: 'pending_collect', label: '待日志采集', count: stats.pending_collect, percentage: Math.round((stats.pending_collect / total) * 100), color: '#1890ff' },
    { status: 'pending_parse', label: '待解析索引', count: stats.pending_parse, percentage: Math.round((stats.pending_parse / total) * 100), color: '#fa8c16' },
    { status: 'pending_query', label: '待查询分析', count: stats.pending_query, percentage: Math.round((stats.pending_query / total) * 100), color: '#52c41a' },
    { status: 'pending_alert', label: '待告警', count: stats.pending_alert, percentage: Math.round((stats.pending_alert / total) * 100), color: '#f5222d' },
    { status: 'archived', label: '已归档', count: stats.archived, percentage: Math.round((stats.archived / total) * 100), color: '#8c8c8c' }
  ]
})

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const viewDetail = (id) => {
  router.push(`/orders/${id}`)
}

const filterByStatus = (status) => {
  router.push({ path: '/orders', query: { status } })
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getStatistics()
    Object.assign(stats, res.data.stats)
    recentOrders.value = res.data.recentOrders || []
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard {
  min-height: 100%;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  margin-left: 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-chart {
  padding: 10px 0;
}

.status-item {
  margin-bottom: 20px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-item-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-name {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.status-count {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}
</style>
