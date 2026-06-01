<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.today_orders }}</div>
              <div class="stat-label">今日订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending_orders }}</div>
              <div class="stat-label">待接单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.active_drivers }}</div>
              <div class="stat-label">活跃司机</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ (stats.monthly_revenue || 0).toFixed(0) }}</div>
              <div class="stat-label">月营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>SLA 服务达标率</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="接单达标率">
              <el-tag type="success" v-if="slaStats.accept_rate >= 90">{{ slaStats.accept_rate }}%</el-tag>
              <el-tag type="warning" v-else-if="slaStats.accept_rate >= 70">{{ slaStats.accept_rate }}%</el-tag>
              <el-tag type="danger" v-else>{{ slaStats.accept_rate }}%</el-tag>
              <span style="margin-left: 10px; color: #909399; font-size: 12px;">标准: ≤60秒</span>
            </el-descriptions-item>
            <el-descriptions-item label="上门达标率">
              <el-tag type="success" v-if="slaStats.arrive_rate >= 90">{{ slaStats.arrive_rate }}%</el-tag>
              <el-tag type="warning" v-else-if="slaStats.arrive_rate >= 70">{{ slaStats.arrive_rate }}%</el-tag>
              <el-tag type="danger" v-else>{{ slaStats.arrive_rate }}%</el-tag>
              <span style="margin-left: 10px; color: #909399; font-size: 12px;">标准: ≤5分钟</span>
            </el-descriptions-item>
            <el-descriptions-item label="平均接单时间">
              {{ (slaStats.avg_accept_time || 0).toFixed(1) }}秒
            </el-descriptions-item>
            <el-descriptions-item label="平均上门时间">
              {{ (slaStats.avg_arrive_time || 0).toFixed(1) }}秒
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近订单</span>
          </template>
          <el-table :data="recentOrders" size="small">
            <el-table-column prop="order_no" label="订单号" width="140" />
            <el-table-column prop="loading_address" label="装货地址" show-overflow-tooltip />
            <el-table-column prop="price" label="金额" width="80">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
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
import { statsAPI, orderAPI } from '@/api'

const stats = ref({})
const slaStats = ref({})
const recentOrders = ref([])

const loadData = async () => {
  try {
    const results = await Promise.allSettled([
      statsAPI.overview(),
      statsAPI.sla(),
      orderAPI.list({})
    ])
    
    const statsRes = results[0].status === 'fulfilled' ? results[0].value : null
    const slaRes = results[1].status === 'fulfilled' ? results[1].value : null
    const ordersRes = results[2].status === 'fulfilled' ? results[2].value : null
    
    if (statsRes && statsRes.success) stats.value = statsRes.data
    if (slaRes && slaRes.success) slaStats.value = slaRes.data
    if (ordersRes && ordersRes.success) recentOrders.value = ordersRes.data.slice(0, 5)
  } catch (e) {
    console.error('Load dashboard data error:', e)
  }
}

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    accepted: 'warning',
    arrived: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待接单',
    accepted: '已接单',
    arrived: '已到达',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
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
</style>
