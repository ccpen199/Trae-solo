<template>
  <div class="inspections-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>验收管理</span>
          <el-select v-model="filterTaskId" placeholder="选择任务" clearable @change="handleTaskFilter" style="width: 200px;">
            <el-option v-for="task in taskList" :key="task.taskId" :label="`任务${task.taskId}`" :value="task.taskId" />
          </el-select>
        </div>
      </template>
      
      <el-table :data="inspectionList" v-loading="loading" style="width: 100%">
        <el-table-column prop="inspectionId" label="验收ID" width="100" />
        <el-table-column prop="taskId" label="任务ID" width="100" />
        <el-table-column prop="inspectionTime" label="验收时间" :formatter="formatDateTime" width="180" />
        <el-table-column prop="inspectionResult" label="验收结果" width="120">
          <template #default="{ row }">
            <el-tag :type="row.inspectionResult === 'PASSED' ? 'success' : 'danger'">
              {{ row.inspectionResult === 'PASSED' ? '合格' : '不合格' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="problemDescription" label="问题描述" show-overflow-tooltip />
        <el-table-column prop="shipperSignature" label="货主签名" width="120" />
        <el-table-column prop="driverSignature" label="司机签名" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewInspection(row)">详情</el-button>
            <el-button type="success" size="small" @click="downloadReport(row)">报告</el-button>
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
    
    <el-dialog v-model="showDetailDialog" title="验收详情" width="600px">
      <el-descriptions v-if="currentInspection" :column="2" border>
        <el-descriptions-item label="验收ID">{{ currentInspection.inspectionId }}</el-descriptions-item>
        <el-descriptions-item label="任务ID">{{ currentInspection.taskId }}</el-descriptions-item>
        <el-descriptions-item label="验收时间">{{ formatFullDateTime(currentInspection.inspectionTime) }}</el-descriptions-item>
        <el-descriptions-item label="验收结果">
          <el-tag :type="currentInspection.inspectionResult === 'PASSED' ? 'success' : 'danger'">
            {{ currentInspection.inspectionResult === 'PASSED' ? '合格' : '不合格' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="货主签名">{{ currentInspection.shipperSignature || '-' }}</el-descriptions-item>
        <el-descriptions-item label="司机签名">{{ currentInspection.driverSignature || '-' }}</el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">{{ currentInspection.problemDescription || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider v-if="currentTask" content-position="left">任务信息</el-divider>
      <el-descriptions v-if="currentTask" :column="2" border>
        <el-descriptions-item label="货主">{{ currentTask.shipper?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentTask.driver?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="温度区间" :span="2">
          {{ currentTask.temperatureRange?.min }}°C ~ {{ currentTask.temperatureRange?.max }}°C
        </el-descriptions-item>
        <el-descriptions-item label="起始位置">{{ currentTask.startLocation?.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目的地">{{ currentTask.endLocation?.address || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="downloadReport(currentInspection)">下载报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const userStore = useUserStore()

const loading = ref(false)
const inspectionList = ref([])
const taskList = ref([])
const filterTaskId = ref(null)
const currentInspection = ref(null)
const currentTask = ref(null)

const showDetailDialog = ref(false)

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const loadTasks = async () => {
  try {
    let params = { status: 'COMPLETED' }
    if (userStore.userRole === 'shipper') {
      params.shipperId = userStore.userInfo.userId
    } else if (userStore.userRole === 'driver') {
      params.driverId = userStore.userInfo.userId
    }
    
    const response = await axios.get('/tasks', { params })
    taskList.value = response.data || []
  } catch (error) {
    console.error('加载任务列表失败:', error)
  }
}

const loadInspections = async () => {
  loading.value = true
  try {
    let allInspections = []
    
    const tasksToCheck = filterTaskId.value 
      ? taskList.value.filter(t => t.taskId === filterTaskId.value)
      : taskList.value
    
    for (const task of tasksToCheck) {
      try {
        const response = await axios.get(`/inspections/${task.taskId}`)
        if (response.data) {
          allInspections.push(response.data)
        }
      } catch (error) {
        console.error(`加载任务${task.taskId}的验收信息失败:`, error)
      }
    }
    
    inspectionList.value = allInspections.sort((a, b) => new Date(b.inspectionTime) - new Date(a.inspectionTime))
    pagination.total = inspectionList.value.length
  } catch (error) {
    ElMessage.error('加载验收列表失败')
  } finally {
    loading.value = false
  }
}

const handleTaskFilter = () => {
  pagination.currentPage = 1
  loadInspections()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadInspections()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadInspections()
}

const viewInspection = async (inspection) => {
  currentInspection.value = inspection
  
  try {
    const response = await axios.get(`/tasks/${inspection.taskId}`)
    currentTask.value = response.data
  } catch (error) {
    console.error('加载任务详情失败:', error)
  }
  
  showDetailDialog.value = true
}

const downloadReport = async (inspection) => {
  try {
    const response = await axios.get(`/reports/${inspection.taskId}`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `温控报告_${inspection.taskId}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('报告下载成功')
  } catch (error) {
    ElMessage.error('报告下载失败')
  }
}

const formatDateTime = (row) => {
  return row.inspectionTime ? dayjs(row.inspectionTime).format('YYYY-MM-DD HH:mm') : '-'
}

const formatFullDateTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  loadTasks().then(() => {
    loadInspections()
  })
})
</script>

<style scoped>
.inspections-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
