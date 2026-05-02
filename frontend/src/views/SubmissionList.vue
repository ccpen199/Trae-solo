<template>
  <div class="submission-list-container">
    <el-card>
      <template #header>
        <span>提交记录</span>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="草稿" value="draft" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已撤回" value="withdrawn" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchSubmissions">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="submissionList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="form_id" label="表单ID" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button
              v-if="row.status === 'submitted'"
              type="success"
              link
              @click="handleApprove(row)"
            >
              <el-icon><CircleCheck /></el-icon>
              通过
            </el-button>
            <el-button
              v-if="row.status === 'submitted'"
              type="warning"
              link
              @click="handleReject(row)"
            >
              <el-icon><CircleClose /></el-icon>
              驳回
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              type="primary"
              link
              @click="handleEdit(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchSubmissions"
        @current-change="fetchSubmissions"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { submissionApi } from '@/api'
import type { FormSubmission } from '@/types'

const router = useRouter()
const loading = ref(false)
const submissionList = ref<FormSubmission[]>([])

const searchForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchSubmissions = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }
    const result = await submissionApi.list(params)
    submissionList.value = result.data
    pagination.total = result.total
  } catch (error) {
    console.error('Fetch submissions error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchSubmissions()
}

const handleView = (row: FormSubmission) => {
  router.push(`/submissions/${row.id}`)
}

const handleEdit = (row: FormSubmission) => {
  router.push(`/submissions/${row.id}`)
}

const handleApprove = async (row: FormSubmission) => {
  try {
    await ElMessageBox.confirm('确定要通过此提交吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    await submissionApi.approve(row.id)
    ElMessage.success('已通过')
    fetchSubmissions()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Approve error:', error)
    }
  }
}

const handleReject = async (row: FormSubmission) => {
  try {
    await ElMessageBox.confirm('确定要驳回此提交吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await submissionApi.reject(row.id)
    ElMessage.success('已驳回')
    fetchSubmissions()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Reject error:', error)
    }
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回'
  }
  return map[status] || status
}

const formatTime = (time?: string) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchSubmissions()
})
</script>

<style scoped>
.submission-list-container {
  padding: 0;
}

.submission-list-container :deep(.el-card) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.submission-list-container :deep(.el-card__header) {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  padding: 18px 24px;
  border-bottom: none;
}

.submission-list-container :deep(.el-card__header > span) {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-form {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-radius: 12px;
  border-left: 4px solid #11998e;
}

.search-form :deep(.el-select) {
  width: 180px;
}

.search-form :deep(.el-select:hover .el-input__wrapper) {
  box-shadow: 0 0 0 1px #11998e inset;
}

.search-form :deep(.el-select.is-focused .el-input__wrapper) {
  box-shadow: 0 0 0 1px #11998e inset, 0 0 0 3px rgba(17, 153, 142, 0.1);
}

.search-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.search-form :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(17, 153, 142, 0.4);
}

.submission-list-container :deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}

.submission-list-container :deep(.el-table th.el-table__cell) {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #11998e;
}

.submission-list-container :deep(.el-table tr:hover > td.el-table__cell) {
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 100%);
}

.submission-list-container :deep(.el-table--striped .el-table__row--striped td.el-table__cell) {
  background: #fafafa;
}

.submission-list-container :deep(.el-table--striped .el-table__row--striped:hover > td.el-table__cell) {
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 100%);
}

.submission-list-container :deep(.el-tag--info) {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
  border: none;
  color: #fff;
}

.submission-list-container :deep(.el-tag--warning) {
  background: linear-gradient(135deg, #e6a23c 0%, #cf9236 100%);
  border: none;
  color: #fff;
}

.submission-list-container :deep(.el-tag--success) {
  background: linear-gradient(135deg, #67c23a 0%, #5db134 100%);
  border: none;
  color: #fff;
}

.submission-list-container :deep(.el-tag--danger) {
  background: linear-gradient(135deg, #f56c6c 0%, #e05c5c 100%);
  border: none;
  color: #fff;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.pagination :deep(.el-pagination__total) {
  color: #606266;
}

.pagination :deep(.el-pagination.is-background .el-pager li:not(.disabled).active) {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.pagination :deep(.el-pagination.is-background .el-pager li:not(.disabled):hover) {
  color: #11998e;
}

.submission-list-container :deep(.el-link) {
  font-weight: 500;
  transition: all 0.3s ease;
}

.submission-list-container :deep(.el-link--primary:hover) {
  transform: translateY(-1px);
}

.submission-list-container :deep(.el-link--success:hover) {
  transform: translateY(-1px);
}

.submission-list-container :deep(.el-link--warning:hover) {
  transform: translateY(-1px);
}
</style>
