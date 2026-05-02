<template>
  <div class="task-detail-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>任务详情 - #{{ taskId }}</span>
          <el-tag :type="getStatusType(taskDetail.taskStatus)">{{ getStatusName(taskDetail.taskStatus) }}</el-tag>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务ID">{{ taskDetail.taskId }}</el-descriptions-item>
            <el-descriptions-item label="货主">{{ taskDetail.shipper?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="承运商">{{ taskDetail.carrier?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="司机">{{ taskDetail.driver?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(taskDetail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(taskDetail.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="温度区间" :span="2">
              {{ taskDetail.temperatureRange?.min }}°C ~ {{ taskDetail.temperatureRange?.max }}°C
            </el-descriptions-item>
            <el-descriptions-item label="时效要求">{{ taskDetail.timeLimit || '-' }}</el-descriptions-item>
            <el-descriptions-item label="起始位置">{{ taskDetail.startLocation?.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="目的地" :span="2">{{ taskDetail.endLocation?.address || '-' }}</el-descriptions-item>
          </el-descriptions>
          
          <el-divider content-position="left">货品信息</el-divider>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="货品名称">{{ taskDetail.goodsInfo?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="货品品类">{{ getCategoryName(taskDetail.goodsInfo?.category) }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ taskDetail.goodsInfo?.quantity || '-' }}</el-descriptions-item>
            <el-descriptions-item label="重量">{{ taskDetail.goodsInfo?.weight || '-' }} kg</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <el-tab-pane label="温度曲线" name="temperature">
          <div ref="temperatureChartRef" class="chart-container"></div>
          <el-empty v-if="temperatureData.length === 0" description="暂无温度数据" />
        </el-tab-pane>
        
        <el-tab-pane label="告警记录" name="alarms">
          <el-table :data="alarmList" style="width: 100%">
            <el-table-column prop="alarmTime" label="告警时间" :formatter="formatDateTime" />
            <el-table-column prop="alarmType" label="告警类型" />
            <el-table-column prop="alarmLevel" label="告警级别">
              <template #default="{ row }">
                <el-tag :type="getAlarmLevelType(row.alarmLevel)" size="small">{{ row.alarmLevel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="alarmValue" label="告警值">
              <template #default="{ row }"> {{ row.alarmValue }}°C </template>
            </el-table-column>
            <el-table-column prop="thresholdValue" label="阈值">
              <template #default="{ row }"> {{ row.thresholdValue }}°C </template>
            </el-table-column>
            <el-table-column prop="handleStatus" label="处理状态">
              <template #default="{ row }">
                <el-tag :type="row.handleStatus === 'HANDLED' ? 'success' : 'danger'" size="small">
                  {{ row.handleStatus === 'HANDLED' ? '已处理' : '未处理' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column v-if="canHandleAlarm" label="操作" width="100">
              <template #default="{ row }">
                <el-button v-if="row.handleStatus === 'UNHANDLED'" type="primary" size="small" @click="handleAlarm(row)">
                  处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="验收信息" name="inspection">
          <div v-if="inspectionData">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="验收时间">{{ formatDateTime(inspectionData) }}</el-descriptions-item>
              <el-descriptions-item label="验收结果">
                <el-tag :type="inspectionData.inspectionResult === 'PASSED' ? 'success' : 'danger'">
                  {{ inspectionData.inspectionResult === 'PASSED' ? '合格' : '不合格' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="货主签名">{{ inspectionData.shipperSignature || '-' }}</el-descriptions-item>
              <el-descriptions-item label="司机签名">{{ inspectionData.driverSignature || '-' }}</el-descriptions-item>
              <el-descriptions-item label="问题描述" :span="2">{{ inspectionData.problemDescription || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else description="暂无验收信息" />
          
          <div v-if="canCreateInspection && !inspectionData" style="margin-top: 20px;">
            <el-button type="primary" @click="showInspectionDialog = true">创建验收记录</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <el-dialog v-model="showAlarmDialog" title="处理告警" width="500px">
      <el-form :model="alarmForm" :rules="alarmRules" ref="alarmFormRef" label-width="100px">
        <el-form-item label="处理措施" prop="handleMethod">
          <el-input v-model="alarmForm.handleMethod" type="textarea" :rows="4" placeholder="请输入处理措施" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAlarmDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAlarmHandle">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showInspectionDialog" title="创建验收记录" width="500px">
      <el-form :model="inspectionForm" :rules="inspectionRules" ref="inspectionFormRef" label-width="100px">
        <el-form-item label="验收结果" prop="inspectionResult">
          <el-radio-group v-model="inspectionForm.inspectionResult">
            <el-radio label="PASSED">合格</el-radio>
            <el-radio label="FAILED">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="问题描述" prop="problemDescription" v-if="inspectionForm.inspectionResult === 'FAILED'">
          <el-input v-model="inspectionForm.problemDescription" type="textarea" :rows="3" placeholder="请输入问题描述" />
        </el-form-item>
        <el-form-item label="货主签名" prop="shipperSignature">
          <el-input v-model="inspectionForm.shipperSignature" placeholder="请输入货主签名" />
        </el-form-item>
        <el-form-item label="司机签名" prop="driverSignature">
          <el-input v-model="inspectionForm.driverSignature" placeholder="请输入司机签名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInspectionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitInspection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()

const taskId = computed(() => parseInt(route.params.id))
const loading = ref(false)
const activeTab = ref('basic')
const taskDetail = ref({})
const temperatureData = ref([])
const alarmList = ref([])
const inspectionData = ref(null)

const showAlarmDialog = ref(false)
const showInspectionDialog = ref(false)
const alarmFormRef = ref(null)
const inspectionFormRef = ref(null)

const alarmForm = reactive({
  alarmId: null,
  handlerId: null,
  handleMethod: ''
})

const alarmRules = {
  handleMethod: [{ required: true, message: '请输入处理措施', trigger: 'blur' }]
}

const inspectionForm = reactive({
  inspectionResult: 'PASSED',
  problemDescription: '',
  shipperSignature: '',
  driverSignature: ''
})

const inspectionRules = {
  inspectionResult: [{ required: true, message: '请选择验收结果', trigger: 'change' }],
  shipperSignature: [{ required: true, message: '请输入货主签名', trigger: 'blur' }],
  driverSignature: [{ required: true, message: '请输入司机签名', trigger: 'blur' }]
}

const temperatureChartRef = ref(null)
let temperatureChart = null

const canHandleAlarm = computed(() => {
  return ['driver', 'quality_control'].includes(userStore.userRole)
})

const canCreateInspection = computed(() => {
  return ['driver', 'shipper'].includes(userStore.userRole) && taskDetail.value.taskStatus === 'IN_TRANSIT'
})

const loadTaskDetail = async () => {
  loading.value = true
  try {
    const response = await axios.get(`/tasks/${taskId.value}`)
    taskDetail.value = response.data || {}
  } catch (error) {
    ElMessage.error('加载任务详情失败')
  } finally {
    loading.value = false
  }
}

const loadTemperatureData = async () => {
  try {
    const response = await axios.get(`/temperature/${taskId.value}`)
    temperatureData.value = response.data || []
    renderTemperatureChart()
  } catch (error) {
    console.error('加载温度数据失败:', error)
  }
}

const loadAlarmList = async () => {
  try {
    const response = await axios.get(`/alarms/${taskId.value}`)
    alarmList.value = response.data || []
  } catch (error) {
    console.error('加载告警列表失败:', error)
  }
}

const loadInspectionData = async () => {
  try {
    const response = await axios.get(`/inspections/${taskId.value}`)
    if (response.data) {
      inspectionData.value = response.data
    }
  } catch (error) {
    console.error('加载验收信息失败:', error)
  }
}

const renderTemperatureChart = () => {
  if (!temperatureChartRef.value || temperatureData.value.length === 0) return
  
  if (!temperatureChart) {
    temperatureChart = echarts.init(temperatureChartRef.value)
  }
  
  const times = temperatureData.value.map(d => dayjs(d.collectTime).format('HH:mm'))
  const temperatures = temperatureData.value.map(d => d.temperature)
  const minTemp = taskDetail.value.temperatureRange?.min || 0
  const maxTemp = taskDetail.value.temperatureRange?.max || 10
  
  temperatureChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度', '下限', '上限'] },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value', name: '温度 (°C)', min: minTemp - 5, max: maxTemp + 5 },
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
}

const handleAlarm = (alarm) => {
  alarmForm.alarmId = alarm.alarmId
  alarmForm.handlerId = userStore.userInfo.userId
  showAlarmDialog.value = true
}

const submitAlarmHandle = async () => {
  await alarmFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await axios.put(`/alarms/${alarmForm.alarmId}/handle`, {
          handlerId: alarmForm.handlerId,
          handleMethod: alarmForm.handleMethod
        })
        ElMessage.success('告警处理成功')
        showAlarmDialog.value = false
        loadAlarmList()
      } catch (error) {
        ElMessage.error('告警处理失败')
      }
    }
  })
}

const submitInspection = async () => {
  await inspectionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await axios.post('/inspections', {
          taskId: taskId.value,
          inspectionResult: inspectionForm.inspectionResult,
          problemDescription: inspectionForm.problemDescription,
          shipperSignature: inspectionForm.shipperSignature,
          driverSignature: inspectionForm.driverSignature
        })
        ElMessage.success('验收记录创建成功')
        showInspectionDialog.value = false
        loadInspectionData()
        loadTaskDetail()
      } catch (error) {
        ElMessage.error('创建验收记录失败')
      }
    }
  })
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

const getCategoryName = (category) => {
  const names = {
    'fresh': '生鲜食品',
    'medicine': '医药制品',
    'frozen': '冷冻食品',
    'dairy': '奶制品',
    'produce': '水果蔬菜',
    'other': '其他'
  }
  return names[category] || category
}

const getAlarmLevelType = (level) => {
  const types = {
    'LEVEL1': 'warning',
    'LEVEL2': 'danger',
    'LEVEL3': 'danger'
  }
  return types[level] || 'info'
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const formatDateTime = (row) => {
  return row.inspectionTime ? dayjs(row.inspectionTime).format('YYYY-MM-DD HH:mm:ss') : '-'
}

let refreshInterval = null

onMounted(() => {
  loadTaskDetail()
  loadTemperatureData()
  loadAlarmList()
  loadInspectionData()
  
  refreshInterval = setInterval(() => {
    loadTemperatureData()
    loadAlarmList()
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
.task-detail-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 400px;
}
</style>
