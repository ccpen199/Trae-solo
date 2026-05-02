<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in statistics" :key="stat.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
            <el-icon class="stat-icon" :style="{ color: stat.color }">
              <component :is="stat.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>温度曲线监控</span>
              <el-select v-model="selectedTaskId" placeholder="选择任务" @change="loadTemperatureChart" size="small">
                <el-option v-for="task in activeTasks" :key="task.taskId" :label="`任务${task.taskId}`" :value="task.taskId" />
              </el-select>
            </div>
          </template>
          <div ref="temperatureChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>实时告警</span>
              <el-badge :value="unhandledAlarmCount" :hidden="unhandledAlarmCount === 0">
                <el-button size="small" @click="$router.push('/alarms')">查看全部</el-button>
              </el-badge>
            </div>
          </template>
          <div class="alarm-list">
            <el-scrollbar height="300px">
              <div v-for="alarm in recentAlarms" :key="alarm.alarmId" class="alarm-item" :class="`alarm-${alarm.alarmLevel.toLowerCase()}`">
                <div class="alarm-header">
                  <span class="alarm-type">{{ alarm.alarmType }}</span>
                  <el-tag size="small" :type="getAlarmLevelType(alarm.alarmLevel)">{{ alarm.alarmLevel }}</el-tag>
                </div>
                <div class="alarm-content">
                  <div>温度: {{ alarm.alarmValue }}°C</div>
                  <div>阈值: {{ alarm.thresholdValue }}°C</div>
                </div>
                <div class="alarm-time">{{ formatTime(alarm.alarmTime) }}</div>
              </div>
              <el-empty v-if="recentAlarms.length === 0" description="暂无告警" />
            </el-scrollbar>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="task-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>进行中的任务</span>
              <el-button type="primary" size="small" @click="$router.push('/tasks')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="activeTasks" style="width: 100%">
            <el-table-column prop="taskId" label="任务ID" width="80" />
            <el-table-column prop="goodsInfo.name" label="货品名称" />
            <el-table-column prop="taskStatus" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.taskStatus)">{{ getStatusName(row.taskStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="温度区间">
              <template #default="{ row }">
                {{ row.temperatureRange?.min }}°C ~ {{ row.temperatureRange?.max }}°C
              </template>
            </el-table-column>
            <el-table-column label="当前位置" prop="location" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="$router.push(`/tasks/${row.taskId}`)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const statistics = ref([
  { title: '总任务数', value: 0, icon: 'Document', color: '#409EFF' },
  { title: '进行中', value: 0, icon: 'Loading', color: '#67C23A' },
  { title: '待处理告警', value: 0, icon: 'Bell', color: '#F56C6C' },
  { title: '今日验收', value: 0, icon: 'Finished', color: '#E6A23C' }
])

const activeTasks = ref([])
const recentAlarms = ref([])
const selectedTaskId = ref(null)
const temperatureChartRef = ref(null)
let temperatureChart = null

const unhandledAlarmCount = computed(() => {
  return recentAlarms.value.filter(a => a.handleStatus === 'UNHANDLED').length
})

