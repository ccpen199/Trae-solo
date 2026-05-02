<template>
  <div class="quality-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>质控分析报表</span>
          <el-button type="primary" @click="downloadQualityReport">导出报表</el-button>
        </div>
      </template>
      
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon><SuccessFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.completedTasks }}</div>
              <div class="stat-label">已完成任务</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalAlarms }}</div>
              <div class="stat-label">告警总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.alarmRate }}%</div>
              <div class="stat-label">告警率</div>
            </div>
          </div>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="chart-row">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>任务状态分布</span>
            </template>
            <div ref="taskStatusChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>告警类型分布</span>
            </template>
            <div ref="alarmTypeChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="chart-row">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>温度合规率</span>
            </template>
            <div ref="temperatureComplianceChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>告警处理率</span>
            </template>
            <div ref="alarmHandlingChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-divider content-position="left">详细数据</el-divider>
      
      <el-table :data="taskList" v-loading="loading" style="width: 100%">
        <el-table-column prop="taskId" label="任务ID" width="80" />
        <el-table-column label="货品信息">
          <template #default="{ row }">
            <div>{{ row.goodsInfo?.name || '-' }}</div>
            <div class="sub-text">数量: {{ row.goodsInfo?.quantity || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="taskStatus" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.taskStatus)">{{ getStatusName(row.taskStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="温度区间">
          <template #default="{ row }">
            {{ row.temperatureRange?.min || '-' }}°C ~ {{ row.temperatureRange?.max || '-' }}°C
          </template>
        </el-table-column>
        <el-table-column label="告警次数" width="100">
          <template #default="{ row }">
            <span :class="getAlarmCountClass(row.alarmCount)">{{ row.alarmCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="处理率" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.handleRate || 0" :color="getProgressColor(row.handleRate)" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" :formatter="formatDate" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const loading = ref(false)
const taskList = ref([])

const statistics = reactive({
  totalTasks: 0,
  completedTasks: 0,
  totalAlarms: 0,
  alarmRate: 0,
  handledAlarms: 0,
  handleRate: 0
})

const taskStatusChartRef = ref(null)
const alarmTypeChartRef = ref(null)
const temperatureComplianceChartRef = ref(null)
const alarmHandlingChartRef = ref(null)

let taskStatusChart = null
let alarmTypeChart = null
let temperatureComplianceChart = null
let alarmHandlingChart = null

const loadQualityData = async () => {
  loading.value = true
  try {
    const response = await axios.get('/tasks')
    const allTasks = response.data || []
    
    statistics.totalTasks = allTasks.length
    statistics.completedTasks = allTasks.filter(t => t.taskStatus === 'COMPLETED').length
    
    let allAlarms = []
    let alarmTypeData = {}
    let totalAlarmsCount = 0
    let handledAlarmsCount = 0
    
    for (const task of allTasks) {
      try {
        const alarmResponse = await axios.get(`/alarms/${task.taskId}`)
        const alarms = alarmResponse.data || []
        allAlarms.push(...alarms)
        
        for (const alarm of alarms) {
          totalAlarmsCount++
          if (alarm.handleStatus === 'HANDLED') {
            handledAlarmsCount++
          }
          if (!alarmTypeData[alarm.alarmType]) {
            alarmTypeData[alarm.alarmType] = 0
          }
          alarmTypeData[alarm.alarmType]++
        }
      } catch (error) {
        console.error(`加载任务${task.taskId}的告警失败:`, error)
      }
    }
    
    statistics.totalAlarms = totalAlarmsCount
    statistics.handledAlarms = handledAlarmsCount
    statistics.alarmRate = statistics.totalTasks > 0 
      ? ((totalAlarmsCount / statistics.totalTasks) * 100).toFixed(1) 
      : 0
    statistics.handleRate = totalAlarmsCount > 0 
      ? ((handledAlarmsCount / totalAlarmsCount) * 100).toFixed(1) 
      : 0
    
    taskList.value = allTasks.map(task => {
      const taskAlarms = allAlarms.filter(a => a.taskId === task.taskId || a.task?.taskId === task.taskId)
      const handled = taskAlarms.filter(a => a.handleStatus === 'HANDLED').length
      return {
        ...task,
        alarmCount: taskAlarms.length,
        handleRate: taskAlarms.length > 0 ? (handled / taskAlarms.length) * 100 : 100
      }
    })
    
    renderTaskStatusChart(allTasks)
    renderAlarmTypeChart(alarmTypeData)
    renderTemperatureComplianceChart()
    renderAlarmHandlingChart()
  } catch (error) {
    ElMessage.error('加载质控数据失败')
  } finally {
    loading.value = false
  }
}

const renderTaskStatusChart = (tasks) => {
  if (!taskStatusChartRef.value) return
  
  if (!taskStatusChart) {
    taskStatusChart = echarts.init(taskStatusChartRef.value)
  }
  
  const statusData = {}
  tasks.forEach(task => {
    const status = task.taskStatus || 'UNKNOWN'
    statusData[status] = (statusData[status] || 0) + 1
  })
  
  const chartData = Object.keys(statusData).map(key => ({
    name: getStatusName(key),
    value: statusData[key]
  }))
  
  taskStatusChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: '60%',
      data: chartData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })
}

const renderAlarmTypeChart = (alarmTypeData) => {
  if (!alarmTypeChartRef.value) return
  
  if (!alarmTypeChart) {
    alarmTypeChart = echarts.init(alarmTypeChartRef.value)
  }
  
  const chartData = Object.keys(alarmTypeData).map(key => ({
    name: key,
    value: alarmTypeData[key]
  }))
  
  alarmTypeChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: chartData
    }]
  })
}

