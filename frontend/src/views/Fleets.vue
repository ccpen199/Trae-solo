<template>
  <div>
    <div class="page-header">
      <h2>车队管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增车队
      </el-button>
    </div>

    <el-card class="card-container">
      <el-table :data="fleets" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="车队名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="crew_count" label="人员数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.crew_count || 0 }} 人</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑车队' : '新增车队'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="车队名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入车队名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fleetsAPI } from '@/api'
import dayjs from 'dayjs'

const fleets = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = ref({
  id: null,
  name: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入车队名称', trigger: 'blur' }]
}

const loadFleets = async () => {
  loading.value = true
  try {
    const res = await fleetsAPI.list()
    fleets.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { id: null, name: '', description: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await fleetsAPI.update(form.value.id, form.value)
          ElMessage.success('编辑成功')
        } else {
          await fleetsAPI.create(form.value)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadFleets()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该车队吗？', '确认', { type: 'warning' })
    await fleetsAPI.delete(row.id)
    ElMessage.success('删除成功')
    loadFleets()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadFleets()
})
</script>
