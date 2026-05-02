<template>
  <div class="form-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>表单列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建表单
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="草稿" value="draft" />
            <el-option label="设计中" value="designing" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchFormList">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="formList" v-loading="loading" stripe>
        <el-table-column prop="name" label="表单名称" min-width="150" />
        <el-table-column prop="code" label="表单编码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
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
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDesign(row)">
              <el-icon><EditPen /></el-icon>
              设计
            </el-button>
            <el-button
              v-if="row.status === 'published'"
              type="success"
              link
              @click="handleViewSubmit(row)"
            >
              <el-icon><View /></el-icon>
              填报
            </el-button>
            <el-button
              v-if="row.status !== 'published'"
              type="success"
              link
              @click="handlePublish(row)"
              :disabled="row.status === 'archived'"
            >
              <el-icon><CircleCheck /></el-icon>
              发布
            </el-button>
            <el-button
              v-if="row.status === 'published'"
              type="warning"
              link
              @click="handleUnpublish(row)"
            >
              取消发布
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)" :disabled="row.status === 'published'">
              <el-icon><Delete /></el-icon>
              删除
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
        @size-change="fetchFormList"
        @current-change="fetchFormList"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { formApi } from '@/api'
import type { FormDefinition } from '@/types'

const router = useRouter()
const loading = ref(false)
const formList = ref<FormDefinition[]>([])

const searchForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchFormList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }
    const result = await formApi.list(params)
    formList.value = result.data
    pagination.total = result.total
  } catch (error) {
    console.error('Fetch form list error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchFormList()
}

const handleCreate = () => {
  router.push('/forms/design')
}

const handleDesign = (row: FormDefinition) => {
  router.push(`/forms/design/${row.id}`)
}

const handleViewSubmit = (row: FormDefinition) => {
  router.push(`/forms/submit/${row.code}`)
}

const handlePublish = async (row: FormDefinition) => {
  try {
    await ElMessageBox.confirm('确定要发布此表单吗？发布后用户可以开始填报数据。', '发布确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await formApi.publish(row.id)
    ElMessage.success('发布成功')
    fetchFormList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Publish error:', error)
    }
  }
}

const handleUnpublish = async (row: FormDefinition) => {
  try {
    await ElMessageBox.confirm('确定要取消发布此表单吗？取消后用户将无法填报。', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await formApi.unpublish(row.id)
    ElMessage.success('已取消发布')
    fetchFormList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Unpublish error:', error)
    }
  }
}

const handleDelete = async (row: FormDefinition) => {
  try {
    await ElMessageBox.confirm('确定要删除此表单吗？此操作不可恢复。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    })
    await formApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchFormList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
    }
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    designing: 'warning',
    published: 'success',
    archived: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    designing: '设计中',
    published: '已发布',
    archived: '已归档'
  }
  return map[status] || status
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchFormList()
})
</script>

<style scoped>
.form-list-container {
  padding: 0;
}

.form-list-container :deep(.el-card) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.form-list-container :deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 18px 24px;
  border-bottom: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header > span:first-child {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header .el-button--primary {
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  color: #667eea;
  border: none;
  font-weight: 500;
  border-radius: 8px;
  padding: 10px 20px;
  transition: all 0.3s ease;
}

.card-header .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.4);
}

.search-form {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.search-form :deep(.el-select) {
  width: 180px;
}

.search-form :deep(.el-select:hover .el-input__wrapper) {
  box-shadow: 0 0 0 1px #667eea inset;
}

.search-form :deep(.el-select.is-focused .el-input__wrapper) {
  box-shadow: 0 0 0 1px #667eea inset, 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.search-form :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.form-list-container :deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}

.form-list-container :deep(.el-table th.el-table__cell) {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #667eea;
}

.form-list-container :deep(.el-table tr:hover > td.el-table__cell) {
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 100%);
}

.form-list-container :deep(.el-table--striped .el-table__row--striped td.el-table__cell) {
  background: #fafafa;
}

.form-list-container :deep(.el-table--striped .el-table__row--striped:hover > td.el-table__cell) {
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 100%);
}

.form-list-container :deep(.el-tag--info) {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
  border: none;
  color: #fff;
}

.form-list-container :deep(.el-tag--warning) {
  background: linear-gradient(135deg, #e6a23c 0%, #cf9236 100%);
  border: none;
  color: #fff;
}

.form-list-container :deep(.el-tag--success) {
  background: linear-gradient(135deg, #67c23a 0%, #5db134 100%);
  border: none;
  color: #fff;
}

.form-list-container :deep(.el-tag--danger) {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pagination :deep(.el-pagination.is-background .el-pager li:not(.disabled):hover) {
  color: #667eea;
}

.form-list-container :deep(.el-link) {
  font-weight: 500;
  transition: all 0.3s ease;
}

.form-list-container :deep(.el-link--primary:hover) {
  transform: translateY(-1px);
}

.form-list-container :deep(.el-link.is-disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
