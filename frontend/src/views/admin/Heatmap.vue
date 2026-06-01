<template>
  <div class="admin-heatmap">
    <el-card>
      <template #header>
        <span>跨城线路热力分析</span>
      </template>
      <el-table :data="routes" v-loading="loading">
        <el-table-column prop="from_city" label="出发城市" width="120" />
        <el-table-column prop="to_city" label="目的城市" width="120" />
        <el-table-column prop="order_count" label="订单量" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getCountType(row.order_count)">
              {{ row.order_count }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_revenue" label="营收" width="120">
          <template #default="{ row }">¥{{ (row.total_revenue || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="热度" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="getHeatPercentage(row.order_count)"
              :color="getHeatColor(row.order_count)"
              :show-text="false"
            />
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 30px;">
        <h4 style="margin-bottom: 15px;">热度说明</h4>
        <div style="display: flex; gap: 30px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 10px; background: #67c23a;"></div>
            <span>高热度 (≥10单)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 10px; background: #e6a23c;"></div>
            <span>中热度 (5-9单)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 10px; background: #909399;"></div>
            <span>低热度 (&#60;5单)</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { heatmapAPI } from '@/api'

const routes = ref([])
const loading = ref(false)

const loadRoutes = async () => {
  loading.value = true
  const res = await heatmapAPI.routes()
  if (res.success) {
    routes.value = res.data
  }
  loading.value = false
}

const getCountType = (count) => {
  if (count >= 10) return 'success'
  if (count >= 5) return 'warning'
  return 'info'
}

const getHeatPercentage = (count) => {
  return Math.min((count / 20) * 100, 100)
}

const getHeatColor = (count) => {
  if (count >= 10) return '#67c23a'
  if (count >= 5) return '#e6a23c'
  return '#909399'
}

onMounted(() => {
  loadRoutes()
})
</script>
