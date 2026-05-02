<template>
  <div class="reports-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报告查询</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务ID">
          <el-input v-model="searchForm.taskId" placeholder="请输入任务ID" clearable />
        </el-form-item>
        <el-form-item label="报告类型">
          <el-select v-model="searchForm.reportType" placeholder="请选择" clearable style="width: 150px;">
            <el-option label="温控报告" value="temperature" />
            <el-option label="质控报告" value="quality" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="reportList" v-loading="loading" style="width: 100%">
        <el-table-column prop="taskId" label="任务ID" width="100" />
        <el-table-column prop="reportType" label="报告类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.reportType === 'temperature' ? 'primary' : 'success'">
              {{ row.reportType === 'temperature' ? '温控报告' : '质控报告' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务信息">
          <template #default="{ row }">
            <div>{{ row.taskInfo?.goodsInfo?.name || '-' }}</div>
            <div class="sub-text">{{ row.taskInfo?.startLocation?.address || '-' }} → {{ row.taskInfo?.endLocation?.address || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="温度区间">
          <template #default="{ row }">
            {{ row.taskInfo?.temperatureRange?.min || '-' }}°C ~ {{ row.taskInfo?.temperatureRange?.max || '-' }}°C
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="生成时间" :formatter="formatDate" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="previewReport(row)">预览</el-button>
            <el-button type="success" size="small" @click="downloadReport(row)">下载</el-button>
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
    
    <el-dialog v-model="showPreviewDialog" title="报告预览" width="800px" fullscreen>
      <div class="report-preview">
        <iframe v-if="previewUrl" :src="previewUrl" class="preview-frame"></iframe>
        <el-empty v-else description="暂无预览" />
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="downloadReport(currentReport)">下载报告</el-button>
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
const reportList = ref([])
const previewUrl = ref('')
const currentReport = ref(null)

const showPreviewDialog = ref(false)

const searchForm = reactive({
  taskId: '',
  reportType: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const loadReports = async () => {
  loading.value = true
  try {
    let allReports = []
    
    let params = {}
    if (userStore.userRole === 'shipper') {
      params.shipperId = userStore.userInfo.userId
    } else if (userStore.userRole === 'driver') {
      params.driverId = userStore.userInfo.userId
    }
    
    const response = await axios.get('/tasks', { params })
    const tasks = response.data || []
    
    for (const task of tasks) {
      if (task.taskStatus === 'COMPLETED') {
        try {
          const inspectionResponse = await axios.get(`/inspections/${task.taskId}`)
          if (inspectionResponse.data) {
            allReports.push({
              taskId: task.taskId,
              reportType: 'temperature',
              taskInfo: task,
              createdAt: inspectionResponse.data.inspectionTime
            })
          }
        } catch (error) {
          console.error(`加载任务${task.taskId}的验收信息失败:`, error)
        }
      }
    }
    
    if (searchForm.taskId) {
      allReports = allReports.filter(r => r.taskId.toString().includes(searchForm.taskId))
    }
    
    if (searchForm.reportType) {
      allReports = allReports.filter(r => r.reportType === searchForm.reportType)
    }
    
    reportList.value = allReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    pagination.total = reportList.value.length
  } catch (error) {
    ElMessage.error('加载报告列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadReports()
}

const handleReset = () => {
  searchForm.taskId = ''
  searchForm.reportType = ''
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadReports()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadReports()
}

const previewReport = async (report) => {
  currentReport.value = report
  previewUrl.value = `/api/reports/${report.taskId}`
  showPreviewDialog.value = true
}

const downloadReport = async (report) => {
  try {
    const response = await axios.get(`/reports/${report.taskId}`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `温控报告_${report.taskId}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('报告下载成功')
  } catch (error) {
    ElMessage.error('报告下载失败')
  }
}

const formatDate = (row) => {
  return row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.reports-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.sub-text {
  font-size: 12px;
  color: #909399;
}

.report-preview {
  height: calc(100vh - 200px);
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
