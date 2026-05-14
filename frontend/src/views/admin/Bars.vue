<template>
  <div class="bars-page">
    <div class="page-header">
      <h2 class="page-title">产品吧管理</h2>
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon>
        新建产品吧
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索名称或描述"
            clearable
            style="width: 200px"
            @keyup.enter="fetchList"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="禁用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList" :loading="loading">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card mt-20">
      <el-skeleton v-if="loading && list.length === 0" animated :count="5" />
      
      <template v-else-if="error">
        <div class="table-error">
          <el-icon class="error-icon"><WarningFilled /></el-icon>
          <p>加载失败：{{ error }}</p>
          <el-button type="primary" @click="fetchList">重试</el-button>
        </div>
      </template>
      
      <template v-else-if="list.length === 0">
        <el-empty description="暂无数据" />
      </template>
      
      <template v-else>
        <el-table :data="list" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" min-width="180">
            <template #default="{ row }">
              <div class="bar-name-cell">
                <img v-if="row.cover_image" :src="row.cover_image" class="bar-thumb" />
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category_name" label="分类" width="120" />
          <el-table-column prop="view_count" label="浏览量" width="100" />
          <el-table-column prop="entry_count" label="词条数" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
              <el-button type="primary" link size="small" @click="viewBar(row)">查看</el-button>
              <el-button 
                type="danger" 
                link 
                size="small"
                :loading="deletingId === row.id"
                @click="handleDelete(row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="fetchList"
            @size-change="fetchList"
          />
        </div>
      </template>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑产品吧' : '新建产品吧'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入产品吧名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入产品吧描述"
          />
        </el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="form.cover_image" placeholder="请输入封面图URL" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category_id" placeholder="请选择分类" clearable style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="叶子节点">
          <el-select v-model="form.leaf_node_id" placeholder="请选择叶子节点" clearable style="width: 100%">
            <el-option
              v-for="node in leafNodes"
              :key="node.id"
              :label="node.name"
              :value="node.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { barApi } from '@/api/bar'
import { categoryApi } from '@/api/category'

const router = useRouter()
const formRef = ref(null)

const loading = ref(false)
const error = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const deletingId = ref(null)

const list = ref([])
const categories = ref([])
const leafNodes = ref([])

const filters = reactive({
  keyword: '',
  status: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  name: '',
  description: '',
  cover_image: '',
  category_id: null,
  leaf_node_id: null,
  status: 1
})

const formRules = {
  name: [
    { required: true, message: '请输入产品吧名称', trigger: 'blur' }
  ]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const fetchCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categories.value = res?.data || []
  } catch (err) {
    console.error('获取分类失败:', err)
  }
}

const fetchLeafNodes = async () => {
  try {
    const res = await categoryApi.getLeafNodes()
    leafNodes.value = res?.data || []
  } catch (err) {
    console.error('获取叶子节点失败:', err)
  }
}

const fetchList = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await barApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    })
    const data = res?.data || {}
    list.value = data.list || []
    pagination.total = data.total || 0
  } catch (err) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.keyword = ''
  filters.status = null
  pagination.page = 1
  fetchList()
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  if (row) {
    form.id = row.id
    form.name = row.name || ''
    form.description = row.description || ''
    form.cover_image = row.cover_image || ''
    form.category_id = row.category_id || null
    form.leaf_node_id = row.leaf_node_id || null
    form.status = row.status ?? 1
  } else {
    form.id = null
    form.name = ''
    form.description = ''
    form.cover_image = ''
    form.category_id = null
    form.leaf_node_id = null
    form.status = 1
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await barApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await barApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (err) {
    console.error('提交失败:', err)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  deletingId.value = row.id
  try {
    await barApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (err) {
    console.error('删除失败:', err)
  } finally {
    deletingId.value = null
  }
}

const viewBar = (row) => {
  router.push(`/bar/${row.id}`)
}

onMounted(() => {
  fetchCategories()
  fetchLeafNodes()
  fetchList()
})
</script>

<style scoped>
.page-title {
  margin: 0 0 24px 0;
  font-size: 22px;
  color: #303133;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-card,
.table-card {
  border-radius: 8px;
}

.table-error {
  text-align: center;
  padding: 40px;
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.bar-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  background: #f5f7fa;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
