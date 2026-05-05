<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayRevenue }}</div>
              <div class="stat-label">今日营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayOrders }}</div>
              <div class="stat-label">今日订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon><CoffeeCup /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.occupiedTables }} / {{ stats.totalTables }}</div>
              <div class="stat-label">使用桌台</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.lowStock }}</div>
              <div class="stat-label">库存预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最新订单</span>
          </template>
          <el-table :data="recentOrders" style="width: 100%" v-loading="loading">
            <el-table-column prop="orderNo" label="订单号" width="180" />
            <el-table-column prop="table.name" label="桌台" width="100">
              <template #default="{ row }">
                {{ row.table?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="金额" width="100">
              <template #default="{ row }">
                ¥{{ row.totalAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>桌台状态</span>
          </template>
          <div class="table-grid">
            <div
              v-for="table in tables"
              :key="table.id"
              class="table-item"
              :class="getTableClass(table.status)"
            >
              <div class="table-name">{{ table.name }}</div>
              <div class="table-info">{{ table.capacity }}人</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)

const stats = reactive({
  todayRevenue: '0.00',
  todayOrders: 0,
  occupiedTables: 0,
  totalTables: 0,
  lowStock: 0
})

const recentOrders = ref([])
const tables = ref([])

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    confirmed: 'primary',
    preparing: 'warning',
    ready: 'success',
    served: 'success',
    paid: 'success',
    cancelled: 'danger',
    refunded: 'info'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    preparing: '制作中',
    ready: '已完成',
    served: '已上菜',
    paid: '已结账',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return map[status] || status
}

const getTableClass = (status) => {
  const map = {
    available: 'available',
    occupied: 'occupied',
    reserved: 'reserved',
    cleaning: 'cleaning',
    maintenance: 'maintenance'
  }
  return map[status] || 'available'
}

const fetchData = async () => {
  loading.value = true
  try {
    const [ordersRes, tablesRes, lowStockRes, paymentsRes] = await Promise.all([
      api.order.getList({ page: 1, pageSize: 5 }),
      api.table.getList(),
      api.inventory.getLowStock().catch(() => ({ data: [] })),
      api.payment.getStatistics().catch(() => ({ data: { totalPayments: 0, totalRevenue: 0 } }))
    ])
    
    recentOrders.value = ordersRes.data?.list || []
    tables.value = tablesRes.data || []
    
    stats.todayOrders = paymentsRes.data?.totalPayments || 0
    stats.todayRevenue = Number(paymentsRes.data?.totalRevenue || 0).toFixed(2)
    stats.lowStock = Array.isArray(lowStockRes.data) ? lowStockRes.data.length : 0
    stats.totalTables = tables.value.length
    stats.occupiedTables = tables.value.filter(t => t.status === 'occupied').length
    
  } catch (error) {
    console.error('Fetch data error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.stat-card {
  cursor: pointer;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}

.stat-info {
  margin-left: 20px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.table-item {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.table-item:hover {
  transform: scale(1.05);
}

.table-item.available {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  color: #67c23a;
}

.table-item.occupied {
  background: #fef0f0;
  border: 1px solid #fde2e2;
  color: #f56c6c;
}

.table-item.reserved {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  color: #e6a23c;
}

.table-item.cleaning {
  background: #f4f4f5;
  border: 1px solid #e9e9eb;
  color: #909399;
}

.table-item.maintenance {
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  color: #c0c4cc;
}

.table-name {
  font-size: 16px;
  font-weight: bold;
}

.table-info {
  font-size: 12px;
  margin-top: 5px;
}
</style>
