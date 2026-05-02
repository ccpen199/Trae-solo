<template>
  <div class="alarms-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警管理</span>
          <el-radio-group v-model="filterStatus" @change="handleFilterChange">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="UNHANDLED">未处理</el-radio-button>
            <el-radio-button label="HANDLED">已处理</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <el-table :data="alarmList" v-loading="loading" style="width: 100%">
        <el-table-column prop="alarmId" label="告警ID" width="80" />
        <el-table-column prop="taskId" label="任务ID" width="100" />
        <el-table-column prop="alarmType" label="告警类型" width="120" />
        <el-table-column prop="alarmLevel" label="告警级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getAlarmLevelType(row.alarmLevel)" size="small">{{ row.alarmLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alarmValue" label="告警值" width="100">
          <template #default="{ row }"> {{ row.alarmValue }}°C </template>
        </el-table-column>
        <el-table-column prop="thresholdValue" label="阈值" width="100">
          <template #default="{ row }"> {{ row.thresholdValue }}°C </template>
        </el-table-column>
        <el-table-column prop="alarmTime" label="告警时间" :formatter="formatDateTime" width="180" />
        <el-table-column prop="handleStatus" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.handleStatus === 'HANDLED' ? 'success' : 'danger'" size="small">
              {{ row.handleStatus === 'HANDLED' ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handleTime" label="处理时间" :formatter="formatDateTime" width="180" />
        <el-table-column prop="handleMethod" label="处理措施" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.handleStatus === 'UNHANDLED' && canHandleAlarm" 
              type="primary" 
              size="small" 
              @click="handleAlarm(row)"
            >
              处理
            </el-button>
            <el-button 
              v-else 
              type="info" 
              size="small" 
              @click="viewAlarm(row)"
            >
              详情
            </el-button>
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
    
    <el-dialog v-model="showHandleDialog" title="处理告警" width="500px">
      <el-form :model="handleForm" :rules="handleRules" ref="handleFormRef" label-width="100px">
        <el-form-item label="告警信息" v-if="currentAlarm">
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="告警类型">{{ currentAlarm.alarmType }}</el-descriptions-item>
            <el-descriptions-item label="告警级别">
              <el-tag :type="getAlarmLevelType(currentAlarm.alarmLevel)" size="small">{{ currentAlarm.alarmLevel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="告警值">{{ currentAlarm.alarmValue }}°C</el-descriptions-item>
            <el-descriptions-item label="阈值">{{ currentAlarm.thresholdValue }}°C</el-descriptions-item>
          </el-descriptions>
        </el-form-item>
        <el-form-item label="处理措施" prop="handleMethod">
          <el-input v-model="handleForm.handleMethod" type="textarea" :rows="4" placeholder="请详细描述处理措施" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHandle" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showDetailDialog" title="告警详情" width="500px">
      <el-descriptions v-if="currentAlarm" :column="1" border>
        <el-descriptions-item label="告警ID">{{ currentAlarm.alarmId }}</el-descriptions-item>
        <el-descriptions-item label="任务ID">{{ currentAlarm.taskId }}</el-descriptions-item>
        <el-descriptions-item label="告警类型">{{ currentAlarm.alarmType }}</el-descriptions-item>
        <el-descriptions-item label="告警级别">
          <el-tag :type="getAlarmLevelType(currentAlarm.alarmLevel)">{{ currentAlarm.alarmLevel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警值">{{ currentAlarm.alarmValue }}°C</el-descriptions-item>
        <el-descriptions-item label="阈值">{{ currentAlarm.thresholdValue }}°C</el-descriptions-item>
        <el-descriptions-item label="告警时间">{{ formatFullDateTime(currentAlarm.alarmTime) }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="currentAlarm.handleStatus === 'HANDLED' ? 'success' : 'danger'">
            {{ currentAlarm.handleStatus === 'HANDLED' ? '已处理' : '未处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentAlarm.handleTime ? formatFullDateTime(currentAlarm.handleTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理措施">{{ currentAlarm.handleMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentAlarm.handler?.username || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const alarmList = ref([])
const filterStatus = ref('')
const currentAlarm = ref(null)

const showHandleDialog = ref(false)
const showDetailDialog = ref(false)

const handleForm = reactive({
  handleMethod: ''
})

const handleRules = {
  handleMethod: [{ required: true, message: '请输入处理措施', trigger: 'blur' }]
}

const handleFormRef = ref(null)

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const canHandleAlarm = computed(() => {
  return ['driver', 'quality_control'].includes(userStore.userRole)
})

const loadAlarms = async () => {
  loading.value = true
  try {
    let allAlarms = []
    const tasksResponse = await axios.get('/tasks')
    const tasks = tasksResponse.data || []
    
    for (const task of tasks) {
      try {
        const response = await axios.get(`/alarms/${task.taskId}`)
        if (response.data) {
          allAlarms.push(...response.data)
        }
      } catch (error) {
        console.error(`加载任务${task.taskId}的告警失败:`, error)
      }
    }
    
    if (filterStatus.value) {
      allAlarms = allAlarms.filter(a => a.handleStatus === filterStatus.value)
    }
    
    alarmList.value = allAlarms.sort((a, b) => new Date(b.alarmTime) - new Date(a.alarmTime))
    pagination.total = alarmList.value.length
  } catch (error) {
    ElMessage.error('加载告警列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.currentPage = 1
  loadAlarms()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadAlarms()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadAlarms()
}

const handleAlarm = (alarm) => {
  currentAlarm.value = alarm
  handleForm.handleMethod = ''
  showHandleDialog.value = true
}

const viewAlarm = (alarm) => {
  currentAlarm.value = alarm
  showDetailDialog.value = true
}

const submitHandle = async () => {
  await handleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await axios.put(`/alarms/${currentAlarm.value.alarmId}/handle`, {
          handlerId: userStore.userInfo.userId,
          handleMethod: handleForm.handleMethod
        })
        ElMessage.success('告警处理成功')
        showHandleDialog.value = false
        loadAlarms()
      } catch (error) {
        ElMessage.error('告警处理失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const getAlarmLevelType = (level) => {
  const types = {
    'LEVEL1': 'warning',
    'LEVEL2': 'danger',
    'LEVEL3': 'danger'
  }
  return types[level] || 'info'
}

const formatDateTime = (row) => {
  return row.alarmTime ? dayjs(row.alarmTime).format('YYYY-MM-DD HH:mm') : '-'
}

const formatFullDateTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

let refreshInterval = null

onMounted(() => {
  loadAlarms()
  
  refreshInterval = setInterval(() => {
    loadAlarms()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.alarms-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
