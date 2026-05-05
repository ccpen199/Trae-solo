<template>
  <div class="department-container">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>部门管理</span>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新增部门
          </el-button>
        </div>
      </template>
      
      <el-table :data="departments" v-loading="loading" style="width: 100%;" stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="部门名称" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteDepartment(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && departments.length === 0" description="暂无部门数据" />
    </el-card>
    
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      width="500px"
    >
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入部门描述（选填）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const departments = ref([])

const formRef = ref(null)

const form = reactive({
  id: '',
  name: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const loadDepartments = async () => {
  loading.value = true
  
  try {
    const res = await api.get('/departments')
    if (res.success) {
      departments.value = res.data
    }
  } catch (error) {
    console.error('加载部门列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  isEdit.value = false
  form.id = ''
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        let res
        
        if (isEdit.value) {
          res = await api.put(`/departments/${form.id}`, {
            name: form.name.trim(),
            description: form.description || undefined
          })
        } else {
          res = await api.post('/departments', {
            name: form.name.trim(),
            description: form.description || undefined
          })
        }
        
        if (res.success) {
          ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
          dialogVisible.value = false
          loadDepartments()
        }
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const deleteDepartment = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除部门「${row.name}」吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await api.delete(`/departments/${row.id}`)
    
    if (res.success) {
      ElMessage.success('删除成功')
      loadDepartments()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadDepartments()
})
</script>

<style scoped>
.department-container {
  width: 100%;
}
</style>
