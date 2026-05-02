<template>
  <el-card>
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>目录管理</span>
        <el-button type="primary" @click="openDialog()">
          <el-icon><Plus /></el-icon>
          新建目录
        </el-button>
      </div>
    </template>

    <el-table :data="directories" v-loading="loading" row-key="id" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
      <el-table-column prop="name" label="目录名称" min-width="200">
        <template #default="{ row }">
          <el-icon v-if="row.children?.length"><Folder /></el-icon>
          <el-icon v-else><Document /></el-icon>
          <span style="margin-left: 8px">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="sort_order" label="排序" width="100" />
      <el-table-column prop="creator_name" label="创建人" width="120" />
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
          <el-button type="primary" link size="small" @click="openDialog({ parent_id: row.id })">添加子目录</el-button>
          <el-button type="danger" link size="small" @click="deleteDirectory(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editItem?.id ? '编辑目录' : '新建目录'" width="500px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="目录名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入目录名称" />
      </el-form-item>
      <el-form-item label="上级目录">
        <el-select v-model="form.parent_id" placeholder="根目录" clearable style="width: 100%">
          <el-option
            v-for="dir in directoryOptions"
            :key="dir.id"
            :label="dir.name"
            :value="dir.id"
            :disabled="editItem?.id === dir.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.sort_order" :min="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="actionLoading" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { directoryApi } from '@/api'

const loading = ref(false)
const actionLoading = ref(false)
const dialogVisible = ref(false)
const editItem = ref(null)
const formRef = ref(null)
const directories = ref([])

const form = reactive({
  name: '',
  parent_id: null,
  description: '',
  sort_order: 0
})

const rules = {
  name: [{ required: true, message: '请输入目录名称', trigger: 'blur' }]
}

const directoryOptions = computed(() => {
  const flatten = (dirs, level = 0) => {
    let result = []
    dirs.forEach(dir => {
      result.push({
        ...dir,
        name: '　'.repeat(level) + dir.name
      })
      if (dir.children?.length) {
        result = result.concat(flatten(dir.children, level + 1))
      }
    })
    return result
  }
  return flatten(directories.value)
})

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const loadDirectories = async () => {
  loading.value = true
  try {
    const res = await directoryApi.list()
    directories.value = res.data.tree || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  editItem.value = row
  if (row?.id) {
    form.name = row.name
    form.parent_id = row.parent_id
    form.description = row.description || ''
    form.sort_order = row.sort_order || 0
  } else if (row?.parent_id !== undefined) {
    form.name = ''
    form.parent_id = row.parent_id
    form.description = ''
    form.sort_order = 0
  } else {
    form.name = ''
    form.parent_id = null
    form.description = ''
    form.sort_order = 0
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  actionLoading.value = true
  try {
    if (editItem.value?.id) {
      await directoryApi.update(editItem.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await directoryApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadDirectories()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
  }
}

const deleteDirectory = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除目录"${row.name}"吗？`, '提示', { type: 'warning' })
    await directoryApi.delete(row.id)
    ElMessage.success('删除成功')
    loadDirectories()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

onMounted(() => {
  loadDirectories()
})
</script>