const renderTemperatureComplianceChart = () => {
  if (!temperatureComplianceChartRef.value) return
  
  if (!temperatureComplianceChart) {
    temperatureComplianceChart = echarts.init(temperatureComplianceChartRef.value)
  }
  
  const compliantTasks = taskList.value.filter(task => {
    return task.alarmCount === 0 || task.alarmCount === undefined
  }).length
  const nonCompliantTasks = taskList.value.length - compliantTasks
  
  temperatureComplianceChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { name: '合规', value: compliantTasks, itemStyle: { color: '#67C23A' } },
        { name: '不合规', value: nonCompliantTasks, itemStyle: { color: '#F56C6C' } }
      ]
    }]
  })
}

const renderAlarmHandlingChart = () => {
  if (!alarmHandlingChartRef.value) return
  
  if (!alarmHandlingChart) {
    alarmHandlingChart = echarts.init(alarmHandlingChartRef.value)
  }
  
  alarmHandlingChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { name: '已处理', value: statistics.handledAlarms, itemStyle: { color: '#67C23A' } },
        { name: '未处理', value: statistics.totalAlarms - statistics.handledAlarms, itemStyle: { color: '#F56C6C' } }
      ]
    }]
  })
}

const downloadQualityReport = async () => {
  try {
    const response = await axios.get('/reports/quality', {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `质控分析报表_${dayjs().format('YYYYMMDDHHmmss')}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('报表下载成功')
  } catch (error) {
    ElMessage.error('报表下载失败')
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
    'CANCELLED': '已取消',
    'UNKNOWN': '未知'
  }
  return names[status] || status
}

const getAlarmCountClass = (count) => {
  if (count === 0) return 'alarm-zero'
  if (count <= 3) return 'alarm-low'
  if (count <= 5) return 'alarm-medium'
  return 'alarm-high'
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 50) return '#E6A23C'
  return '#F56C6C'
}

const formatDate = (row) => {
  return row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm') : '-'
}

let refreshInterval = null

onMounted(() => {
  loadQualityData()
  
  refreshInterval = setInterval(() => {
    loadQualityData()
  }, 60000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (taskStatusChart) taskStatusChart.dispose()
  if (alarmTypeChart) alarmTypeChart.dispose()
  if (temperatureComplianceChart) temperatureComplianceChart.dispose()
  if (alarmHandlingChart) alarmHandlingChart.dispose()
})
</script>

<style scoped>
.quality-page {
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

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 28px;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 350px;
}

.chart-container {
  height: 280px;
}

.sub-text {
  font-size: 12px;
  color: #909399;
}

.alarm-zero {
  color: #67C23A;
}

.alarm-low {
  color: #E6A23C;
}

.alarm-medium {
  color: #F56C6C;
}

.alarm-high {
  color: #909399;
}
</style>
