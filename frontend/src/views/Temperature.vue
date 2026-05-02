<template>
  <div class="temperature-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>温度监控</span>
          <el-select v-model="selectedTaskId" placeholder="选择任务" @change="loadTemperatureData" style="width: 200px;">
            <el-option v-for="task in taskList" :key="task.taskId" :label="`任务${task.taskId} - ${task.goodsInfo?.name}`" :value="task.taskId" />
          </el-select>
        </div>
      </template>
      
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">当前温度</div>
            <div class="stat-value" :class="getTemperatureClass(currentTemp)">{{ currentTemp }}°C</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">最低温度</div>
            <div class="stat-value">{{ minTemp }}°C</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">最高温度</div>
            <div class="stat-value">{{ maxTemp }}°C</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">平均温度</div>
            <div class="stat-value">{{ avgTemp }}°C</div>
          </div>
        </el-col>
      </el-row>
      
      <div ref="temperatureChartRef" class="chart-container"></div>
      
      <el-divider content-position="left">历史数据</el-divider>
      
      <el-table :data="temperatureData" style="width: 100%" v-loading="loading">
        <el-table-column prop="collectTime" label="采集时间" :formatter="formatDateTime" width="180" />
        <el-table-column prop="temperature" label="温度 (°C)" width="120" />
        <el-table-column prop="humidity" label="湿度 (%)" width="120" />
        <el-table-column label="位置信息">
          <template #default="{ row }">
            {{ row.location?.address || `${row.location?.lat}, ${row.location?.lng}` || '-' }}
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: right"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const taskList = ref([])
const selectedTaskId = ref(null)
const temperatureData = ref([])

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const temperatureChartRef = ref(null)
let temperatureChart = null

const currentTemp = ref(0)
const minTemp = ref(0)
const maxTemp = ref(0)
const avgTemp = ref(0)

const loadTasks = async () => {
  try {
    const response = await axios.get('/tasks', { params: { status: 'IN_TRANSIT' } })
    taskList.value = response.data || []
    
    if (taskList.value.length > 0 && !selectedTaskId.value) {
      selectedTaskId.value = taskList.value[0].taskId
      loadTemperatureData()
    }
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  }
}

const loadTemperatureData = async () => {
  if (!selectedTaskId.value) return
  
  loading.value = true
  try {
    const response = await axios.get(`/temperature/${selectedTaskId.value}`)
    temperatureData.value = response.data || []
    
    if (temperatureData.value.length > 0) {
      const temps = temperatureData.value.map(d => d.temperature)
      currentTemp.value = temps[0] || 0
      minTemp.value = Math.min(...temps)
      maxTemp.value = Math.max(...temps)
      avgTemp.value = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
      pagination.total = temperatureData.value.length
    } else {
      currentTemp.value = 0
      minTemp.value = 0
      maxTemp.value = 0
      avgTemp.value = 0
    }
    
    renderChart()
  } catch (error) {
    ElMessage.error('加载温度数据失败')
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  if (!temperatureChartRef.value) return
  
  if (!temperatureChart) {
    temperatureChart = echarts.init(temperatureChartRef.value)
  }
  
  const times = temperatureData.value.map(d => dayjs(d.collectTime).format('HH:mm'))
  const temperatures = temperatureData.value.map(d => d.temperature)
  const task = taskList.value.find(t => t.taskId === selectedTaskId.value)
  const minLimit = task?.temperatureRange?.min || 0
  const maxLimit = task?.temperatureRange?.max || 10
  
  temperatureChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度', '下限', '上限'] },
    xAxis: { type: 'category', data: times, boundaryGap: false },
    yAxis: { type: 'value', name: '温度 (°C)' },
    series: [
      {
        name: '温度',
        type: 'line',
        data: temperatures,
        smooth: true,
        areaStyle: { opacity: 0.3 },
        lineStyle: { width: 2 },
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '下限',
        type: 'line',
        data: Array(times.length).fill(minLimit),
        lineStyle: { width: 1, type: 'dashed' },
        itemStyle: { color: '#67C23A' },
        symbol: 'none'
      },
      {
        name: '上限',
        type: 'line',
        data: Array(times.length).fill(maxLimit),
        lineStyle: { width: 1, type: 'dashed' },
        itemStyle: { color: '#F56C6C' },
        symbol: 'none'
      }
    ]
  })
}

const getTemperatureClass = (temp) => {
  const task = taskList.value.find(t => t.taskId === selectedTaskId.value)
  if (!task) return ''
  
  const minLimit = task.temperatureRange?.min || 0
  const maxLimit = task.temperatureRange?.max || 10
  
  if (temp < minLimit || temp > maxLimit) {
    return 'temp-danger'
  }
  return 'temp-normal'
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadTemperatureData()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadTemperatureData()
}

const formatDateTime = (row) => {
  return row.collectTime ? dayjs(row.collectTime).format('YYYY-MM-DD HH:mm:ss') : '-'
}

let refreshInterval = null

onMounted(() => {
  loadTasks()
  
  refreshInterval = setInterval(() => {
    if (selectedTaskId.value) {
      loadTemperatureData()
    }
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (temperatureChart) {
    temperatureChart.dispose()
  }
})
</script>

<style scoped>
.temperature-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-value.temp-normal {
  color: #67C23A;
}

.stat-value.temp-danger {
  color: #F56C6C;
}

.chart-container {
  height: 400px;
  margin-bottom: 20px;
}
</style>
