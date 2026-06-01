<template>
  <div>
    <div class="page-header">
      <span class="page-title">资金项目管理</span>
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <el-card>
      <el-table :data="projects" border stripe>
        <el-table-column prop="indicator_no" label="指标文号" width="160" />
        <el-table-column prop="budget_source" label="预算来源" width="140" />
        <el-table-column prop="project_unit" label="项目单位" />
        <el-table-column prop="purpose" label="用途" />
        <el-table-column prop="annual_quota" label="年度额度" width="140" :formatter="formatMoney" />
        <el-table-column prop="available_balance" label="可拨余额" width="140" :formatter="formatMoney" />
        <el-table-column label="使用率" width="140">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.min(100, Math.round((row.annual_quota - row.available_balance) / row.annual_quota * 100))" 
              :stroke-width="12"
              :color="getProgressColor(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingProject ? '编辑项目' : '新建项目'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="预算来源" prop="budget_source">
          <el-select v-model="form.budget_source" style="width: 100%">
            <el-option label="一般公共预算" value="一般公共预算" />
            <el-option label="政府性基金" value="政府性基金" />
            <el-option label="上级转移支付" value="上级转移支付" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="指标文号" prop="indicator_no">
          <el-input v-model="form.indicator_no" placeholder="例如：CZ-2024-001" />
        </el-form-item>
        <el-form-item label="项目单位" prop="project_unit">
          <el-input v-model="form.project_unit" />
        </el-form-item>
        <el-form-item label="用途" prop="purpose">
          <el-input v-model="form.purpose" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="年度额度" prop="annual_quota">
          <el-input-number v-model="form.annual_quota" :min="0" :precision="2" style="width: 100%" />
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
import { Plus } from '@element-plus/icons-vue'
import { projectsApi } from '../api'

const projects = ref([])
const dialogVisible = ref(false)
const editingProject = ref(null)
const formRef = ref(null)

const form = ref({
  budget_source: '',
  indicator_no: '',
  project_unit: '',
  purpose: '',
  annual_quota: 0
})

const rules = {
  budget_source: [{ required: true, message: '请选择预算来源', trigger: 'change' }],
  indicator_no: [{ required: true, message: '请输入指标文号', trigger: 'blur' }],
  project_unit: [{ required: true, message: '请输入项目单位', trigger: 'blur' }],
  purpose: [{ required: true, message: '请输入用途', trigger: 'blur' }],
  annual_quota: [{ required: true, message: '请输入年度额度', trigger: 'blur' }]
}

const formatMoney = (row) => {
  return '¥' + Number(row.annual_quota || row.available_balance).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getProgressColor = (row) => {
  const rate = (row.annual_quota - row.available_balance) / row.annual_quota
  if (rate >= 0.9) return '#f56c6c'
  if (rate >= 0.7) return '#e6a23c'
  return '#67c23a'
}

const loadProjects = async () => {
  try {
    projects.value = await projectsApi.list()
  } catch (error) {
    ElMessage.error('加载项目列表失败')
  }
}

const openDialog = (row = null) => {
  editingProject.value = row
  if (row) {
    form.value = { ...row }
  } else {
    form.value = {
      budget_source: '',
      indicator_no: '',
      project_unit: '',
      purpose: '',
      annual_quota: 0
    }
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingProject.value) {
          await projectsApi.update(editingProject.value.id, form.value)
          ElMessage.success('更新成功')
        } else {
          await projectsApi.create(form.value)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadProjects()
      } catch (error) {
        ElMessage.error(error.error || '操作失败')
      }
    }
  })
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该项目吗？', '确认删除', { type: 'warning' })
    await projectsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadProjects()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadProjects()
})
</script>
