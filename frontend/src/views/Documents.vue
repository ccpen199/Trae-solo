<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>文档列表</span>
          <el-button type="primary" @click="$router.push('/documents/create')">
            <el-icon><Plus /></el-icon>
            新建文档
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索标题/内容" clearable @keyup.enter="loadDocuments" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="待创建" value="pending_creation" />
            <el-option label="待审核" value="pending_review" />
            <el-option label="已发布" value="published" />
            <el-option label="待使用" value="pending_use" />
            <el-option label="待更新" value="pending_update" />
          </el-select>
        </el-form-item>
        <el-form-item label="目录">
          <el-select v-model="searchForm.directory_id" placeholder="全部目录" clearable style="width: 150px">
            <el-option v-for="dir in directories" :key="dir.id" :label="dir.name" :value="dir.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDocuments">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="documents" v-loading="loading" stripe @row-click="goToDetail">
        <el-table-column prop="main_order_no" label="单号" width="160" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="responsible_name" label="责任人" width="100" />
        <el-table-column label="标签" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag.id" :color="tag.color" size="small" style="margin-right: 4px">
              {{ tag.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="goToDetail(row)">查看</el-button>
            <el-button type="primary" link size="small" @click.stop="editDocument(row)" v-if="canEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click.stop="deleteDocument(row)" v-if="canDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; text-align: right"
        @size-change="loadDocuments"
        @current-change="loadDocuments"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { documentApi, directoryApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const documents = ref([])
const directories = ref([])
const total = ref(0)

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const searchForm = reactive({
  keyword: '',
  status: '',
  directory_id: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20
})

const isAdmin = computed(() => user.value.role === 'admin' || user.value.role === 'knowledge_manager')

const getStatusType = (status) => {
  const types = {
    pending_creation: 'info',
    pending_review: 'warning',
    published: 'success',
    pending_use: '',
    pending_update: 'warning'
  }
  return types[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    pending_creation: '待创建',
    pending_review: '待审核',
    published: '已发布',
    pending_use: '待使用',
    pending_update: '待更新'
  }
  return labels[status] || status
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const canEdit = (row) => {
  if (isAdmin.value) return true
  if (row.created_by === user.value.id) {
    return row.status === 'pending_creation' || row.status === 'pending_update'
  }
  return false
}

const canDelete = (row) => {
  if (isAdmin.value) return true
  return row.created_by === user.value.id && row.status === 'pending_creation'
}

const loadDocuments = async () => {
  loading.value = true
  try {
    const params = { ...searchForm }
    if (!params.status) delete params.status
    if (!params.directory_id) delete params.directory_id
    if (!params.keyword) delete params.keyword

    const res = await documentApi.list(params)
    documents.value = res.data.documents
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadDirectories = async () => {
  try {
    const res = await directoryApi.list()
    directories.value = res.data.directories
  } catch (e) {
    console.error(e)
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.directory_id = ''
  loadDocuments()
}

const goToDetail = (row) => {
  router.push(`/documents/${row.id}`)
}

const editDocument = (row) => {
  router.push(`/documents/${row.id}`)
}

const deleteDocument = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除文档"${row.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await documentApi.delete(row.id)
    ElMessage.success('删除成功')
    loadDocuments()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

onMounted(() => {
  loadDocuments()
  loadDirectories()
})
</script>
