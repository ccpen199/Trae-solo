<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayStats?.todayOrders || 0 }}</div>
              <div class="stat-label">今日订单</div>
            </div>
            <div class="stat-icon" style="background: #409EFF">
              <el-icon :size="24"><Document /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.todayStats?.todayRevenue || 0 }}</div>
              <div class="stat-label">今日营收</div>
            </div>
            <div class="stat-icon" style="background: #67C23A">
              <el-icon :size="24"><Money /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.parkingStats?.availableSpaces || 0 }} / {{ stats.parkingStats?.totalSpaces || 0 }}</div>
              <div class="stat-label">可用车位</div>
            </div>
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon :size="24"><Car /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.exceptionStats?.pendingExceptions || 0 }}</div>
              <div class="stat-label">待处理异常</div>
            </div>
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span class="card-title">订单状态分布</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="8" v-for="(count, status) in statusList" :key="status">
              <div class="status-card" :class="getStatusClass(status)">
                <div class="status-count">{{ stats.statusCounts?.[status] || 0 }}</div>
                <div class="status-name">{{ getStatusLabel(status) }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span class="card-title">快速操作</span>
          </template>
          <el-button type="primary" @click="goToEntry" style="width: 100%; margin-bottom: 12px">
            <el-icon><Edit /></el-icon> 车牌入场
          </el-button>
          <el-button @click="goToOrders" style="width: 100%; margin-bottom: 12px">
            <el-icon><List /></el-icon> 查看订单
          </el-button>
          <el-button type="warning" @click="goToExceptions" style="width: 100%">
            <el-icon><Warning /></el-icon> 异常处理
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi } from '@/api'

const router = useRouter()
const stats = ref({
  statusCounts: {},
  todayStats: {},
  parkingStats: {},
  exceptionStats: {}
})

const statusList = ['pending_parking', 'pending_billing', 'pending_payment', 'pending_reconciliation']

const getStatusLabel = (status) => {
  const map = {
    pending_parking: '待车位停放',
    pending_billing: '待出场计费',
    pending_payment: '待支付抬杆',
    pending_reconciliation: '待对账',
    completed: '已完成'
  }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = {
    pending_parking: 'status-waiting',
    pending_billing: 'status-review',
    pending_payment: 'status-payment',
    pending_reconciliation: 'status-reconcile'
  }
  return map[status] || ''
}

const loadStats = async () => {
  try {
    const res = await orderApi.getStats()
    stats.value = res.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const goToEntry = () => router.push('/entry')
const goToOrders = () => router.push('/orders')
const goToExceptions = () => router.push('/exceptions')

onMounted(() => {
  loadStats()
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
  border-radius: 8px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.status-card {
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-card.status-waiting {
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
}

.status-card.status-review {
  background: #fdf6ec;
  border: 1px solid #faecd8;
}

.status-card.status-payment {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
}

.status-card.status-reconcile {
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
}

.status-count {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}

.status-name {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}
</style>