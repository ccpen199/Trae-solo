<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ dashboardStats.pending_count || 0 }}</div>
              <div class="stat-label">待处理订单</div>
            </div>
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ dashboardStats.orders_by_status?.completed || 0 }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
            <div class="stat-icon success">
              <el-icon><CircleCheck /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(dashboardStats.total_amount) }}</div>
              <div class="stat-label">总金额</div>
            </div>
            <div class="stat-icon amount">
              <el-icon><Money /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ dashboardStats.risk_summary?.total_credit || 0 }}</div>
              <div class="stat-label">可用授信</div>
            </div>
            <div class="stat-icon credit">
              <el-icon><CreditCard /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>订单状态分布</span>
          </template>
          <el-table :data="orderStatusList" style="width: 100%">
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.type">{{ row.label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" />
            <el-table-column prop="amount" label="金额">
              <template #default="{ row }">
                {{ formatAmount(row.amount) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button 
              v-if="userStore.role === 'supplier'"
              type="primary" 
              size="large" 
              @click="goToCreate"
              style="width: 100%; margin-bottom: 12px"
            >
              <el-icon><Plus /></el-icon>
              资产登记
            </el-button>
            <el-button 
              type="default" 
              size="large" 
              @click="goToOrders"
              style="width: 100%; margin-bottom: 12px"
            >
              <el-icon><List /></el-icon>
              订单列表
            </el-button>
            <el-button 
              type="default" 
              size="large" 
              @click="goToMessages"
              style="width: 100%"
            >
              <el-icon><Bell /></el-icon>
              待办消息
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>最近活动</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.created_at"
              placement="top"
            >
              <el-card>
                <h4>{{ activity.message }}</h4>
                <p style="color: #909399; font-size: 12px">
                  {{ activity.module }} - {{ activity.action }}
                </p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item v-if="recentActivities.length === 0">
              <p style="color: #909399">暂无活动记录</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { statusMap } from '@/api'
import * as api from '@/api'

const router = useRouter()
const userStore = useUserStore()

const dashboardStats = ref({})
const recentActivities = ref([])

const orderStatusList = computed(() => {
  const result = []
  const statuses = dashboardStats.value.orders_by_status || {}
  const amounts = dashboardStats.value.total_amount_by_status || {}
  
  for (const [key, labelInfo] of Object.entries(statusMap)) {
    const count = statuses[key] || 0
    const amount = amounts[key] || 0
    if (count > 0 || amount > 0) {
      result.push({
        status: key,
        label: labelInfo.label,
        type: labelInfo.type === 'danger' ? 'danger' : 
              labelInfo.type === 'success' ? 'success' : 
              labelInfo.type === 'warning' ? 'warning' : 'info',
        count,
        amount
      })
    }
  }
  return result
})

const formatAmount = (amount) => {
  if (!amount) return '¥0.00'
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

const goToCreate = () => router.push('/orders/create')
const goToOrders = () => router.push('/orders')
const goToMessages = () => router.push('/messages')

const fetchDashboardData = async () => {
  try {
    const stats = await api.getDashboardStats()
    dashboardStats.value = stats
    recentActivities.value = stats.recent_activities || []
  } catch (error) {
    console.error('获取工作台数据失败:', error)
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info .stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-info .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #e6a23c;
}

.stat-icon.success {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #67c23a;
}

.stat-icon.amount {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
  color: #67c23a;
}

.stat-icon.credit {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #409eff;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}
</style>
