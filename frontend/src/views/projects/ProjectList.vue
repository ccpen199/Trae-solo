<template>
  <div class="project-list-page">
    <div class="page-header flex justify-between items-center mb-4">
      <div>
        <h2 class="page-title">项目列表</h2>
        <p class="page-subtitle">管理和查看所有项目，追踪项目状态和进度</p>
      </div>
      <el-button
        type="primary"
        @click="showCreateDialog = true"
        v-if="userStore.isProjectManager || userStore.isManagement"
      >
        <el-icon><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <el-card class="mb-4">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable @change="fetchProjects">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="待立项" value="pending_initiation" />
            <el-option label="已立项" value="initiated" />
            <el-option label="任务拆解中" value="task_breakdown" />
            <el-option label="执行协作中" value="executing" />
            <el-option label="验收中" value="acceptance" />
            <el-option label="复盘归档" value="review_archive" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="全部优先级" clearable @change="fetchProjects">
            <el-option label="全部" value="" />
            <el-option label="高优先级" value="high" />
            <el-option label="中优先级" value="medium" />
            <el-option label="低优先级" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索项目名称或编号"
            clearable
            @keyup.enter="fetchProjects"
            @clear="fetchProjects"
          >
            <template #append>
              <el-button icon="Search" @click="fetchProjects" />
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-loading="loading" class="project-cards">
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        @click="goToProject(project.id)"
      >
        <div class="project-card-header">
          <div>
            <div class="project-card-title-row">
              <span class="project-card-title">{{ project.name }}</span>
              <el-tag :type="getPriorityType(project.priority)" size="small" effect="light">
                {{ getPriorityLabel(project.priority) }}
              </el-tag>
            </div>
            <div class="project-card-no">{{ project.project_no }}</div>
          </div>
          <span class="status-tag" :class="`status-${project.status}`">
            {{ getStatusLabel(project.status) }}
          </span>
        </div>
        
        <div class="project-card-body" v-if="project.description">
          <p class="project-description">{{ project.description }}</p>
        </div>
        
        <div class="project-card-footer">
          <div class="project-info">
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>{{ project.project_manager_name || '未分配' }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>截止: {{ project.expected_end_date || '待定' }}</span>
            </div>
          </div>
          
          <div class="project-progress">
            <div class="flex justify-between mb-1">
              <span class="text-sm text-muted">进度</span>
              <span class="text-sm">{{ project.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-bar-fill" 
                :style="{ width: `${project.progress}%` }"
              ></div>
            </div>
          </div>
          
          <div class="project-stats">
            <span class="stat">
              <el-icon><Document /></el-icon>
              {{ project.total_tasks || 0 }} 任务
            </span>
            <span class="stat">
              <el-icon><CircleCheck /></el-icon>
              {{ project.completed_tasks || 0 }} 已完成
            </span>
          </div>
        </div>
      </div>

      <el-empty v-if="projects.length === 0 && !loading" description="暂无项目">
        <template #description>
          <p>当前没有项目</p>
          <el-button
            v-if="userStore.isProjectManager || userStore.isManagement"
            type="primary"
            @click="showCreateDialog = true"
          >
            新建项目
          </el-button>
        </template>
      </el-empty>
    </div>

    <el-dialog
      v-model="showCreateDialog"
      title="项目立项"
      width="700px"
      :close-on-click-modal="false"
      class="create-project-dialog"
    >
      <el-steps :active="createStep" align-center>
        <el-step title="基本信息" />
        <el-step title="里程碑" />
        <el-step title="团队成员" />
        <el-step title="确认提交" />
      </el-steps>

      <div class="create-project-content">
        <div v-show="createStep === 0" class="step-content">
          <el-form
            ref="createFormRef"
            :model="createForm"
            :rules="createRules"
            label-width="100px"
            class="create-form"
          >
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="createForm.name" placeholder="请输入项目名称" maxlength="100" show-word-limit />
            </el-form-item>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="项目类型" prop="project_type">
                  <el-select v-model="createForm.project_type" placeholder="请选择项目类型" style="width: 100%">
                    <el-option label="内部项目" value="internal" />
                    <el-option label="客户项目" value="customer" />
                    <el-option label="研发项目" value="rnd" />
                    <el-option label="运维项目" value="operation" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级" prop="priority">
                  <el-select v-model="createForm.priority" placeholder="请选择优先级" style="width: 100%">
                    <el-option label="高优先级" value="high">
                      <span style="color: #f56c6c">⚠️ 高优先级</span>
                    </el-option>
                    <el-option label="中优先级" value="medium">
                      <span style="color: #e6a23c">⚡ 中优先级</span>
                    </el-option>
                    <el-option label="低优先级" value="low">
                      <span style="color: #67c23a">📋 低优先级</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="项目经理" prop="project_manager_id">
                  <el-select v-model="createForm.project_manager_id" placeholder="请选择项目经理" filterable style="width: 100%">
                    <el-option
                      v-for="user in projectManagers"
                      :key="user.id"
                      :label="user.name"
                      :value="user.id"
                    >
                      <span>{{ user.name }}</span>
                      <span style="color: #909399; margin-left: 8px; font-size: 12px">{{ getRoleLabel(user.role) }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预算">
                  <el-input-number
                    v-model="createForm.budget"
                    :min="0"
                    :precision="2"
                    placeholder="项目预算(元)"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="开始日期">
                  <el-date-picker
                    v-model="createForm.expected_start_date"
                    type="date"
                    placeholder="选择开始日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结束日期">
                  <el-date-picker
                    v-model="createForm.expected_end_date"
                    type="date"
                    placeholder="选择结束日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="项目描述" prop="description">
              <el-input
                v-model="createForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入项目描述，包括项目背景、目标等"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="验收标准">
              <el-input
                v-model="createForm.acceptance_criteria"
                type="textarea"
                :rows="3"
                placeholder="请输入项目验收标准，明确交付物和验收条件"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="风险评估">
              <el-input
                v-model="createForm.risk_assessment"
                type="textarea"
                :rows="2"
                placeholder="请输入项目风险评估和应对措施"
                maxlength="300"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="标签">
              <el-select
                v-model="createForm.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="创建或选择标签"
                style="width: 100%"
              >
                <el-option label="前端开发" value="前端开发" />
                <el-option label="后端开发" value="后端开发" />
                <el-option label="全栈开发" value="全栈开发" />
                <el-option label="测试" value="测试" />
                <el-option label="设计" value="设计" />
                <el-option label="运维" value="运维" />
                <el-option label="紧急" value="紧急" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <div v-show="createStep === 1" class="step-content">
          <div class="step-header">
            <span class="step-title">设置项目里程碑</span>
            <el-button type="primary" link @click="addMilestone">
              <el-icon><Plus /></el-icon>
              添加里程碑
            </el-button>
          </div>
          
          <div class="milestone-list">
            <div
              v-for="(milestone, index) in createForm.milestones"
              :key="index"
              class="milestone-item"
            >
              <div class="milestone-header">
                <span class="milestone-number">里程碑 {{ index + 1 }}</span>
                <el-button type="danger" link @click="removeMilestone(index)" v-if="createForm.milestones.length > 1">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              
              <el-form label-width="80px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="名称">
                      <el-input v-model="milestone.name" placeholder="里程碑名称" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="截止日期">
                      <el-date-picker
                        v-model="milestone.due_date"
                        type="date"
                        placeholder="选择截止日期"
                        value-format="YYYY-MM-DD"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="描述">
                  <el-input
                    v-model="milestone.description"
                    type="textarea"
                    :rows="2"
                    placeholder="里程碑描述和交付物"
                  />
                </el-form-item>
              </el-form>
            </div>
            
            <div v-if="createForm.milestones.length === 0" class="empty-milestones">
              <el-empty description="暂无里程碑，点击上方按钮添加" :image-size="60" />
            </div>
          </div>
        </div>

        <div v-show="createStep === 2" class="step-content">
          <div class="step-header">
            <span class="step-title">选择团队成员</span>
          </div>
          
          <el-form label-width="100px">
            <el-form-item label="开发成员">
              <el-select
                v-model="createForm.team_members"
                multiple
                filterable
                placeholder="选择开发成员"
                style="width: 100%"
              >
                <el-option
                  v-for="user in members"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
                >
                  <span>{{ user.name }}</span>
                  <span style="color: #909399; margin-left: 8px; font-size: 12px">{{ getRoleLabel(user.role) }}</span>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="测试人员">
              <el-select
                v-model="createForm.testers"
                multiple
                filterable
                placeholder="选择测试人员"
                style="width: 100%"
              >
                <el-option
                  v-for="user in testers"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
                >
                  <span>{{ user.name }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <div v-show="createStep === 3" class="step-content">
          <div class="review-section">
            <h4 class="review-title">项目信息确认</h4>
            
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="项目名称">{{ createForm.name }}</el-descriptions-item>
              <el-descriptions-item label="项目类型">
                <el-tag size="small">{{ getProjectTypeLabel(createForm.project_type) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag :type="getPriorityType(createForm.priority)" size="small">
                  {{ getPriorityLabel(createForm.priority) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="项目经理">
                {{ getUserName(createForm.project_manager_id) }}
              </el-descriptions-item>
              <el-descriptions-item label="周期">
                {{ createForm.expected_start_date || '待定' }} ~ {{ createForm.expected_end_date || '待定' }}
              </el-descriptions-item>
              <el-descriptions-item label="预算">
                {{ createForm.budget ? `¥${createForm.budget.toLocaleString()}` : '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item label="项目描述" :span="2">
                {{ createForm.description || '未填写' }}
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="createForm.milestones.length > 0" class="review-milestones">
              <h5 class="review-subtitle">里程碑 ({{ createForm.milestones.length }})</h5>
              <div class="milestone-preview">
                <div
                  v-for="(milestone, index) in createForm.milestones"
                  :key="index"
                  class="milestone-preview-item"
                >
                  <span class="milestone-name">{{ index + 1 }}. {{ milestone.name || '未命名' }}</span>
                  <span class="milestone-date" v-if="milestone.due_date">{{ milestone.due_date }}</span>
                </div>
              </div>
            </div>

            <div v-if="createForm.team_members.length > 0 || createForm.testers.length > 0" class="review-team">
              <h5 class="review-subtitle">团队成员</h5>
              <div class="team-preview">
                <div v-if="createForm.team_members.length > 0" class="team-section">
                  <span class="team-label">开发:</span>
                  <span class="team-members">{{ createForm.team_members.map(id => getUserName(id)).join('、') }}</span>
                </div>
                <div v-if="createForm.testers.length > 0" class="team-section">
                  <span class="team-label">测试:</span>
                  <span class="team-members">{{ createForm.testers.map(id => getUserName(id)).join('、') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <div class="footer-left">
            <el-button @click="showCreateDialog = false">取消</el-button>
            <el-button @click="saveDraft" :loading="creating" v-if="createStep < 3">
              保存草稿
            </el-button>
          </div>
          <div class="footer-right">
            <el-button @click="prevStep" v-if="createStep > 0">
              上一步
            </el-button>
            <el-button type="primary" @click="nextStep" v-if="createStep < 3">
              下一步
            </el-button>
            <el-button type="primary" @click="submitProject" :loading="creating" v-if="createStep === 3">
              提交立项
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)
const projects = ref([])
const users = ref([])
const createFormRef = ref(null)
const createStep = ref(0)

const searchForm = reactive({
  status: '',
  priority: '',
  keyword: ''
})

const createForm = reactive({
  name: '',
  description: '',
  project_type: '',
  priority: 'medium',
  project_manager_id: '',
  expected_start_date: '',
  expected_end_date: '',
  budget: undefined,
  tags: [],
  acceptance_criteria: '',
  risk_assessment: '',
  milestones: [],
  team_members: [],
  testers: []
})

const createRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '项目名称长度在2-100个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  project_manager_id: [
    { required: true, message: '请选择项目经理', trigger: 'change' }
  ],
  project_type: [
    { required: true, message: '请选择项目类型', trigger: 'change' }
  ]
}

const projectManagers = computed(() => {
  return users.value.filter(u => u.role === 'project_manager' || u.role === 'management')
})

const members = computed(() => {
  return users.value.filter(u => u.role === 'member' || u.role === 'project_manager')
})

const testers = computed(() => {
  return users.value.filter(u => u.role === 'tester')
})

const getStatusLabel = (status) => {
  const map = {
    draft: '草稿',
    pending_initiation: '待立项',
    initiated: '已立项',
    task_breakdown: '任务拆解中',
    executing: '执行协作中',
    acceptance: '验收中',
    review_archive: '复盘归档',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getPriorityLabel = (priority) => {
  const map = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return map[priority] || priority
}

const getPriorityType = (priority) => {
  const map = { high: 'danger', medium: 'warning', low: 'success' }
  return map[priority] || 'info'
}

const getRoleLabel = (role) => {
  const map = {
    project_manager: '项目经理',
    member: '开发成员',
    tester: '测试人员',
    customer: '客户代表',
    management: '管理层'
  }
  return map[role] || role
}

const getProjectTypeLabel = (type) => {
  const map = {
    internal: '内部项目',
    customer: '客户项目',
    rnd: '研发项目',
    operation: '运维项目'
  }
  return map[type] || type
}

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user?.name || userId
}

const fetchProjects = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.priority) params.priority = searchForm.priority
    if (searchForm.keyword) params.search = searchForm.keyword
    
    const response = await api.get('/projects', { params })
    if (response.success) {
      projects.value = response.data || []
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    ElMessage.error('获取项目列表失败')
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const response = await api.get('/auth/users')
    if (response.success) {
      users.value = response.data || []
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const addMilestone = () => {
  createForm.milestones.push({
    name: '',
    description: '',
    due_date: ''
  })
}

const removeMilestone = (index) => {
  createForm.milestones.splice(index, 1)
}

const nextStep = async () => {
  if (createStep === 0) {
    const valid = await createFormRef.value.validate().catch(() => false)
    if (!valid) return
  }
  createStep.value++
}

const prevStep = () => {
  createStep.value--
}

const handleCreateProject = async (submitType = 'submit') => {
  creating.value = true
  try {
    const data = { ...createForm }
    
    if (data.tags && data.tags.length === 0) delete data.tags
    if (data.milestones && data.milestones.length === 0) delete data.milestones
    if (data.team_members && data.team_members.length === 0) delete data.team_members
    if (data.testers && data.testers.length === 0) delete data.testers
    
    const response = await api.post('/projects', data)
    if (response.success) {
      ElMessage.success(submitType === 'draft' ? '草稿保存成功' : '项目创建成功')
      showCreateDialog.value = false
      resetCreateForm()
      fetchProjects()
    }
  } catch (error) {
    console.error('创建项目失败:', error)
    ElMessage.error(error.message || '创建项目失败')
  } finally {
    creating.value = false
  }
}

const saveDraft = () => {
  handleCreateProject('draft')
}

const submitProject = () => {
  handleCreateProject('submit')
}

const resetCreateForm = () => {
  createForm.name = ''
  createForm.description = ''
  createForm.project_type = ''
  createForm.priority = 'medium'
  createForm.project_manager_id = ''
  createForm.expected_start_date = ''
  createForm.expected_end_date = ''
  createForm.budget = undefined
  createForm.tags = []
  createForm.acceptance_criteria = ''
  createForm.risk_assessment = ''
  createForm.milestones = []
  createForm.team_members = []
  createForm.testers = []
  createStep.value = 0
}

const goToProject = (projectId) => {
  router.push(`/projects/${projectId}`)
}

showCreateDialog.value = false

onMounted(() => {
  fetchProjects()
  fetchUsers()
})
</script>

<style scoped>
.project-list-page {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.project-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.project-card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.project-card-no {
  font-size: 12px;
  color: #909399;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-draft {
  background: #f4f4f5;
  color: #909399;
}

.status-pending_initiation {
  background: #ecf5ff;
  color: #409eff;
}

.status-initiated,
.status-task_breakdown {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-executing {
  background: #f0f9eb;
  color: #67c23a;
}

.status-acceptance {
  background: #fef0f0;
  color: #f56c6c;
}

.status-review_archive {
  background: #f4f4f5;
  color: #909399;
}

.status-completed {
  background: #f0f9eb;
  color: #67c23a;
}

.project-card-body {
  margin-bottom: 16px;
}

.project-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card-footer {
  border-top: 1px solid #f5f7fa;
  padding-top: 16px;
}

.project-info {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.project-progress {
  margin-bottom: 12px;
}

.progress-bar {
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #409eff;
  border-radius: 3px;
  transition: width 0.3s;
}

.project-stats {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #909399;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.create-project-content {
  margin-top: 24px;
  min-height: 400px;
}

.step-content {
  padding: 8px 0;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.step-title {
  font-weight: 600;
  color: #303133;
}

.create-form {
  max-width: 100%;
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.milestone-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.milestone-number {
  font-weight: 600;
  color: #409eff;
}

.empty-milestones {
  padding: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.review-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.review-subtitle {
  margin: 16px 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.milestone-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.milestone-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
}

.milestone-name {
  font-size: 13px;
  color: #303133;
}

.milestone-date {
  font-size: 12px;
  color: #909399;
}

.team-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
}

.team-label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.team-members {
  font-size: 13px;
  color: #303133;
}
</style>
