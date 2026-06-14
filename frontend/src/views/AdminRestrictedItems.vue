<template>
  <div class="admin-restricted-items">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>禁运物品词库</h3>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加禁运词
          </el-button>
        </div>
      </template>

      <el-table :data="items" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="keyword" label="关键词" width="200" />
        <el-table-column prop="category" label="类别" width="150" />
        <el-table-column prop="severity" label="严重程度" width="120">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" size="small">
              {{ getSeverityText(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
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
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link :type="row.is_active ? 'warning' : 'success'" @click="handleToggle(row)">
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="form.keyword" placeholder="请输入禁运关键词" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="form.category" placeholder="请选择类别" style="width: 100%">
            <el-option label="违禁品" value="违禁品" />
            <el-option label="危险品" value="危险品" />
            <el-option label="活体" value="活体" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-radio-group v-model="form.severity">
            <el-radio label="warning">警告</el-radio>
            <el-radio label="dangerous">危险</el-radio>
            <el-radio label="prohibited">禁止</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api/modules'

const loading = ref(false)
const items = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加禁运词')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)

const form = reactive({
  id: null,
  keyword: '',
  category: '其他',
  severity: 'warning',
  is_active: true
})

const rules = {
  keyword: [
    { required: true, message: '请输入关键词', trigger: 'blur' }
  ]
}

const getSeverityType = (severity) => {
  const map = {
    warning: 'warning',
    dangerous: 'danger',
    prohibited: 'danger'
  }
  return map[severity] || 'info'
}

const getSeverityText = (severity) => {
  const map = {
    warning: '警告',
    dangerous: '危险',
    prohibited: '禁止'
  }
  return map[severity] || severity
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadItems = async () => {
  loading.value = true
  try {
    const res = await adminApi.restrictedItems.list()
    if (res.success) {
      items.value = res.items
    }
  } catch (error) {
    console.error('加载禁运词失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '添加禁运词'
  isEdit.value = false
  form.id = null
  form.keyword = ''
  form.category = '其他'
  form.severity = 'warning'
  form.is_active = true
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑禁运词'
  isEdit.value = true
  form.id = row.id
  form.keyword = row.keyword
  form.category = row.category
  form.severity = row.severity
  form.is_active = row.is_active === 1
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        let res
        if (isEdit.value) {
          res = await adminApi.restrictedItems.update(form.id, form)
        } else {
          res = await adminApi.restrictedItems.create(form)
        }

        if (res.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
          dialogVisible.value = false
          loadItems()
        }
      } catch (error) {
        console.error('操作失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleToggle = async (row) => {
  try {
    await adminApi.restrictedItems.update(row.id, { is_active: row.is_active ? 0 : 1 })
    ElMessage.success(row.is_active ? '已禁用' : '已启用')
    loadItems()
  } catch (error) {
    console.error('切换状态失败:', error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该禁运词？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await adminApi.restrictedItems.delete(row.id)
    ElMessage.success('删除成功')
    loadItems()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}
</style>
