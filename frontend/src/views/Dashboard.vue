<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6" v-for="card in statCards" :key="card.status">
        <el-card shadow="hover" class="stat-card" :class="`card-${card.type}`">
          <div class="card-content">
            <div class="card-icon">
              <el-icon :size="32"><component :is="card.icon" /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-count">{{ stats.byStatus[card.status] || 0 }}</div>
              <div class="card-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="today-stats">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>今日统计</span>
          </template>
          <div class="today-content">
            <div class="today-item">
              <span class="today-label">今日新增订单</span>
              <span class="today-value">{{ stats.today?.today_count || 0 }}</span>
            </div>
            <div class="today-item">
              <span class="today-label">今日完成订单</span>
              <span class="today-value">{{ stats.today?.today_completed || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>快速操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="goToCreate">
              <el-icon><Plus /></el-icon>
              创建新订单
            </el-button>
            <el-button @click="goToOrders">
              <el-icon><Document /></el-icon>
              查看订单列表
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="status-overview">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span>状态分布</span>
          </template>
          <div class="status-bars">
            <div class="status-bar-item" v-for="item in statusBarItems" :key="item.status">
              <div class="bar-header">
                <span class="bar-label">
                  <el-tag :type="item.color" size="small">{{ item.label }}</el-tag>
                </span>
                <span class="bar-count">{{ stats.byStatus[item.status] || 0 }}</span>
              </div>
              <el-progress 
                :percentage="getPercentage(item.status)" 
                :color="getProgressColor(item.color)"
                :stroke-width="12"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="recent-orders">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="text" @click="goToOrders">查看更多</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" v-loading="loadingOrders" style="width: 100%">
            <el-table-column prop="order_no" label="订单号" width="180" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="model_name" label="模型名称" min-width="150" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="STATUS_COLOR[row.current_status]">
                  {{ STATUS_LABEL[row.current_status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="responsible_name" label="负责人" width="120" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewOrder(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Document, Upload, View, Setting, Money, User, CircleCheck, Warning } from '@element-plus/icons-vue'
import { STATUS, STATUS_LABEL, STATUS_COLOR } from '@/utils/constants'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const loadingOrders = ref(false)
const stats = ref({
  byStatus: {},
  today: {}
})
const recentOrders = ref([])

const statCards = [
  { status: STATUS.PENDING_MODEL_LOAD, label: '待加载模型', type: 'info', icon: 'Upload' },
  { status: STATUS.PENDING_INTERACTION, label: '待交互查看', type: 'warning', icon: 'View' },
  { status: STATUS.PENDING_CONFIG_SELECTION, label: '待选择配置', type: 'primary', icon: 'Setting' },
  { status: STATUS.PENDING_QUOTE, label: '待生成报价', type: 'warning', icon: 'Money' },
  { status: STATUS.PENDING_LEAD, label: '待留资', type: 'primary', icon: 'User' },
  { status: STATUS.COMPLETED, label: '已完成', type: 'success', icon: 'CircleCheck' },
  { status: STATUS.REJECTED, label: '已驳回', type: 'danger', icon: 'Warning' },
  { status: STATUS.DEGRADED, label: '已降级', type: 'danger', icon: 'Warning' }
]

const statusBarItems = [
  { status: STATUS.PENDING_MODEL_LOAD, label: '待加载模型', color: 'info' },
  { status: STATUS.PENDING_INTERACTION, label: '待交互查看', color: 'warning' },
  { status: STATUS.PENDING_CONFIG_SELECTION, label: '待选择配置', color: 'primary' },
  { status: STATUS.PENDING_QUOTE, label: '待生成报价', color: 'warning' },
  { status: STATUS.PENDING_LEAD, label: '待留资', color: 'primary' },
  { status: STATUS.COMPLETED, label: '已完成', color: 'success' }
]

function getPercentage(status) {
  const total = Object.values(stats.value.byStatus).reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  return Math.round((stats.value.byStatus[status] || 0) / total * 100)
}

function getProgressColor(type) {
  const colors = {
    primary: '#409EFF',
    success: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C',
    info: '#909399'
  }
  return colors[type] || colors.info
}

function formatTime(time) {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

function goToCreate() {
  router.push('/orders/create')
}

function goToOrders() {
  router.push('/orders')
}

function viewOrder(row) {
  router.push(`/orders/${row.id}`)
}

async function fetchStats() {
  loading.value = true
  try {
    const res = await request.get('/orders/stats')
    if (res.data.success) {
      stats.value = res.data.data
    }
  } catch (err) {
    console.error('获取统计数据失败:', err)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

async function fetchRecentOrders() {
  loadingOrders.value = true
  try {
    const res = await request.get('/orders', {
      params: { page: 1, pageSize: 5 }
    })
    if (res.data.success) {
      recentOrders.value = res.data.data.orders || []
    }
  } catch (err) {
    console.error('获取订单列表失败:', err)
    ElMessage.error('获取订单列表失败')
  } finally {
    loadingOrders.value = false
  }
}

onMounted(() => {
  fetchStats()
  fetchRecentOrders()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-info {
  flex: 1;
}

.card-count {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.card-info .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-info .card-icon {
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.card-primary .card-icon {
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.card-success .card-icon {
  background: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.card-warning .card-icon {
  background: rgba(230, 162, 60, 0.1);
  color: #E6A23C;
}

.card-danger .card-icon {
  background: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

.card-info .card-icon {
  background: rgba(144, 147, 153, 0.1);
  color: #909399;
}

.today-stats {
  margin-bottom: 20px;
}

.today-content {
  display: flex;
  gap: 40px;
}

.today-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.today-label {
  font-size: 14px;
  color: #909399;
}

.today-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.status-overview {
  margin-bottom: 20px;
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-bar-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bar-label {
  font-size: 14px;
  color: #606266;
}

.bar-count {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.recent-orders {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
