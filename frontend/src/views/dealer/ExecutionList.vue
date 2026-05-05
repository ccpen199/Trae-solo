<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>内训执行列表</span>
          <el-button type="success" @click="handleCreateTaskB">
            <el-icon><Plus /></el-icon>
            新建B类任务
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="任务类型">
          <el-select v-model="searchForm.task_type" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="A类任务" value="A" />
            <el-option label="B类任务" value="B" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="进行中" value="in_progress" />
            <el-option label="已提交" value="submitted" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="任务名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="task_name" label="任务名称" min-width="180" />
        <el-table-column prop="task_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.task_type === 'A' ? 'primary' : 'success'" size="small">
              {{ row.task_type === 'A' ? 'A类' : 'B类' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="training_method" label="内训方式" width="100" />
        <el-table-column prop="exam_method" label="考核方式" width="100" />
        <el-table-column prop="required_hours" label="要求课时" width="90">
          <template #default="{ row }">
            {{ row.required_hours }} 小时
          </template>
        </el-table-column>
        <el-table-column prop="actual_hours" label="执行课时" width="90">
          <template #default="{ row }">
            <span :style="{ color: row.actual_hours >= row.required_hours ? '#67c23a' : '#e6a23c' }">
              {{ row.actual_hours || 0 }} 小时
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status_text" label="执行状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'submitted' ? 'warning' : 'info'" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              执行操作
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { executionApi } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  task_type: '',
  status: '',
  keyword: ''
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      dealer_id: 1
    }
    if (searchForm.task_type) params.task_type = searchForm.task_type
    if (searchForm.status) params.status = searchForm.status

    const res = await executionApi.getList(params)
    if (res.data?.success) {
      tableData.value = res.data.data
    }
  } catch (error) {
    console.error('加载执行列表失败:', error)
    ElMessage.error('加载执行列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchForm.task_type = ''
  searchForm.status = ''
  searchForm.keyword = ''
  loadData()
}

const handleDetail = (row) => {
  router.push(`/dealer/execution/detail/${row.id}`)
}

const handleCreateTaskB = () => {
  router.push('/dealer/tasks/create')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
