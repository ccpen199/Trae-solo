<template>
  <el-card>
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>标签管理</span>
        <el-button type="primary" @click="openDialog()">
          <el-icon><Plus /></el-icon>
          新建标签
        </el-button>
      </div>
    </template>

    <el-table :data="tags" v-loading="loading" stripe>
      <el-table-column prop="name" label="标签名称" width="200">
        <template #default="{ row }">
          <el-tag :color="row.color">{{ row.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.is_locked" type="warning">已锁定</el-tag>
          <el-tag v-else type="success">正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
          <el-button type="warning" link size="small" @click="toggleLock(row)" v-if="!row.is_locked">锁定</el-button>
          <el-button type="success" link size="small" @click="toggleLock(row)" v-else>解锁</el-button>
          <el-button type="danger" link size="small" @click="deleteTag(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editItem?.id ? '编辑标签' : '新建标签'" width="400px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入标签名称" />
      </el-form-item>
      <el-form-item label="颜色">
        <el-color-picker v-model="form.color" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="actionLoading" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tagApi } from '@/api'

const loading = ref(false)
const actionLoading = ref(false)
const dialogVisible = ref(false)
const editItem = ref(null)
const formRef = ref(null)
const tags = ref([])

const form = reactive({
  name: '',
  color: '#1890ff',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const loadTags = async () => {
  loading.value = true
  try {
    const res = await tagApi.list()
    tags.value = res.data.tags
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  editItem.value = row
  if (row) {
    form.name = row.name
    form.color = row.color
    form.description = row.description || ''
  } else {
    form.name = ''
    form.color = '#1890ff'
    form.description = ''
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  actionLoading.value = true
  try {
    if (editItem.value) {
      await tagApi.update(editItem.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await tagApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadTags()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
  }
}

const toggleLock = async (row) => {
  try {
    if (row.is_locked) {
      await tagApi.unlock(row.id)
      ElMessage.success('解锁成功')
    } else {
      await tagApi.lock(row.id)
      ElMessage.success('锁定成功')
    }
    loadTags()
  } catch (e) {
    console.error(e)
  }
}

const deleteTag = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除标签"${row.name}"吗？`, '提示', { type: 'warning' })
    await tagApi.delete(row.id)
    ElMessage.success('删除成功')
    loadTags()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

onMounted(() => {
  loadTags()
})
</script>
