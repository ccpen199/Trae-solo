<template>
  <div class="tasks-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <el-button type="primary" @click="$router.push('/tasks/create')" v-if="userStore.userRole === 'shipper'">
            创建任务
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="待分配" value="PENDING" />
            <el-option label="已分配" value="ASSIGNED" />
            <el-option label="运输中" value="IN_TRANSIT" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
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
            {{ row.temperatureRange?.min }}°C ~ {{ row.temperatureRange?.max }}°C
          </template>
        </el-table-column>
        <el-table-column label="起止地点">
          <template #default="{ row }">
            <div>{{ row.startLocation?.address || '-' }}</div>
            <div class="sub-text">至: {{ row.endLocation?.address || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" :formatter="formatDate" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button 
              v-if="canAssign(row)" 
              type="warning" 
              size="small" 
              @click="handleAssign(row)"
            >
              分配
            </el-button>
            <el-button 
              v-if="canStart(row)" 
              type="success" 
              size="small" 
              @click="handleStart(row)"
            >
              启动
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
    
    <el-dialog v-model="assignDialogVisible" title="分配任务" width="500px">
      <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-width="100px">
        <el-form-item label="承运商" prop="carrierId">
          <el-select v-model="assignForm.carrierId" placeholder="请选择承运商">
            <el-option v-for="user in carriers" :key="user.userId" :label="user.username" :value="user.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="司机" prop="driverId">
          <el-select v-model="assignForm.driverId" placeholder="请选择司机">
            <el-option v-for="user in drivers" :key="user.userId" :label="user.username" :value="user.userId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const taskList = ref([])
const carriers = ref([])
const drivers = ref([])

const searchForm = reactive({
  status: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const assignDialogVisible = ref(false)
const assignForm = reactive({
  taskId: null,
  carrierId: null,
  driverId: null
})

const assignRules = {
  carrierId: [{ required: true, message: '请选择承运商', trigger: 'change' }],
  driverId: [{ required: true, message: '请选择司机', trigger: 'change' }]
}

const assignFormRef = ref(null)

const loadTasks = async () => {
  loading.value = true
  try {
    let params = {
      page: pagination.currentPage,
      size: pagination.pageSize
    }
    
    if (userStore.userRole === 'shipper') {
      params.shipperId = userStore.userInfo.userId
    } else if (userStore.userRole === 'driver') {
      params.driverId = userStore.userInfo.userId
    }
    
    if (searchForm.status) {
      params.status = searchForm.status
    }
    
    const response = await axios.get('/tasks', { params })
    taskList.value = response.data || []
    pagination.total = response.data?.length || 0
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadTasks()
}

const handleReset = () => {
  searchForm.status = ''
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadTasks()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadTasks()
}

const handleView = (row) => {
  router.push(`/tasks/${row.taskId}`)
}

const canAssign = (task) => {
  return userStore.userRole === 'carrier' && task.taskStatus === 'PENDING'
}

const canStart = (task) => {
  return userStore.userRole === 'driver' && task.taskStatus === 'ASSIGNED'
}

const handleAssign = (row) => {
  assignForm.taskId = row.taskId
  assignDialogVisible.value = true
}

const handleStart = async (row) => {
  try {
    await ElMessageBox.confirm('确认启动此任务？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await axios.put(`/tasks/${row.taskId}/start`)
    ElMessage.success('任务已启动')
    loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('启动任务失败')
    }
  }
}

const handleAssignSubmit = async () => {
  await assignFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await axios.put(`/tasks/${assignForm.taskId}/assign`, {
          carrierId: assignForm.carrierId,
          driverId: assignForm.driverId
        })
        ElMessage.success('任务分配成功')
        assignDialogVisible.value = false
        loadTasks()
      } catch (error) {
        ElMessage.error('任务分配失败')
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

const formatDate = (row, column, cellValue) => {
  return cellValue ? dayjs(cellValue).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  loadTasks()
  loadUsers()
})
</script>

<style scoped>
.tasks-page {
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
</style>
