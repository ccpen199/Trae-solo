<template>
  <div class="class-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>班级管理</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增班级
          </el-button>
        </div>
      </template>

      <div class="filters">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="系别">
            <el-select v-model="filterForm.departmentId" placeholder="全部系别" clearable style="width: 180px">
              <el-option v-for="item in departmentList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="filterForm.grade" placeholder="全部年级" clearable style="width: 150px">
              <el-option v-for="year in gradeYears" :key="year" :label="year" :value="year" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadList">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="loading" :data="list" border stripe style="width: 100%">
        <el-table-column prop="code" label="班级代码" width="120" />
        <el-table-column prop="name" label="班级名称" min-width="180" />
        <el-table-column prop="department.name" label="所属系别" min-width="150" />
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="monitor" label="班长" width="100" />
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="班级代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入班级代码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="所属系别" prop="departmentId">
          <el-select v-model="form.departmentId" placeholder="请选择系别" style="width: 100%">
            <el-option v-for="item in departmentList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="form.grade" placeholder="请选择年级" style="width: 100%">
            <el-option v-for="year in gradeYears" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="班长" prop="monitor">
          <el-input v-model="form.monitor" placeholder="请输入班长姓名" />
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
import { classApi, departmentApi } from '@/api'

const loading = ref(false)
const submitLoading = ref(false)
const list = ref([])
const departmentList = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)

const currentYear = new Date().getFullYear()
const gradeYears = computed(() => {
  const years = []
  for (let i = 0; i < 6; i++) {
    years.push((currentYear - i).toString())
  }
  return years
})

const pagination = reactive({ page: 1, pageSize: 10 })

const filterForm = reactive({
  departmentId: null,
  grade: null
})

const form = reactive({
  id: null,
  code: '',
  name: '',
  departmentId: null,
  grade: currentYear.toString(),
  monitor: '',
  description: ''
})

const rules = {
  code: [{ required: true, message: '请输入班级代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  departmentId: [{ required: true, message: '请选择系别', trigger: 'change' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑班级' : '新增班级')

const loadDepartments = async () => {
  try {
    const res = await departmentApi.list({ pageSize: 1000 })
    departmentList.value = res.data?.list || []
  } catch (error) {
    console.error('加载系别失败:', error)
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm
    }
    const res = await classApi.list(params)
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
  filterForm.departmentId = null
  filterForm.grade = null
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
  form.departmentId = null
  form.grade = currentYear.toString()
  form.monitor = ''
  form.description = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.id = row.id
  form.code = row.code
  form.name = row.name
  form.departmentId = row.departmentId
  form.grade = row.grade
  form.monitor = row.monitor
  form.description = row.description
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await classApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await classApi.create(form)
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
    await ElMessageBox.confirm(`确定要删除班级 ${row.name} 吗？`, '提示', { type: 'warning' })
    await classApi.delete(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadDepartments()
  loadList()
})
</script>

<style scoped>
.class-container { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.filters { margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 4px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
