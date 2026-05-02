<template>
  <div class="ngo-projects-container">
    <div class="page-header">
      <h1 class="page-title">项目管理</h1>
      <el-button type="primary" @click="handleCreateProject">
        <el-icon><Plus /></el-icon>
        发布新项目
      </el-button>
    </div>

    <el-card class="card">
      <el-table :data="projects" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="项目名称" />
        <el-table-column label="金额进度" width="200">
          <template #default="scope">
            <div style="font-size: 12px">
              <span>¥{{ formatAmount(scope.row.current_amount) }}</span>
              <span style="color: #909399"> / ¥{{ formatAmount(scope.row.target_amount) }}</span>
            </div>
            <el-progress 
              :percentage="Math.min(100, Math.round((scope.row.current_amount / scope.row.target_amount) * 100))"
              :stroke-width="8"
              style="margin-top: 4px"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at ? new Date(scope.row.created_at).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="viewProject(scope.row.id)">详情</el-button>
            <el-button 
              type="success" 
              link 
              v-if="scope.row.status === 'pending'"
              @click="handleApproveProject(scope.row)"
            >
              审核通过
            </el-button>
            <el-button 
              type="warning" 
              link 
              v-if="scope.row.status === 'fundraising' || scope.row.status === 'in_progress'"
              @click="handleAddMilestone(scope.row)"
            >
              添加里程碑
            </el-button>
            <el-button 
              type="primary" 
              link 
              v-if="scope.row.status === 'fundraising' || scope.row.status === 'in_progress'"
              @click="handleAddTask(scope.row)"
            >
              添加任务
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="projects.length === 0 && !loading" description="暂无项目数据" />
    </el-card>

    <el-dialog v-model="createDialogVisible" title="发布新项目" width="600px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="项目名称" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input 
            v-model="createForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请详细描述项目内容"
          />
        </el-form-item>
        <el-form-item label="目标金额" prop="target_amount">
          <el-input-number 
            v-model="createForm.target_amount" 
            :min="1" 
            :precision="2"
            style="width: 100%"
            placeholder="请输入目标金额"
          />
        </el-form-item>
        <el-form-item label="项目分类" prop="category">
          <el-select v-model="createForm.category" placeholder="请选择项目分类" style="width: 100%">
            <el-option label="教育助学" value="education" />
            <el-option label="医疗救助" value="medical" />
            <el-option label="灾害救援" value="disaster" />
            <el-option label="环境保护" value="environment" />
            <el-option label="社区发展" value="community" />
            <el-option label="其他公益" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker
            v-model="createForm.start_date"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker
            v-model="createForm.end_date"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreateProject">提交审核</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="milestoneDialogVisible" title="添加里程碑" width="500px">
      <el-form :model="milestoneForm" label-width="100px">
        <el-form-item label="里程碑名称">
          <el-input v-model="milestoneForm.name" placeholder="请输入里程碑名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="milestoneForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请描述里程碑内容"
          />
        </el-form-item>
        <el-form-item label="目标金额">
          <el-input-number 
            v-model="milestoneForm.target_amount" 
            :min="0" 
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="milestoneForm.deadline"
            type="date"
            placeholder="选择截止日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="milestoneDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="milestoneLoading" @click="submitMilestone">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="taskDialogVisible" title="添加任务" width="500px">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input 
            v-model="taskForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请描述任务内容"
          />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number 
            v-model="taskForm.amount" 
            :min="0" 
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="taskForm.vendor_name" placeholder="请输入供应商名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="taskLoading" @click="submitTask">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { projectApi, taskApi } from '@/api'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()

const projects = ref([])
const loading = ref(false)

const createDialogVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  title: '',
  description: '',
  target_amount: null,
  category: '',
  start_date: '',
  end_date: ''
})

const milestoneDialogVisible = ref(false)
const milestoneLoading = ref(false)
const currentProject = ref(null)
const milestoneForm = reactive({
  name: '',
  description: '',
  target_amount: null,
  deadline: ''
})

const taskDialogVisible = ref(false)
const taskLoading = ref(false)
const taskForm = reactive({
  name: '',
  description: '',
  amount: null,
  vendor_name: ''
})

