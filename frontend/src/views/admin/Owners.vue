<template>
  <div class="owners-page">
    <div class="page-header">
      <h2 class="page-title">吧主管理</h2>
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon>
        添加吧主
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
          <el-table-column label="用户" width="200">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="32" :src="row.avatar">
                  {{ (row.nickname || row.username)?.charAt(0) }}
                </el-avatar>
                <div class="user-info">
                  <div class="username">{{ row.nickname || row.username }}</div>
                  <div class="user-role">{{ row.role }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="bar_name" label="产品吧" width="200" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '生效' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button 
                v-if="row.status === 1"
                type="warning" 
                link 
                size="small"
                @click="toggleStatus(row, 0)"
              >禁用</el-button>
              <el-button 
                v-else
                type="success" 
                link 
                size="small"
                @click="toggleStatus(row, 1)"
              >启用</el-button>
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
      title="添加吧主"
      width="500px"
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
        <el-form-item label="用户ID" prop="user_id">
          <el-input-number v-model="form.user_id" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="form.role" placeholder="owner" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { ownerApi } from '@/api/owner'
import { barApi } from '@/api/bar'

const formRef = ref(null)

const loading = ref(false)
const error = ref('')
const dialogVisible = ref(false)
const submitting = ref(false)
const deletingId = ref(null)

const list = ref([])
const bars = ref([])

const filters = reactive({
  bar_id: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  bar_id: null,
  user_id: null,
  role: 'owner'
})

const formRules = {
  bar_id: [
    { required: true, message: '请选择产品吧', trigger: 'change' }
  ],
  user_id: [
    { required: true, message: '请输入用户ID', trigger: 'blur' }
  ]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
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
    const res = await ownerApi.getList({
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
  pagination.page = 1
  fetchList()
}

const openDialog = () => {
  form.bar_id = filters.bar_id || (bars.value[0]?.id || null)
  form.user_id = null
  form.role = 'owner'
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
    await ownerApi.create(form)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    fetchList()
  } catch (err) {
    console.error('添加失败:', err)
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (row, status) => {
  try {
    await ownerApi.updateStatus(row.id, status)
    ElMessage.success('操作成功')
    fetchList()
  } catch (err) {
    console.error('操作失败:', err)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此吧主吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  deletingId.value = row.id
  try {
    await ownerApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (err) {
    console.error('删除失败:', err)
  } finally {
    deletingId.value = null
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
