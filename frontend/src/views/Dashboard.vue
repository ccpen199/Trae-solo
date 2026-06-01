<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPoints }}</div>
              <div class="stat-label">监测点位</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingAlerts }}</div>
              <div class="stat-label">待处理预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completedTasks }}</div>
              <div class="stat-label">已完成整改</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon purple">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalRecords }}</div>
              <div class="stat-label">数据记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="data-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>实时监测数据</span>
              <el-button type="primary" size="small" @click="refreshData">刷新</el-button>
            </div>
          </template>
          <el-table :data="latestData" stripe v-loading="loading">
            <el-table-column prop="point_name" label="点位名称" />
            <el-table-column prop="device_code" label="设备编号" />
            <el-table-column prop="pm25" label="PM2.5">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.pm25 > row.pm25_threshold }">{{ row.pm25 || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="pm10" label="PM10">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.pm10 > row.pm10_threshold }">{{ row.pm10 || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="noise" label="噪声(dB)">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.noise > row.noise_threshold }">{{ row.noise || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="wind_speed" label="风速(m/s)" />
            <el-table-column prop="temperature" label="温度(℃)" />
            <el-table-column prop="humidity" label="湿度(%)" />
            <el-table-column prop="collected_at" label="采集时间" />
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag v-if="row.is_anomaly" type="danger">异常</el-tag>
                <el-tag v-else type="success">正常</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>趋势分析</template>
          <div class="chart-controls">
            <el-select v-model="selectedPoint" placeholder="选择点位" @change="refreshChart">
              <el-option v-for="point in points" :key="point.id" :label="point.name" :value="point.id" />
            </el-select>
            <el-select v-model="selectedParam" placeholder="选择参数" @change="refreshChart">
              <el-option label="PM2.5" value="pm25" />
              <el-option label="PM10" value="pm10" />
              <el-option label="噪声" value="noise" />
              <el-option label="温度" value="temperature" />
              <el-option label="湿度" value="humidity" />
            </el-select>
          </div>
          <div ref="chartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>异常记录</template>
          <el-table :data="anomalyData" stripe size="small">
            <el-table-column prop="point_name" label="点位" width="100" />
            <el-table-column prop="parameter" label="参数" width="80">
              <template #default="{ row }">{{ paramLabels[row.parameter] }}</template>
            </el-table-column>
            <el-table-column prop="value" label="数值" width="80" />
            <el-table-column prop="threshold" label="阈值" width="80" />
            <el-table-column prop="collected_at" label="时间" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { dataApi, pointsApi, alertsApi } from '../api'
import * as echarts from 'echarts'

const loading = ref(false)
const latestData = ref([])
const points = ref([])
const anomalyData = ref([])
const selectedPoint = ref('')
const selectedParam = ref('pm25')
const chartRef = ref(null)
let chart = null

const paramLabels = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  noise: '噪声',
  temperature: '温度',
  humidity: '湿度'
}

const stats = ref({
  totalPoints: 0,
  pendingAlerts: 0,
  completedTasks: 0,
  totalRecords: 0
})

const refreshData = async () => {
  loading.value = true
  try {
    const [latestRes, pointsRes, alertsRes, anomalyRes] = await Promise.all([
      dataApi.latest(),
      pointsApi.list({ pageSize: 100 }),
      alertsApi.list({ status: 'pending', pageSize: 1 }),
      dataApi.list({ pageSize: 10 })
    ])
    
    latestData.value = latestRes.data || []
    points.value = pointsRes.data.data || []
    stats.value.totalPoints = pointsRes.data.total || 0
    stats.value.pendingAlerts = alertsRes.data.total || 0
    anomalyData.value = (anomalyRes.data.data || []).filter(d => d.is_anomaly).slice(0, 5)
    stats.value.totalRecords = anomalyRes.data.total || 0
    
    if (points.value.length > 0 && !selectedPoint.value) {
      selectedPoint.value = points.value[0].id
      refreshChart()
    }
  } finally {
    loading.value = false
  }
}

const refreshChart = async () => {
  if (!selectedPoint.value || !chartRef.value) return
  
  const res = await dataApi.trend({
    point_id: selectedPoint.value,
    parameter: selectedParam.value,
    hours: 24
  })
  
  const data = res.data || []
  
  await nextTick()
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time_bucket.slice(11, 16))
    },
    yAxis: { type: 'value' },
    series: [{
      name: paramLabels[selectedParam.value] || '数值',
      type: 'line',
      smooth: true,
      data: data.map(d => d.avg_value)
    }]
  })
}

onMounted(() => {
  refreshData()
  setInterval(refreshData, 30000)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  margin-bottom: 10px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.blue { background: #409EFF; }
.stat-icon.orange { background: #E6A23C; }
.stat-icon.green { background: #67C23A; }
.stat-icon.purple { background: #909399; }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}

.chart-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.chart {
  height: 300px;
}
</style>
