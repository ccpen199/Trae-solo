<template>
  <div class="page-container">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="page-title">项目档案</h1>
        <p class="page-subtitle">管理科研项目基本信息</p>
      </div>
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <div class="card">
      <el-table :data="projects" border stripe>
        <el-table-column prop="project_no" label="项目编号" width="120" />
        <el-table-column prop="name" label="项目名称" min-width="200" />
        <el-table-column prop="source" label="项目来源" width="140" />
        <el-table-column prop="principal" label="负责人" width="100" />
        <el-table-column prop="department" label="所属部门" width="120" />
        <el-table-column label="周期" width="220">
          <template #default="{ row }">
            {{ row.start_date }} 至 {{ row.end_date }}
          </template>
        </el-table-column>
        <el-table-column prop="total_budget" label="总预算" width="120">
          <template #default="{ row }">
            ¥{{ formatMoney(row.total_budget) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="viewBudget(row)">预算</el-button>
              <el-button size="small" @click="editProject(row)">编辑</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目' : '新建项目'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="项目编号">
          <el-input v-model="form.project_no" />
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="项目来源">
          <el-input v-model="form.source" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.principal" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="form.start_date" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="form.end_date" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="总预算">
          <el-input-number v-model="form.total_budget" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="suspended" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProject">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProjects, createProject, updateProject } from '../api'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const projects = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  project_no: '',
  name: '',
  source: '',
  principal: '',
  department: '',
  start_date: '',
  end_date: '',
  total_budget: 0,
  status: 'active'
})

const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getStatusType = (status) => {
  const map = { active: 'success', completed: 'info', suspended: 'warning' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { active: '进行中', completed: '已完成', suspended: '已暂停' }
  return map[status] || status
}

const loadProjects = async () => {
  try {
    const res = await getProjects()
    projects.value = res.data
  } catch (error) {
    ElMessage.error('加载项目列表失败')
  }
}

const openDialog = () => {
  isEdit.value = false
  form.value = {
    project_no: '',
    name: '',
    source: '',
    principal: '',
    department: '',
    start_date: '',
    end_date: '',
    total_budget: 0,
    status: 'active'
  }
  dialogVisible.value = true
}

const editProject = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const saveProject = async () => {
  try {
    if (isEdit.value) {
      await updateProject(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await createProject(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadProjects()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '保存失败')
  }
}

const viewBudget = (row) => {
  router.push(`/budget?projectId=${row.id}`)
}

onMounted(() => {
  loadProjects()
})
</script>
