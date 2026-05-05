<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>内训任务管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建A类任务
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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
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
        <el-table-column prop="name" label="任务名称" min-width="180" />
        <el-table-column prop="task_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.task_type === 'A' ? 'primary' : 'success'" size="small">
              {{ row.task_type === 'A' ? 'A类' : 'B类' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" width="100" />
        <el-table-column prop="training_method" label="内训方式" width="100" />
        <el-table-column prop="exam_method" label="考核方式" width="100" />
        <el-table-column prop="duration" label="学时时长" width="100">
          <template #default="{ row }">
            {{ row.duration }} 小时
          </template>
        </el-table-column>
        <el-table-column prop="status_text" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button 
              type="primary" 
              link 
              size="small" 
              @click="handleEdit(row)"
              :disabled="row.is_published === 1"
            >
              编辑
            </el-button>
            <el-button 
              type="warning" 
              link 
              size="small" 
              @click="handlePublish(row)"
              :disabled="row.is_published === 1"
            >
              发布
            </el-button>
            <el-button 
              type="danger" 
              link 
              size="small" 
              @click="handleDelete(row)"
              :disabled="row.is_published === 1"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog 
      v-model="publishDialogVisible" 
      title="发布任务" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="publishForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input :value="currentTask?.name" disabled />
        </el-form-item>
        <el-form-item label="发布范围">
          <el-input :value="currentTask?.scope" disabled />
        </el-form-item>
        <el-form-item 
          label="选择经销商" 
          v-if="currentTask?.scope === '指定经销商'"
          :rules="[{ required: true, message: '请选择经销商', trigger: 'change' }]"
        >
          <el-select 
            v-model="publishForm.dealer_ids" 
            multiple 
            placeholder="请选择经销商"
            style="width: 100%"
          >
            <el-option 
              v-for="dealer in dealerList" 
              :key="dealer.id" 
              :label="`${dealer.name} (${dealer.code})`" 
              :value="dealer.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPublish" :loading="publishing">
          确认发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tasksApi, dealersApi } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const dealerList = ref([])
const publishDialogVisible = ref(false)
const publishing = ref(false)
const currentTask = ref(null)

const searchForm = reactive({
  task_type: '',
  status: '',
  keyword: ''
})

const publishForm = reactive({
  dealer_ids: []
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    published: 'primary',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.task_type) params.task_type = searchForm.task_type
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.keyword) params.keyword = searchForm.keyword

    const res = await tasksApi.getList(params)
    if (res.data?.success) {
      tableData.value = res.data.data
    }
  } catch (error) {
    console.error('加载任务列表失败:', error)
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const loadDealers = async () => {
  try {
    const res = await dealersApi.getList({})
    if (res.data?.success) {
      dealerList.value = res.data.data
    }
  } catch (error) {
    console.error('加载经销商列表失败:', error)
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

const handleCreate = () => {
  router.push('/factory/tasks/create')
}

const handleView = (row) => {
  router.push(`/factory/tasks/edit/${row.id}`)
}

const handleEdit = (row) => {
  if (row.is_published === 1) {
    ElMessage.warning('已发布的任务无法编辑')
    return
  }
  router.push(`/factory/tasks/edit/${row.id}`)
}

const handlePublish = (row) => {
  if (row.is_published === 1) {
    ElMessage.warning('任务已发布')
    return
  }
  currentTask.value = row
  publishForm.dealer_ids = []
  publishDialogVisible.value = true
}

const confirmPublish = async () => {
  if (currentTask.value.scope === '指定经销商' && (!publishForm.dealer_ids || publishForm.dealer_ids.length === 0)) {
    ElMessage.warning('请选择要发布的经销商')
    return
  }

  try {
    publishing.value = true
    const data = {}
    if (currentTask.value.scope === '指定经销商') {
      data.dealer_ids = publishForm.dealer_ids
    }
    const res = await tasksApi.publish(currentTask.value.id, data)
    if (res.data?.success) {
      ElMessage.success('任务发布成功')
      publishDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data?.message || '发布失败')
    }
  } catch (error) {
    console.error('发布任务失败:', error)
    ElMessage.error('发布任务失败')
  } finally {
    publishing.value = false
  }
}

const handleDelete = async (row) => {
  if (row.is_published === 1) {
    ElMessage.warning('已发布的任务无法删除')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await tasksApi.delete(row.id)
    if (res.data?.success) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(res.data?.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error)
      ElMessage.error('删除任务失败')
    }
  }
}

onMounted(() => {
  loadData()
  loadDealers()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