const createRules = {
  title: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入项目描述', trigger: 'blur' }],
  target_amount: [{ required: true, message: '请输入目标金额', trigger: 'blur' }]
}

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getStatusType = (status) => {
  const types = {
    'pending': 'info',
    'fundraising': 'primary',
    'in_progress': 'warning',
    'completed': 'success'
  }
  return types[status] || 'info'
}

const getStatusName = (status) => {
  const names = {
    'pending': '待审核',
    'fundraising': '募集中',
    'in_progress': '执行中',
    'completed': '已结项'
  }
  return names[status] || status
}

const fetchProjects = async () => {
  loading.value = true
  try {
    const result = await projectApi.list()
    if (result.success) {
      projects.value = result.projects
    }
  } catch (error) {
    ElMessage.error('获取项目列表失败')
  } finally {
    loading.value = false
  }
}

const viewProject = (id) => {
  router.push(`/projects/${id}`)
}

const handleCreateProject = () => {
  createForm.title = ''
  createForm.description = ''
  createForm.target_amount = null
  createForm.category = ''
  createForm.start_date = ''
  createForm.end_date = ''
  createDialogVisible.value = true
}

const submitCreateProject = async () => {
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return

  createLoading.value = true
  try {
    const result = await projectApi.create({
      title: createForm.title,
      description: createForm.description,
      target_amount: createForm.target_amount,
      category: createForm.category,
      start_date: createForm.start_date,
      end_date: createForm.end_date
    })
    
    if (result.success) {
      ElMessage.success('项目已提交，等待审核')
      createDialogVisible.value = false
      fetchProjects()
    } else {
      ElMessage.error(result.message || '创建失败')
    }
  } catch (error) {
    ElMessage.error('创建失败，请稍后重试')
  } finally {
    createLoading.value = false
  }
}

const handleApproveProject = async (project) => {
  try {
    await ElMessageBox.confirm(`确定要审核通过项目"${project.title}"吗？`, '确认审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await projectApi.approve(project.id)
    if (result.success) {
      ElMessage.success('项目已审核通过')
      fetchProjects()
    } else {
      ElMessage.error(result.message || '审核失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审核失败，请稍后重试')
    }
  }
}

const handleAddMilestone = (project) => {
  currentProject.value = project
  milestoneForm.name = ''
  milestoneForm.description = ''
  milestoneForm.target_amount = null
  milestoneForm.deadline = ''
  milestoneDialogVisible.value = true
}

const submitMilestone = async () => {
  if (!milestoneForm.name) {
    ElMessage.warning('请输入里程碑名称')
    return
  }

  milestoneLoading.value = true
  try {
    const result = await projectApi.addMilestone(currentProject.value.id, {
      name: milestoneForm.name,
      description: milestoneForm.description,
      target_amount: milestoneForm.target_amount,
      deadline: milestoneForm.deadline
    })
    
    if (result.success) {
      ElMessage.success('里程碑已添加')
      milestoneDialogVisible.value = false
    } else {
      ElMessage.error(result.message || '添加失败')
    }
  } catch (error) {
    ElMessage.error('添加失败，请稍后重试')
  } finally {
    milestoneLoading.value = false
  }
}

const handleAddTask = (project) => {
  currentProject.value = project
  taskForm.name = ''
  taskForm.description = ''
  taskForm.amount = null
  taskForm.vendor_name = ''
  taskDialogVisible.value = true
}

const submitTask = async () => {
  if (!taskForm.name) {
    ElMessage.warning('请输入任务名称')
    return
  }

  taskLoading.value = true
  try {
    const result = await taskApi.create({
      project_id: currentProject.value.id,
      name: taskForm.name,
      description: taskForm.description,
      amount: taskForm.amount,
      vendor_name: taskForm.vendor_name
    })
    
    if (result.success) {
      ElMessage.success('任务已添加')
      taskDialogVisible.value = false
    } else {
      ElMessage.error(result.message || '添加失败')
    }
  } catch (error) {
    ElMessage.error('添加失败，请稍后重试')
  } finally {
    taskLoading.value = false
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
</style>
