<template>
  <div class="stations-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>电站列表</span>
          <div>
            <el-button type="primary" @click="refresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="stations" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="电站名称" min-width="180" fixed />
        <el-table-column prop="installed_capacity_kw" label="装机容量" width="120">
          <template #default="{ row }">
            {{ row.installed_capacity_kw }} kWp
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" min-width="180">
          <template #default="{ row }">
            {{ row.province }} {{ row.city }} {{ row.district }}
          </template>
        </el-table-column>
        <el-table-column prop="current_power_kw" label="当前功率" width="120">
          <template #default="{ row }">
            <span :class="{ 'pv-green': (row.current_power_kw || 0) > 0 }">
              {{ (row.current_power_kw || 0).toFixed(1) }} kW
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="today_generation_kwh" label="今日发电" width="120">
          <template #default="{ row }">
            {{ (row.today_generation_kwh || 0).toFixed(0) }} kWh
          </template>
        </el-table-column>
        <el-table-column prop="current_pr" label="PR值" width="100">
          <template #default="{ row }">
            <span :class="getPrClass(row.current_pr)">
              {{ ((row.current_pr || 0) * 100).toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="health_level" label="健康状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getHealthType(row.health_level)" size="small">
              {{ getHealthLabel(row.health_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="detailVisible" title="电站详情" width="600px">
      <el-descriptions v-if="selectedStation" :column="2" border>
        <el-descriptions-item label="电站名称" :span="2">
          {{ selectedStation.name }}
        </el-descriptions-item>
        <el-descriptions-item label="装机容量">
          {{ selectedStation.installed_capacity_kw }} kWp
        </el-descriptions-item>
        <el-descriptions-item label="健康状态">
          <el-tag :type="getHealthType(selectedStation.health_level)">
            {{ getHealthLabel(selectedStation.health_level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="位置" :span="2">
          {{ selectedStation.province }} {{ selectedStation.city }} {{ selectedStation.district }} {{ selectedStation.address }}
        </el-descriptions-item>
        <el-descriptions-item label="坐标">
          {{ selectedStation.latitude }}, {{ selectedStation.longitude }}
        </el-descriptions-item>
        <el-descriptions-item label="组件倾角">
          {{ selectedStation.panel_angle_deg || '-' }}°
        </el-descriptions-item>
        <el-descriptions-item label="组件类型">
          {{ selectedStation.panel_type || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="组件数量">
          {{ selectedStation.panel_count || '-' }} 块
        </el-descriptions-item>
        <el-descriptions-item label="每块组件功率">
          {{ selectedStation.panel_power_w || '-' }} W
        </el-descriptions-item>
        <el-descriptions-item label="上网电价">
          ¥{{ selectedStation.grid_price || '-' }}/kWh
        </el-descriptions-item>
        <el-descriptions-item label="补贴电价">
          ¥{{ selectedStation.subsidy_price || '-' }}/kWh
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const loading = ref(false)
const stations = ref([])
const detailVisible = ref(false)
const selectedStation = ref(null)
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadStations = async () => {
  loading.value = true
  try {
    const result = await api.get('/stations/list')
    stations.value = result.data || result
    pagination.value.total = stations.value.length
  } catch (error) {
    console.error('Load stations error:', error)
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  loadStations()
}

const viewDetail = (station) => {
  selectedStation.value = station
  detailVisible.value = true
}

const getPrClass = (pr) => {
  if (pr >= 0.8) return 'pv-green'
  if (pr >= 0.75) return 'pv-blue'
  return 'pv-red'
}

const getHealthType = (level) => {
  const types = {
    excellent: 'success',
    good: 'primary',
    normal: 'warning',
    poor: 'danger'
  }
  return types[level] || 'info'
}

const getHealthLabel = (level) => {
  const labels = {
    excellent: '优秀',
    good: '良好',
    normal: '一般',
    poor: '较差'
  }
  return labels[level] || level
}

onMounted(() => {
  loadStations()
})
</script>

<style scoped>
.stations-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.pv-green {
  color: #67c23a;
  font-weight: 600;
}

.pv-blue {
  color: #409eff;
  font-weight: 600;
}

.pv-red {
  color: #f56c6c;
  font-weight: 600;
}
</style>
