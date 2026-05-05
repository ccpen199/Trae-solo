<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF;">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayOrders || 0 }}</div>
              <div class="stat-label">今日订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C;">
              <el-icon size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pendingOrders || 0 }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A;">
              <el-icon size="32"><Van /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.transitOrders || 0 }}</div>
              <div class="stat-label">运输中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C;">
              <el-icon size="32"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ statistics.todayRevenue || 0 }}</div>
              <div class="stat-label">今日营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" link @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          
          <el-table :data="recentOrders" style="width: 100%">
            <el-table-column prop="order_no" label="订单号" width="180" />
            <el-table-column prop="customer_name" label="客户" width="120" />
            <el-table-column prop="origin_address" label="起点地址" show-overflow-tooltip />
            <el-table-column prop="dest_address" label="终点地址" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewOrderDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>车辆状态</span>
          </template>
          
          <div class="vehicle-status">
            <div class="status-item">
              <span class="status-label">空闲车辆</span>
              <span class="status-value" style="color: #67C23A;">{{ vehicleStats.idle }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">运输中</span>
              <span class="status-value" style="color: #409EFF;">{{ vehicleStats.transit }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">维护中</span>
              <span class="status-value" style="color: #E6A23C;">{{ vehicleStats.maintenance }}</span>
            </div>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>快捷操作</span>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" class="action-btn" @click="createOrder">
              <el-icon><Plus /></el-icon>
              <span>创建订单</span>
            </el-button>
            <el-button type="success" class="action-btn" @click="goToVehicles">
              <el-icon><Van /></el-icon>
              <span>车辆管理</span>
            </el-button>
            <el-button type="warning" class="action-btn" @click="goToMonitor">
              <el-icon><Monitor /></el-icon>
              <span>车辆监控</span>
            </el-button>
            <el-button type="info" class="action-btn" @click="goToDispatch">
              <el-icon><ChatDotRound /></el-icon>
              <span>调度指令</span>
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderList, getOrderStatistics } from '@/api/orders'
import { getVehicleList } from '@/api/vehicles'
import { getBatchDict } from '@/api/dictionary'

const router = useRouter()

const statistics = ref({})
const recentOrders = ref([])
const vehicleStats = ref({ idle: 0, transit: 0, maintenance: 0 })
const orderStatusMap = ref({})

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    reviewed: 'info',
    planned: 'primary',
    loading: 'warning',
    transit: 'success',
    unloading: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  return orderStatusMap.value[status] || status
}

const fetchStatistics = async () => {
  try {
    statistics.value = await getOrderStatistics()
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const fetchRecentOrders = async () => {
  try {
    const res = await getOrderList({ page: 1, pageSize: 5 })
    recentOrders.value = res.data || []
  } catch (error) {
    console.error('获取订单列表失败:', error)
  }
}

const fetchVehicleStats = async () => {
  try {
    const [idleRes, transitRes, maintenanceRes] = await Promise.all([
      getVehicleList({ status: 'idle', page: 1, pageSize: 1 }),
      getVehicleList({ status: 'transit', page: 1, pageSize: 1 }),
      getVehicleList({ status: 'maintenance', page: 1, pageSize: 1 })
    ])
    
    vehicleStats.value = {
      idle: idleRes.pagination?.total || 0,
      transit: transitRes.pagination?.total || 0,
      maintenance: maintenanceRes.pagination?.total || 0
    }
  } catch (error) {
    console.error('获取车辆状态失败:', error)
  }
}

const fetchDictData = async () => {
  try {
    const res = await getBatchDict(['order_status'])
    if (res.order_status) {
      res.order_status.forEach(item => {
        orderStatusMap.value[item.dict_key] = item.dict_value
      })
    }
  } catch (error) {
    console.error('获取字典数据失败:', error)
  }
}

const createOrder = () => {
  router.push('/orders/create')
}

const goToOrders = () => {
  router.push('/orders')
}

const goToVehicles = () => {
  router.push('/vehicles')
}

const goToMonitor = () => {
  router.push('/vehicles/monitor')
}

const goToDispatch = () => {
  router.push('/dispatch')
}

const viewOrderDetail = (row) => {
  router.push(`/orders/${row.id}`)
}

onMounted(() => {
  fetchDictData()
  fetchStatistics()
  fetchRecentOrders()
  fetchVehicleStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
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
  color: #fff;
}

.stat-info {
  margin-left: 16px;
}

.stat-value {
  font-size: 24px;
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

.vehicle-status {
  padding: 10px 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  color: #606266;
  font-size: 14px;
}

.status-value {
  font-size: 18px;
  font-weight: bold;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.action-btn .el-icon {
  font-size: 20px;
}
</style>
