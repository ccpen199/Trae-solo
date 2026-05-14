<template>
  <div class="entries-page">
    <div class="page-header">
      <h2 class="page-title">词条管理</h2>
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon>
        新建词条
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="产品吧">
          <el-select v-model="filters.bar_id" placeholder="全部产品吧" clearable style="width: 200px">
            <el-option
              v-for="bar in bars"
              :key="bar.id"
              :label="bar.name"
              :value="bar.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索标题或内容"
            clearable
            style="width: 200px"
            @keyup.enter="fetchList"
          />
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
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="bar_name" label="所属产品吧" width="150" />
          <el-table-column prop="entry_type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.entry_type === 'text' ? '文字' : row.entry_type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content_count" label="内容项" width="100" />
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
              <el-button type="success" link size="small" @click="openContentDialog(row)">内容</el-button>
              <el-button type="primary" link size="small" @click="viewEntry(row)">查看</el-button>
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
      :title="isEdit ? '编辑词条' : '新建词条'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="产品吧" prop="bar_id">
          <el-select v-model="form.bar_id" placeholder="请选择产品吧" style="width: 100%">
            <el-option
              v-for="bar in bars"
              :key="bar.id"
              :label="bar.name"
              :value="bar.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入词条标题" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="3"
            placeholder="请输入词条简介"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.entry_type" style="width: 100%">
            <el-option label="文字" value="text" />
            <el-option label="图片" value="image" />
            <el-option label="链接" value="link" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
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

    <el-dialog
      v-model="contentDialogVisible"
      title="内容管理"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="content-manage">
        <div class="content-header">
          <strong>当前词条：</strong>{{ currentEntry?.title }}
          <el-button type="primary" size="small" @click="addContent">
            <el-icon><Plus /></el-icon>
            添加内容
          </el-button>
        </div>

        <el-table :data="entryContents" stripe style="margin-top: 16px">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="content_type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">
                {{ row.content_type === 'text' ? '文字' : row.content_type === 'image' ? '图片' : '链接' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="内容">
            <template #default="{ row }">
              <span class="text-ellipsis" style="display: block; max-width: 300px;">
                {{ formatContent(row) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="danger" link size="small" @click="deleteContent(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="entryContents.length === 0" description="暂无内容" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { entryApi } from '@/api/entry'
import { contentApi } from '@/api/content'
import { barApi } from '@/api/bar'

const router = useRouter()
const formRef = ref(null)

const loading = ref(false)
const error = ref('')
const dialogVisible = ref(false)
const contentDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const deletingId = ref(null)

const list = ref([])
const bars = ref([])
const entryContents = ref([])
const currentEntry = ref(null)

const filters = reactive({
  bar_id: null,
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  bar_id: null,
  title: '',
  content: '',
  entry_type: 'text',
  sort: 0,
  status: 1
})

const formRules = {
  bar_id: [
    { required: true, message: '请选择产品吧', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入词条标题', trigger: 'blur' }
  ]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const parseContentData = (data) => {
  if (!data) return null
  if (typeof data === 'object') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

const formatContent = (row) => {
  const data = parseContentData(row.content_data)
  if (typeof data === 'string') return data
  return data?.title || data?.url || row.content_data
}

const fetchBars = async () => {
  try {
    const res = await barApi.getList({ pageSize: 1000, status: 1 })
    bars.value = res?.data?.list || []
  } catch (err) {
    console.error('获取产品吧失败:', err)
  }
}

const fetchList = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await entryApi.getList({
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
  filters.bar_id = null
  filters.keyword = ''
  pagination.page = 1
  fetchList()
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  if (row) {
    form.id = row.id
    form.bar_id = row.bar_id
    form.title = row.title || ''
    form.content = row.content || ''
    form.entry_type = row.entry_type || 'text'
    form.sort = row.sort || 0
    form.status = row.status ?? 1
  } else {
    form.id = null
    form.bar_id = filters.bar_id || (bars.value[0]?.id || null)
    form.title = ''
    form.content = ''
    form.entry_type = 'text'
    form.sort = 0
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
      await entryApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await entryApi.create(form)
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
    await ElMessageBox.confirm(`确定要删除「${row.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  deletingId.value = row.id
  try {
    await entryApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (err) {
    console.error('删除失败:', err)
  } finally {
    deletingId.value = null
  }
}

const viewEntry = (row) => {
  router.push(`/entry/${row.id}`)
}

const openContentDialog = async (row) => {
  currentEntry.value = row
  entryContents.value = []
  contentDialogVisible.value = true
  
  try {
    const res = await contentApi.getByEntry(row.id)
    entryContents.value = res?.data || []
  } catch (err) {
    console.error('获取内容失败:', err)
  }
}

const addContent = () => {
  const newContent = {
    entry_id: currentEntry.value.id,
    content_type: 'text',
    content_data: '新内容',
    sort: entryContents.value.length
  }
  
  entryContents.value.push(newContent)
  
  contentApi.create(newContent).then(() => {
    ElMessage.success('添加成功')
  }).catch(err => {
    console.error('添加失败:', err)
    entryContents.value.pop()
  })
}

const deleteContent = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此内容吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    await contentApi.delete(row.id)
    entryContents.value = entryContents.value.filter(c => c.id !== row.id)
    ElMessage.success('删除成功')
  } catch (err) {
    console.error('删除失败:', err)
  }
}

onMounted(() => {
  fetchBars()
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

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
