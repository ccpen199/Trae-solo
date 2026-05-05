<template>
  <div class="course-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>课程管理</span>
          <el-button type="primary" size="small" @click="handleAdd" v-if="userStore.isSystemAdmin || userStore.isTeachingAdmin">
            <el-icon><Plus /></el-icon>
            新增课程
          </el-button>
        </div>
      </template>

      <div class="filters">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="课程名称">
            <el-input v-model="filterForm.name" placeholder="请输入课程名称" clearable style="width: 180px" />
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="filterForm.term" placeholder="全部学期" clearable style="width: 180px">
              <el-option v-for="term in terms" :key="term" :label="getTermLabel(term)" :value="term" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadList">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="loading" :data="list" border stripe style="width: 100%">
        <el-table-column prop="code" label="课程代码" width="120" />
        <el-table-column prop="name" label="课程名称" min-width="200" />
        <el-table-column prop="department.name" label="所属系别" min-width="120" />
        <el-table-column prop="teacher.name" label="授课教师" width="100" />
        <el-table-column prop="credits" label="学分" width="80" align="center" />
        <el-table-column prop="hours" label="学时" width="80" align="center" />
        <el-table-column prop="term" label="学期" width="150">
          <template #default="{ row }">
            {{ getTermLabel(row.term) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right" v-if="userStore.isSystemAdmin || userStore.isTeachingAdmin">
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入课程代码" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课程名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入课程名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学分" prop="credits">
              <el-input-number v-model="form.credits" :min="0.5" :max="10" :step="0.5" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学时" prop="hours">
              <el-input-number v-model="form.hours" :min="1" :max="200" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学期" prop="term">
              <el-select v-model="form.term" placeholder="请选择学期" style="width: 100%">
                <el-option v-for="term in terms" :key="term" :label="getTermLabel(term)" :value="term" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入课程描述" />
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
import { courseApi } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const loading = ref(false)
const submitLoading = ref(false)
const list = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)

const currentYear = new Date().getFullYear()

const terms = computed(() => {
  const result = []
  for (let i = 0; i < 6; i++) {
    const startYear = currentYear - i
    result.push(`${startYear}-${startYear + 1}-1`)
    result.push(`${startYear}-${startYear + 1}-2`)
  }
  return result
})

const getTermLabel = (term) => {
  if (!term) return '-'
  const parts = term.split('-')
  if (parts.length >= 3) {
    const semester = parts[2] === '1' ? '第一学期' : '第二学期'
    return `${parts[0]}-${parts[1]}学年 ${semester}`
  }
  return term
}

const pagination = reactive({ page: 1, pageSize: 10 })

const filterForm = reactive({
  name: '',
  term: null
})

const form = reactive({
  id: null,
  code: '',
  name: '',
  credits: 3,
  hours: 48,
  term: `${currentYear}-${currentYear + 1}-1`,
  description: ''
})

const rules = {
  code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  credits: [{ required: true, message: '请输入学分', trigger: 'blur' }],
  hours: [{ required: true, message: '请输入学时', trigger: 'blur' }],
  term: [{ required: true, message: '请选择学期', trigger: 'change' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑课程' : '新增课程')

const loadList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm
    }
    const res = await courseApi.list(params)
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('加载失败')
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.name = ''
  filterForm.term = null
  pagination.page = 1
  loadList()
}

const handleSizeChange = (size) => { pagination.pageSize = size; loadList() }
const handleCurrentChange = (page) => { pagination.page = page; loadList() }

const handleAdd = () => {
  isEdit.value = false
  form.id = null
  form.code = ''
  form.name = ''
  form.credits = 3
  form.hours = 48
  form.term = `${currentYear}-${currentYear + 1}-1`
  form.description = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.id = row.id
  form.code = row.code
  form.name = row.name
  form.credits = row.credits
  form.hours = row.hours
  form.term = row.term
  form.description = row.description
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await courseApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await courseApi.create(form)
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
    await ElMessageBox.confirm(`确定要删除课程 ${row.name} 吗？`, '提示', { type: 'warning' })
    await courseApi.delete(row.id)
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
.course-container { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.filters { margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 4px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
