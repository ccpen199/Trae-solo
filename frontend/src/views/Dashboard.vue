<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statCards" :key="item.key">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
            <el-icon :size="24" color="#fff">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>状态分布</span>
            </div>
          </template>
          <div class="status-chart">
            <div v-for="(item, key) in dashboardData.status_distribution" :key="key" class="status-item">
              <div class="status-bar">
                <div 
                  class="status-fill" 
                  :style="{ 
                    width: (item.count / dashboardData.summary.total_orders * 100) + '%',
                    backgroundColor: item.color 
                  }"
                ></div>
              </div>
              <div class="status-info">
                <span class="status-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="status-name">{{ item.label }}</span>
                <span class="status-count">{{ item.count }} 单</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          <div class="pending-list">
            <div class="pending-item" v-if="dashboardData.pending.todos > 0">
              <el-icon color="#E6A23C"><Bell /></el-icon>
              <span>待处理消息: {{ dashboardData.pending.todos }} 条</span>
            </div>
            <div class="pending-item" v-if="dashboardData.pending.alarms > 0">
              <el-icon color="#F56C6C"><Warning /></el-icon>
              <span>待处理告警: {{ dashboardData.pending.alarms }} 条</span>
            </div>
            <div class="pending-item empty" v-else>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
              <span>暂无待办事项</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热门线路</span>
            </div>
          </template>
          <el-table :data="dashboardData.top_routes" style="width: 100%">
            <el-table-column prop="route_name" label="线路名称" />
            <el-table-column prop="order_count" label="排班数量" width="120">
              <template #default="{ row }">
                <el-tag type="primary">{{ row.order_count }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToCreateOrder">
              <el-icon><Plus /></el-icon>
              新建排班
            </el-button>
            <el-button type="success" size="large" @click="goToMap">
              <el-icon><MapLocation /></el-icon>
              车辆地图
            </el-button>
            <el-button type="warning" size="large" @click="goToOrders">
              <el-icon><Document /></el-icon>
              排班列表
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { statisticsApi } from '@/api'

const router = useRouter()

const dashboardData = ref({
  summary: {
    total_orders: 0,
    completed_orders: 0,
    exception_orders: 0,
    completion_rate: 0
  },
  pending: {
    todos: 0,
    alarms: 0
  },
  status_distribution: {},
  top_routes: []
})

const statCards = computed(() => [
  {
    key: 'total',
    icon: 'Document',
    label: '总排班数',
    value: dashboardData.value.summary.total_orders,
    bgColor: '#409EFF'
  },
  {
    key: 'completed',
    icon: 'CircleCheck',
    label: '已完成',
    value: dashboardData.value.summary.completed_orders,
    bgColor: '#67C23A'
  },
  {
    key: 'exception',
    icon: 'Warning',
    label: '异常单',
    value: dashboardData.value.summary.exception_orders,
    bgColor: '#F56C6C'
  },
  {
    key: 'rate',
    icon: 'TrendCharts',
    label: '完成率',
    value: dashboardData.value.summary.completion_rate + '%',
    bgColor: '#E6A23C'
  }
])

async function fetchDashboard() {
  try {
    const result = await statisticsApi.getDashboard()
    dashboardData.value = result
  } catch (error) {
    console.error('获取看板数据失败:', error)
  }
}

function goToCreateOrder() {
  router.push('/orders/create')
}

function goToMap() {
  router.push('/map')
}

function goToOrders() {
  router.push('/orders')
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
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

.status-bar {
  height: 8px;
  background: #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.status-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.status-info {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-name {
  color: #606266;
  margin-right: 8px;
}

.status-count {
  color: #909399;
  font-size: 12px;
}

.pending-list {
  min-height: 150px;
}

.pending-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #EBEEF5;
  font-size: 14px;
  color: #606266;
}

.pending-item:last-child {
  border-bottom: none;
}

.pending-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

.pending-item.empty {
  justify-content: center;
  color: #909399;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.quick-actions .el-button {
  width: 100%;
}
</style>
