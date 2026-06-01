<template>
  <div>
    <h2 style="margin-bottom: 20px">实时监测数据</h2>
    
    <el-card style="margin-bottom: 20px">
      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px">
        <span>选择设备：</span>
        <el-select v-model="selectedCrane" placeholder="全部设备" clearable style="width: 200px" @change="loadData">
          <el-option v-for="c in cranes" :key="c.id" :label="c.device_code" :value="c.id" />
        </el-select>
        <el-switch :model-value="autoRefresh" active-text="实时模式" inactive-text="手动模式" @update:model-value="toggleAutoRefresh" />
        <span v-if="autoRefresh" style="color: #67c23a">
          <span class="pulse-dot"></span> 实时更新中 ({{ refreshInterval }}s)
        </span>
        <el-button type="primary" @click="loadData">刷新数据</el-button>
      </div>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <div ref="chartRef" style="height: 300px"></div>
        </el-col>
        <el-col :span="12">
          <div ref="chartRef2" style="height: 300px"></div>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>监测数据列表</span>
          <el-button type="primary" size="small" @click="simulateData">模拟上报数据</el-button>
        </div>
      </template>
      <el-table :data="monitorData" border>
        <el-table-column prop="device_code" label="设备编号" width="120" />
        <el-table-column prop="weight" label="重量(t)" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.weight_status)" size="small">{{ row.weight?.toFixed(2) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="range" label="幅度(m)" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.range_status)" size="small">{{ row.range?.toFixed(1) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="height" label="高度(m)" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.height_status)" size="small">{{ row.height?.toFixed(1) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="wind_speed" label="风速(m/s)" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.wind_speed_status)" size="small">{{ row.wind_speed?.toFixed(1) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tilt_angle" label="倾角(°)" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.tilt_status)" size="small">{{ row.tilt_angle?.toFixed(2) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="collision_risk" label="碰撞风险" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.collision_risk" type="danger" size="small">有风险</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="data_source" label="数据来源" width="100" />
        <el-table-column prop="recorded_at" label="记录时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getMonitorData, getCranes, addMonitorData } from '../api'
import { ElMessage } from 'element-plus'

const monitorData = ref([])
const cranes = ref([])
const selectedCrane = ref(null)
const chartRef = ref(null)
const chartRef2 = ref(null)
const autoRefresh = ref(false)
const refreshInterval = ref(3)
let chart = null
let chart2 = null
let refreshTimer = null

const getStatusTag = (status) => {
  const map = { normal: '', warning: 'warning', danger: 'danger', offline: 'info' }
  return map[status] || ''
}

const loadData = async () => {
  const params = { limit: 100 }
  if (selectedCrane.value) params.crane_id = selectedCrane.value
  const res = await getMonitorData(params)
  monitorData.value = res.data
  nextTick(() => renderCharts())
}

const renderCharts = () => {
  if (!chartRef.value || !chartRef2.value) return
  
  if (!chart) chart = echarts.init(chartRef.value)
  if (!chart2) chart2 = echarts.init(chartRef2.value)
  
  const sorted = [...monitorData.value].reverse()
  const times = sorted.map(d => d.recorded_at?.slice(11, 19))
  const weights = sorted.map(d => d.weight)
  const windSpeeds = sorted.map(d => d.wind_speed)
  const heights = sorted.map(d => d.height)
  const ranges = sorted.map(d => d.range)
  
  chart.setOption({
    title: { text: '重量/风速趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['重量(t)', '风速(m/s)'], bottom: 0 },
    xAxis: { type: 'category', data: times },
    yAxis: [{ type: 'value', name: '重量' }, { type: 'value', name: '风速' }],
    series: [
      { name: '重量(t)', type: 'line', data: weights, smooth: true },
      { name: '风速(m/s)', type: 'line', data: windSpeeds, yAxisIndex: 1, smooth: true }
    ]
  })
  
  chart2.setOption({
    title: { text: '高度/幅度趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['高度(m)', '幅度(m)'], bottom: 0 },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value' },
    series: [
      { name: '高度(m)', type: 'line', data: heights, smooth: true },
      { name: '幅度(m)', type: 'line', data: ranges, smooth: true }
    ]
  })
}

const simulateData = async (craneId = null) => {
  const id = craneId || selectedCrane.value
  if (!id) {
    ElMessage.warning('请先选择设备')
    return
  }
  const windSpeed = 3 + Math.random() * 8
  const windStatus = windSpeed > 8 ? 'warning' : windSpeed > 10 ? 'danger' : 'normal'
  const weight = 2 + Math.random() * 4
  const weightStatus = weight > 4.5 ? 'warning' : weight > 5 ? 'danger' : 'normal'
  await addMonitorData({
    crane_id: id,
    weight: weight,
    weight_status: weightStatus,
    range: 25 + Math.random() * 20,
    range_status: 'normal',
    height: 35 + Math.random() * 25,
    height_status: 'normal',
    wind_speed: windSpeed,
    wind_speed_status: windStatus,
    tilt_angle: Math.random() * 2.5,
    tilt_status: 'normal',
    collision_risk: Math.random() > 0.85 ? 1 : 0,
    data_source: 'realtime'
  })
  if (!craneId) {
    ElMessage.success('模拟数据上报成功')
  }
}

const toggleAutoRefresh = (enabled) => {
  autoRefresh.value = enabled
  if (enabled) {
    refreshTimer = setInterval(async () => {
      const onlineCranes = cranes.value.filter(c => c.status !== 'offline')
      for (const crane of onlineCranes) {
        await simulateData(crane.id)
      }
      await loadData()
    }, refreshInterval.value * 1000)
    ElMessage.success('已开启实时监测模式')
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    ElMessage.info('已关闭实时监测模式')
  }
}

onMounted(async () => {
  const craneRes = await getCranes()
  cranes.value = craneRes.data
  await loadData()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.pulse-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  margin-right: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
</style>
