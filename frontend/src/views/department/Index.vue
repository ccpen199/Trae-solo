<template>
  <div class="department-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系别管理</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增系别
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="list" border stripe style="width: 100%">
        <el-table-column prop="code" label="系别代码" width="120" />
        <el-table-column prop="name" label="系别名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" plain @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        class="pagination"
        background
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="系别代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入系别代码" />
        </el-form-item>
        <el-form-item label="系别名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入系别名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { departmentApi } from '@/api'

const loading = ref(false)
const submitLoading = ref(false)
const list = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)

const pagination = reactive({ page: 1, pageSize: 10 })

const form = reactive({
  id: null,
  code: '',
  name: '',
  description: ''
})

const rules = {
  code: [{ required: true, message: '请输入系别代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入系别名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑系别' : '新增系别')

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await departmentApi.list({ page: pagination.page, pageSize: pagination.pageSize })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('加载失败')
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size) => { pagination.pageSize = size; loadList() }
const handleCurrentChange = (page) => { pagination.page = page; loadList() }

const handleAdd = () => {
  isEdit.value = false
  form.id = null
  form.code = ''
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.id = row.id
  form.code = row.code
  form.name = row.name
  form.description = row.description
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await departmentApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await departmentApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除系别 ${row.name} 吗？`, '提示', { type: 'warning' })
    await departmentApi.delete(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(loadList)
</script>

<style scoped>
.department-container { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
