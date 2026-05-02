<template>
  <div class="inverters-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>设备监控</span>
          <el-button type="primary" size="small" @click="refresh">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </template>

      <el-table :data="inverters" style="width: 100%" v-loading="loading">
        <el-table-column prop="station_name" label="电站" width="140" fixed />
        <el-table-column prop="serial_number" label="设备编号" width="160" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="string_count" label="组串数" width="80">
          <template #default="{ row }">
            {{ row.string_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_power_kw" label="当前功率" width="120">
          <template #default="{ row }">
            <span :class="{ 'pv-green': (row.current_power_kw || 0) > 0 }">
              {{ (row.current_power_kw || 0).toFixed(2) }} kW
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="today_generation_kwh" label="今日发电" width="120">
          <template #default="{ row }">
            {{ (row.today_generation_kwh || 0).toFixed(1) }} kWh
          </template>
        </el-table-column>
        <el-table-column prop="total_generation_kwh" label="累计发电" width="130">
          <template #default="{ row }">
            {{ (row.total_generation_kwh || 0).toFixed(0) }} kWh
          </template>
        </el-table-column>
        <el-table-column prop="dc_voltage_v" label="直流电压" width="100">
          <template #default="{ row }">
            {{ (row.dc_voltage_v || 0).toFixed(1) }} V
          </template>
        </el-table-column>
        <el-table-column prop="ac_voltage_v" label="交流电压" width="100">
          <template #default="{ row }">
            {{ (row.ac_voltage_v || 0).toFixed(1) }} V
          </template>
        </el-table-column>
        <el-table-column prop="temperature_c" label="温度" width="100">
          <template #default="{ row }">
            <span :class="{ 'pv-red': (row.temperature_c || 0) > 50 }">
              {{ (row.temperature_c || 0).toFixed(1) }}°C
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="efficiency" label="效率" width="90">
          <template #default="{ row }">
            <span :class="getEfficiencyClass(row.efficiency)">
              {{ ((row.efficiency || 0) * 100).toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="detailVisible" :title="`设备详情 - ${selectedInverter?.serial_number || ''}`" width="700px">
      <el-descriptions v-if="selectedInverter" :column="2" border>
        <el-descriptions-item label="设备编号" :span="2">
          {{ selectedInverter.serial_number }}
        </el-descriptions-item>
        <el-descriptions-item label="所属电站">
          {{ selectedInverter.station_name }}
        </el-descriptions-item>
        <el-descriptions-item label="设备型号">
          {{ selectedInverter.model }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(selectedInverter.status)" size="small">
            {{ getStatusLabel(selectedInverter.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="组串数量">
          {{ selectedInverter.string_count || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="当前功率" :span="2">
          <span class="pv-green" style="font-size: 24px; font-weight: bold;">
            {{ (selectedInverter.current_power_kw || 0).toFixed(2) }} kW
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="今日发电量">
          {{ (selectedInverter.today_generation_kwh || 0).toFixed(2) }} kWh
        </el-descriptions-item>
        <el-descriptions-item label="累计发电量">
          {{ (selectedInverter.total_generation_kwh || 0).toFixed(2) }} kWh
        </el-descriptions-item>
        <el-descriptions-item label="直流电压">
          {{ (selectedInverter.dc_voltage_v || 0).toFixed(1) }} V
        </el-descriptions-item>
        <el-descriptions-item label="直流电流">
          {{ (selectedInverter.dc_current_a || 0).toFixed(2) }} A
        </el-descriptions-item>
        <el-descriptions-item label="交流电压">
          {{ (selectedInverter.ac_voltage_v || 0).toFixed(1) }} V
        </el-descriptions-item>
        <el-descriptions-item label="交流电流">
          {{ (selectedInverter.ac_current_a || 0).toFixed(2) }} A
        </el-descriptions-item>
        <el-descriptions-item label="频率">
          {{ (selectedInverter.frequency_hz || 0).toFixed(1) }} Hz
        </el-descriptions-item>
        <el-descriptions-item label="温度">
          <span :class="{ 'pv-red': (selectedInverter.temperature_c || 0) > 50 }">
            {{ (selectedInverter.temperature_c || 0).toFixed(1) }}°C
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="效率">
          <span :class="getEfficiencyClass(selectedInverter.efficiency)">
            {{ ((selectedInverter.efficiency || 0) * 100).toFixed(1) }}%
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="上线时间">
          {{ formatTime(selectedInverter.commissioned_at) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const loading = ref(false)
const inverters = ref([])
const detailVisible = ref(false)
const selectedInverter = ref(null)

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadInverters = async () => {
  loading.value = true
  try {
    const result = await api.get('/inverters/list')
    inverters.value = result.data || result
    pagination.value.total = inverters.value.length
  } catch (error) {
    console.error('Load inverters error:', error)
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  loadInverters()
}

const viewDetail = (inverter) => {
  selectedInverter.value = inverter
  detailVisible.value = true
}

const getStatusType = (status) => {
  const types = {
    operating: 'success',
    standby: 'info',
    fault: 'danger',
    offline: 'warning'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    operating: '运行中',
    standby: '待机',
    fault: '故障',
    offline: '离线'
  }
  return labels[status] || status
}

const getEfficiencyClass = (efficiency) => {
  if (efficiency >= 0.95) return 'pv-green'
  if (efficiency >= 0.9) return 'pv-blue'
  return 'pv-red'
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

onMounted(() => {
  loadInverters()
})
</script>

<style scoped>
.inverters-page {
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
