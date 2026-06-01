<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">项目列表</span>
          <el-button type="primary" @click="openProjectDialog">新增项目</el-button>
        </div>
      </template>

      <el-table :data="projects" border>
        <el-table-column prop="name" label="项目名称" />
        <el-table-column prop="type" label="项目类型" />
        <el-table-column prop="professional_field" label="专业领域" />
        <el-table-column prop="expert_count" label="需专家数" />
        <el-table-column prop="region" label="地区" />
        <el-table-column prop="confidentiality_level" label="保密等级" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="goToDetail(row)">详情</el-button>
            <el-button size="small" @click="openProjectDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteProject(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="projectDialogVisible" :title="currentProject.id ? '编辑项目' : '新增项目'" width="700px">
      <el-form :model="projectForm" label-width="120px">
        <el-form-item label="项目名称" required>
          <el-input v-model="projectForm.name" />
        </el-form-item>
        <el-form-item label="项目类型" required>
          <el-select v-model="projectForm.type" style="width: 100%">
            <el-option label="项目评审" value="项目评审" />
            <el-option label="采购评审" value="采购评审" />
            <el-option label="科研评审" value="科研评审" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业领域" required>
          <el-input v-model="projectForm.professional_field" />
        </el-form-item>
        <el-form-item label="专家人数" required>
          <el-input-number v-model="projectForm.expert_count" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="替补人数">
          <el-input-number v-model="projectForm.alternate_count" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="地区">
          <el-input v-model="projectForm.region" />
        </el-form-item>
        <el-form-item label="回避单位">
          <el-input v-model="projectForm.回避_units" placeholder="多个单位用逗号分隔" />
        </el-form-item>
        <el-form-item label="保密等级">
          <el-select v-model="projectForm.confidentiality_level" style="width: 100%">
            <el-option label="普通" value="普通" />
            <el-option label="秘密" value="秘密" />
            <el-option label="机密" value="机密" />
          </el-select>
        </el-form-item>
        <el-form-item label="其他要求">
          <el-input type="textarea" v-model="projectForm.requirements" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProject">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const projects = ref([])
const projectDialogVisible = ref(false)
const currentProject = ref({})

const projectForm = reactive({
  name: '',
  type: '',
  professional_field: '',
  expert_count: 3,
  alternate_count: 2,
  region: '',
  回避_units: '',
  confidentiality_level: '普通',
  requirements: ''
})

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    extracted: 'success',
    completed: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待抽取',
    extracted: '已抽取',
    completed: '已完成'
  }
  return texts[status] || status
}

const loadProjects = async () => {
  try {
    const res = await axios.get('/api/projects')
    projects.value = res.data
  } catch (err) {
    ElMessage.error('加载项目列表失败')
  }
}

const openProjectDialog = (project = null) => {
  if (project) {
    currentProject.value = { ...project }
    Object.assign(projectForm, project)
  } else {
    currentProject.value = {}
    Object.assign(projectForm, {
      name: '',
      type: '',
      professional_field: '',
      expert_count: 3,
      alternate_count: 2,
      region: '',
      回避_units: '',
      confidentiality_level: '普通',
      requirements: ''
    })
  }
  projectDialogVisible.value = true
}

const saveProject = async () => {
  try {
    if (currentProject.value.id) {
      await axios.put(`/api/projects/${currentProject.value.id}`, projectForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/projects', projectForm)
      ElMessage.success('创建成功')
    }
    projectDialogVisible.value = false
    loadProjects()
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

const deleteProject = async (project) => {
  try {
    await ElMessageBox.confirm('确定要删除该项目吗？', '提示')
    await axios.delete(`/api/projects/${project.id}`)
    ElMessage.success('删除成功')
    loadProjects()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const goToDetail = (project) => {
  router.push(`/projects/${project.id}`)
}

onMounted(() => {
  loadProjects()
})
</script>
