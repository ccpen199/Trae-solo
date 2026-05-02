<template>
  <div class="map-page">
    <el-card class="map-container-card">
      <template #header>
        <div class="card-header">
          <span>电站地图分布</span>
          <div class="header-right">
            <el-tag type="success" effect="plain">运行中</el-tag>
            <el-tag type="warning" effect="plain">需关注</el-tag>
            <el-tag type="danger" effect="plain">异常</el-tag>
          </div>
        </div>
      </template>
      
      <div class="map-content">
        <div class="map-grid">
          <div
            v-for="station in stations"
            :key="station.id"
            class="map-station-card"
            @click="selectStation(station)"
          >
            <div class="station-header">
              <span class="station-name">{{ station.name }}</span>
              <el-tag :type="getStatusType(station.health_level)" size="small">
                {{ getHealthLabel(station.health_level) }}
              </el-tag>
            </div>
            
            <div class="station-body">
              <div class="station-metric">
                <span class="label">当前功率</span>
                <span class="value">{{ (station.current_power_kw || 0).toFixed(1) }} kW</span>
              </div>
              <div class="station-metric">
                <span class="label">今日发电</span>
                <span class="value">{{ (station.today_generation_kwh || 0).toFixed(0) }} kWh</span>
              </div>
              <div class="station-metric">
                <span class="label">PR 值</span>
                <span class="value" :class="{ 'pv-red': (station.current_pr || 0) < 0.75 }">
                  {{ ((station.current_pr || 0) * 100).toFixed(1) }}%
                </span>
              </div>
              <div class="station-metric">
                <span class="label">装机容量</span>
                <span class="value">{{ station.installed_capacity_kw || 0 }} kWp</span>
              </div>
            </div>
            
            <div class="station-footer">
              <div class="location">
                <el-icon><Location /></el-icon>
                <span>{{ station.province }} {{ station.city }}</span>
              </div>
              <div class="active-alerts" v-if="station.active_alert_count > 0">
                <el-badge :value="station.active_alert_count" type="warning" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="selectedStation?.name"
      direction="right"
      size="40%"
    >
      <div v-if="selectedStation" class="station-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="电站状态">
            <el-tag :type="getStatusType(selectedStation.health_level)">
              {{ getHealthLabel(selectedStation.health_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="位置">
            {{ selectedStation.province }} {{ selectedStation.city }}
          </el-descriptions-item>
          <el-descriptions-item label="装机容量">
            {{ selectedStation.installed_capacity_kw }} kWp
          </el-descriptions-item>
          <el-descriptions-item label="逆变器数量">
            {{ selectedStation.inverter_count || 0 }} 台
          </el-descriptions-item>
          <el-descriptions-item label="当前功率" :span="2">
            <span style="font-size: 24px; font-weight: bold; color: #67c23a;">
              {{ (selectedStation.current_power_kw || 0).toFixed(1) }} kW
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="今日发电量">
            {{ (selectedStation.today_generation_kwh || 0).toFixed(2) }} kWh
          </el-descriptions-item>
          <el-descriptions-item label="今日收益">
            ¥{{ (selectedStation.today_revenue || 0).toFixed(2) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前 PR" :span="2">
            <el-progress 
              :percentage="((selectedStation.current_pr || 0) * 100).toFixed(0)" 
              :status="selectedStation.current_pr >= 0.8 ? 'success' : selectedStation.current_pr >= 0.75 ? '' : 'exception'"
            />
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">设备状态</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic title="在线设备" :value="selectedStation.inverter_count || 0">
              <template #suffix>台</template>
            </el-statistic>
          </el-col>
          <el-col :span="8">
            <el-statistic title="运行中" value="0" value-style="color: #67c23a;">
              <template #suffix>台</template>
            </el-statistic>
          </el-col>
          <el-col :span="8">
            <el-statistic title="故障" value="0" value-style="color: #f56c6c;">
              <template #suffix>台</template>
            </el-statistic>
          </el-col>
        </el-row>

        <el-divider content-position="left">近7日发电趋势</el-divider>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '@/utils/api'

const loading = ref(false)
const stations = ref([])
const drawerVisible = ref(false)
const selectedStation = ref(null)
const trendChartRef = ref(null)

let trendChart = null

const loadStations = async () => {
  loading.value = true
  try {
    const result = await api.get('/stations/list')
    stations.value = result.data || result
  } catch (error) {
    console.error('Load stations error:', error)
    stations.value = []
  } finally {
    loading.value = false
  }
}

const getStatusType = (level) => {
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

const selectStation = (station) => {
  selectedStation.value = station
  drawerVisible.value = true
  nextTick(() => {
    renderTrendChart()
  })
}

const renderTrendChart = () => {
  if (!trendChartRef.value) return
  
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartRef.value)
  
  const dates = []
  const generation = []
  const prValues = []
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString())
    generation.push(Math.floor(Math.random() * 5000 + 2000))
    prValues.push(Math.random() * 0.2 + 0.7)
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['发电量', 'PR']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '发电量 (kWh)'
      },
      {
        type: 'value',
        name: 'PR',
        min: 0,
        max: 1
      }
    ],
    series: [
      {
        name: '发电量',
        type: 'bar',
        data: generation,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      },
      {
        name: 'PR',
        type: 'line',
        yAxisIndex: 1,
        data: prValues,
        smooth: true,
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }

  trendChart.setOption(option)
}

onMounted(() => {
  loadStations()
})
</script>

<style scoped>
.map-page {
  height: 100%;
}

.map-container-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 12px;
}

.map-content {
  height: calc(100vh - 200px);
  overflow-y: auto;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.map-station-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s;
}

.map-station-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.station-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.station-name {
  font-weight: 600;
  font-size: 15px;
}

.station-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.station-metric {
  display: flex;
  flex-direction: column;
}

.station-metric .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.station-metric .value {
  font-weight: 600;
  color: #303133;
}

.station-metric .value.pv-red {
  color: #f56c6c;
}

.station-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.station-detail {
  padding: 10px;
}

.chart-container {
  height: 200px;
  width: 100%;
}
</style>