const loadStatistics = async () => {
  try {
    const response = await axios.get('/tasks', { params: { status: 'IN_TRANSIT' } })
    const allTasksResponse = await axios.get('/tasks')
    const inTransitTasks = response.data || []
    const allTasks = allTasksResponse.data || []
    
    statistics.value[0].value = allTasks.length
    statistics.value[1].value = inTransitTasks.length
    statistics.value[2].value = recentAlarms.value.filter(a => a.handleStatus === 'UNHANDLED').length
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadActiveTasks = async () => {
  try {
    let response
    if (userStore.userRole === 'shipper') {
      response = await axios.get('/tasks', { params: { shipperId: userStore.userInfo.userId } })
    } else if (userStore.userRole === 'driver') {
      response = await axios.get('/tasks', { params: { driverId: userStore.userInfo.userId } })
    } else {
      response = await axios.get('/tasks', { params: { status: 'IN_TRANSIT' } })
    }
    activeTasks.value = (response.data || []).filter(t => t.taskStatus === 'IN_TRANSIT' || t.taskStatus === 'ASSIGNED')
    
    if (activeTasks.value.length > 0 && !selectedTaskId.value) {
      selectedTaskId.value = activeTasks.value[0].taskId
      loadTemperatureChart()
    }
  } catch (error) {
    console.error('加载任务列表失败:', error)
  }
}

const loadAlarms = async () => {
  try {
    const allAlarms = []
    for (const task of activeTasks.value) {
      const response = await axios.get(`/alarms/${task.taskId}`)
      allAlarms.push(...(response.data || []))
    }
    recentAlarms.value = allAlarms.sort((a, b) => new Date(b.alarmTime) - new Date(a.alarmTime)).slice(0, 10)
    statistics.value[2].value = recentAlarms.value.filter(a => a.handleStatus === 'UNHANDLED').length
  } catch (error) {
    console.error('加载告警列表失败:', error)
  }
}

const loadTemperatureChart = async () => {
  if (!selectedTaskId.value) return
  
  try {
    const response = await axios.get(`/temperature/${selectedTaskId.value}`)
    const data = response.data || []
    
    const times = data.map(d => dayjs(d.collectTime).format('HH:mm'))
    const temperatures = data.map(d => d.temperature)
    
    if (!temperatureChart) {
      temperatureChart = echarts.init(temperatureChartRef.value)
    }
    
    const task = activeTasks.value.find(t => t.taskId === selectedTaskId.value)
    const minTemp = task?.temperatureRange?.min || 0
    const maxTemp = task?.temperatureRange?.max || 10
    
    temperatureChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['温度', '下限', '上限']
      },
      xAxis: {
        type: 'category',
        data: times
      },
      yAxis: {
        type: 'value',
        name: '温度 (°C)',
        min: minTemp - 5,
        max: maxTemp + 5
      },
      series: [
        {
          name: '温度',
          type: 'line',
          data: temperatures,
          smooth: true,
          lineStyle: { width: 2 },
          itemStyle: { color: '#409EFF' }
        },
        {
          name: '下限',
          type: 'line',
          data: Array(times.length).fill(minTemp),
          lineStyle: { width: 1, type: 'dashed' },
          itemStyle: { color: '#67C23A' }
        },
        {
          name: '上限',
          type: 'line',
          data: Array(times.length).fill(maxTemp),
          lineStyle: { width: 1, type: 'dashed' },
          itemStyle: { color: '#F56C6C' }
        }
      ]
    })
  } catch (error) {
    console.error('加载温度数据失败:', error)
  }
}

const getStatusType = (status) => {
  const types = {
    'PENDING': 'info',
    'ASSIGNED': 'warning',
    'IN_TRANSIT': 'primary',
    'COMPLETED': 'success',
    'CANCELLED': 'danger'
  }
  return types[status] || 'info'
}

const getStatusName = (status) => {
  const names = {
    'PENDING': '待分配',
    'ASSIGNED': '已分配',
    'IN_TRANSIT': '运输中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  }
  return names[status] || status
}

const getAlarmLevelType = (level) => {
  const types = {
    'LEVEL1': 'warning',
    'LEVEL2': 'danger',
    'LEVEL3': 'danger'
  }
  return types[level] || 'info'
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

let refreshInterval = null

onMounted(() => {
  loadActiveTasks().then(() => {
    loadAlarms()
    loadStatistics()
  })
  
  refreshInterval = setInterval(() => {
    loadTemperatureChart()
    loadAlarms()
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
.dashboard {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-icon {
  font-size: 50px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.alarm-list {
  padding: 10px 0;
}

.alarm-item {
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
  border-left: 4px solid;
}

.alarm-item.alarm-level1 {
  border-left-color: #E6A23C;
}

.alarm-item.alarm-level2,
.alarm-item.alarm-level3 {
  border-left-color: #F56C6C;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alarm-type {
  font-weight: bold;
  color: #303133;
}

.alarm-content {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}

.alarm-time {
  font-size: 12px;
  color: #909399;
}

.task-row {
  margin-bottom: 20px;
}
</style>
