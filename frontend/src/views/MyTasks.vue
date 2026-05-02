<template>
  <div class="my-tasks-container">
    <div class="page-header">
      <h1 class="page-title">我的任务</h1>
    </div>

    <el-card class="card">
      <el-table :data="tasks" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="任务名称" />
        <el-table-column prop="project_title" label="所属项目" width="200" />
        <el-table-column prop="description" label="任务描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="scope">
            {{ scope.row.amount ? '¥' + formatAmount(scope.row.amount) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="vendor_name" label="供应商" width="150">
          <template #default="scope">
            {{ scope.row.vendor_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getTaskStatusType(scope.row.status)">
              {{ getTaskStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at ? new Date(scope.row.created_at).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              link 
              v-if="scope.row.status === 'in_progress'"
              @click="handleUploadVoucher(scope.row)"
            >
              上传凭证
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="tasks.length === 0 && !loading" description="暂无任务" />
    </el-card>

    <el-dialog v-model="uploadDialogVisible" title="上传执行凭证" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="凭证类型">
          <el-select v-model="uploadForm.voucher_type" placeholder="请选择凭证类型" style="width: 100%">
            <el-option label="发票" value="receipt" />
            <el-option label="受益快照" value="snapshot" />
            <el-option label="合同" value="contract" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="uploadForm.file_name" placeholder="请输入文件名" />
        </el-form-item>
        <el-form-item>
          <el-text type="info" size="small">
            注：此处演示上传功能，实际项目中可集成文件上传组件
          </el-text>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="submitVoucher">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { taskApi } from '@/api'

const tasks = ref([])
const loading = ref(false)
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const currentTask = ref(null)

const uploadForm = reactive({
  voucher_type: '',
  file_name: ''
})

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getTaskStatusType = (status) => {
  const types = {
    'pending': 'info',
    'in_progress': 'primary',
    'submitted': 'warning',
    'approved': 'success'
  }
  return types[status] || 'info'
}

const getTaskStatusName = (status) => {
  const names = {
    'pending': '待分配',
    'in_progress': '执行中',
    'submitted': '已提交',
    'approved': '已完成'
  }
  return names[status] || status
}

const fetchTasks = async () => {
  loading.value = true
  try {
    const result = await taskApi.getMy()
    if (result.success) {
      tasks.value = result.tasks
    }
  } catch (error) {
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

const handleUploadVoucher = (task) => {
  currentTask.value = task
  uploadForm.voucher_type = ''
  uploadForm.file_name = ''
  uploadDialogVisible.value = true
}

const submitVoucher = async () => {
  if (!uploadForm.voucher_type) {
    ElMessage.warning('请选择凭证类型')
    return
  }
  if (!uploadForm.file_name) {
    ElMessage.warning('请输入文件名')
    return
  }

  uploadLoading.value = true
  try {
    const result = await taskApi.uploadVoucher(currentTask.value.id, {
      voucher_type: uploadForm.voucher_type,
      file_name: uploadForm.file_name
    })
    
    if (result.success) {
      ElMessage.success('凭证已上传，任务已提交审核')
      uploadDialogVisible.value = false
      fetchTasks()
    } else {
      ElMessage.error(result.message || '上传失败')
    }
  } catch (error) {
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    uploadLoading.value = false
  }
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
</style>
