<template>
  <div class="project-detail-page">
    <div class="page-header flex justify-between items-start mb-4">
      <div>
        <el-breadcrumb separator="/" class="mb-2">
          <el-breadcrumb-item :to="{ path: '/projects' }">项目列表</el-breadcrumb-item>
          <el-breadcrumb-item>{{ project?.name }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="page-title-row">
          <h2 class="page-title">{{ project?.name }}</h2>
          <el-tag :type="getStatusType(project?.status)" size="large">
            {{ getStatusLabel(project?.status) }}
          </el-tag>
        </div>
        <p class="page-subtitle">
          {{ project?.project_no }} · {{ getProjectTypeLabel(project?.project_type) }} · {{ project?.project_manager_name }}
        </p>
      </div>
      <div class="header-actions">
        <router-link :to="`/projects/${projectId}/kanban`">
          <el-button type="primary">
            <el-icon><Share /></el-icon>
            任务看板
          </el-button>
        </router-link>
      </div>
    </div>

    <el-card class="mb-4 workflow-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">项目流程状态图</span>
          <el-tag type="info" effect="plain">
            当前阶段: {{ getStatusLabel(project?.status) }}
          </el-tag>
        </div>
      </template>
      
      <div class="workflow-container">
        <div class="workflow-steps">
          <div 
            v-for="(step, index) in workflowSteps" 
            :key="step.code"
            class="workflow-step"
            :class="{
              'is-completed': step.status === 'completed',
              'is-current': step.status === 'current',
              'is-future': step.status === 'future'
            }"
          >
            <div class="step-indicator">
              <div class="step-icon">
                <el-icon v-if="step.status === 'completed'" :size="18"><Check /></el-icon>
                <span v-else-if="step.status === 'current'" class="current-number">{{ step.order }}</span>
                <span v-else class="future-number">{{ step.order }}</span>
              </div>
              <div class="step-label">{{ step.name }}</div>
            </div>
            
            <div class="step-connector" v-if="index < workflowSteps.length - 1">
              <div class="connector-line" :class="{ 'is-completed': step.status === 'completed' }"></div>
            </div>
          </div>
        </div>
        
        <div class="workflow-detail" v-if="currentStepInfo">
          <div class="workflow-detail-header">
            <span class="detail-title">当前状态详情</span>
          </div>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <div class="detail-label">当前状态</div>
                <div class="detail-value">
                  <el-tag :type="getStatusType(project?.status)" size="large">
                    {{ getStatusLabel(project?.status) }}
                  </el-tag>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <div class="detail-label">责任人</div>
                <div class="detail-value">
                  <el-tag type="warning" size="large">
                    {{ getRoleLabel(currentStepInfo.responsible) }}
                  </el-tag>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <div class="detail-label">下一状态</div>
                <div class="detail-value">
                  <el-tag type="info" size="large" effect="plain">
                    {{ currentStepInfo.downstream ? getStatusLabel(currentStepInfo.downstream) : '无' }}
                  </el-tag>
                </div>
              </div>
            </el-col>
          </el-row>

          <div class="workflow-actions" v-if="availableTransitions && availableTransitions.length > 0">
            <div class="actions-title">可用动作</div>
            <div class="action-buttons">
              <el-button
                v-for="transition in availableTransitions"
                :key="transition.action_code"
                :type="getTransitionType(transition.action_code)"
                :icon="getTransitionIcon(transition.action_code)"
                @click="handleTransition(transition)"
                size="large"
              >
                {{ transition.action_name }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="mb-4" v-if="project && (project.acceptance_criteria || project.risk_assessment)">
          <template #header>
            <div class="card-header">
              <span class="card-title">项目规范</span>
            </div>
          </template>
          
          <el-descriptions :column="1" border>
            <el-descriptions-item label="验收标准" v-if="project.acceptance_criteria">
              <div class="text-content">{{ project.acceptance_criteria }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="风险评估" v-if="project.risk_assessment">
              <div class="text-content">{{ project.risk_assessment }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="mb-4" v-if="project?.milestones && project.milestones.length > 0">
          <template #header>
            <div class="card-header">
              <span class="card-title">项目里程碑</span>
              <el-tag type="info" effect="plain">共 {{ project.milestones.length }} 个</el-tag>
            </div>
          </template>
          
          <div class="milestone-list">
            <div 
              v-for="(milestone, index) in project.milestones" 
              :key="milestone.id"
              class="milestone-item"
            >
              <div class="milestone-header">
                <div class="milestone-info">
                  <span class="milestone-order">{{ index + 1 }}</span>
                  <span class="milestone-name">{{ milestone.name }}</span>
                </div>
                <div class="milestone-meta">
                  <span class="milestone-date" v-if="milestone.due_date">
                    <el-icon><Calendar /></el-icon>
                    {{ milestone.due_date }}
                  </span>
                  <el-tag :type="getMilestoneStatusType(milestone.status)" size="small">
                    {{ getMilestoneStatusLabel(milestone.status) }}
                  </el-tag>
                </div>
              </div>
              <div class="milestone-description" v-if="milestone.description">
                {{ milestone.description }}
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="mb-4">
          <template #header>
            <div class="card-header">
              <span class="card-title">项目信息</span>
            </div>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目编号">
              {{ project?.project_no }}
            </el-descriptions-item>
            <el-descriptions-item label="项目类型">
              <el-tag type="primary">{{ getProjectTypeLabel(project?.project_type) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="getPriorityType(project?.priority)">
                {{ getPriorityLabel(project?.priority) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="预算">
              {{ project?.budget ? `¥${project.budget.toLocaleString()}` : '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="项目经理">
              {{ project?.project_manager_name || '未分配' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建人">
              {{ project?.creator_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="预期开始日期">
              {{ project?.expected_start_date || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="预期结束日期">
              {{ project?.expected_end_date || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="进度" :span="2">
              <el-progress 
                :percentage="project?.progress || 0" 
                :stroke-width="18"
                :color="getProgressColor(project?.progress)"
              />
            </el-descriptions-item>
            <el-descriptions-item label="项目描述" :span="2">
              <div class="text-content">{{ project?.description || '暂无描述' }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="标签" :span="2" v-if="project?.tags && project.tags.length > 0">
              <div class="tag-list">
                <el-tag 
                  v-for="tag in project.tags" 
                  :key="tag" 
                  size="small" 
                  style="margin-right: 6px;"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="团队成员" :span="2" v-if="project?.team_members && project.team_members.length > 0">
              <div class="tag-list">
                <el-tag 
                  v-for="member in project.team_members" 
                  :key="member" 
                  size="small"
                  type="primary"
                  effect="plain"
                  style="margin-right: 6px;"
                >
                  {{ member }}
                </el-tag>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">时间轴</span>
            </div>
          </template>
          
          <div v-if="timeline.length > 0" class="timeline-container">
            <div
              v-for="item in timeline"
              :key="item.id"
              class="timeline-item"
            >
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-user">{{ item.user }}</span>
                  <span class="timeline-time">{{ formatTime(item.createdAt) }}</span>
                </div>
                <div v-if="item.type === 'log'" class="timeline-log">
                  <span class="log-action">{{ getActionLabel(item.action) }}</span>
                  <span v-if="item.oldValue && item.newValue" class="log-change">
                    {{ formatChange(item.oldValue, item.newValue) }}
                  </span>
                </div>
                <div v-else class="timeline-comment">
                  {{ item.content }}
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无记录" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header">
              <span class="card-title">项目统计</span>
            </div>
          </template>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ statistics?.tasks?.total || 0 }}</div>
              <div class="stat-label">任务总数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value completed">{{ statistics?.tasks?.byStatus?.done || 0 }}</div>
              <div class="stat-label">已完成</div>
            </div>
            <div class="stat-item">
              <div class="stat-value in-progress">{{ statistics?.tasks?.byStatus?.in_progress || 0 }}</div>
              <div class="stat-label">进行中</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics?.progress || 0 }}%</div>
              <div class="stat-label">完成率</div>
            </div>
          </div>
        </el-card>

        <el-card class="mb-4" v-if="stateActions">
          <template #header>
            <div class="card-header">
              <span class="card-title">状态动作说明</span>
            </div>
          </template>
          
          <div class="action-list">
            <div class="action-group">
              <div class="action-group-title">允许的动作</div>
              <div class="action-items">
                <el-tag
                  v-for="action in stateActions.allowed"
                  :key="action"
                  size="small"
                  type="success"
                  effect="plain"
                >
                  {{ getActionLabel(action) }}
                </el-tag>
              </div>
            </div>
            
            <div class="action-group" v-if="stateActions.forbidden && stateActions.forbidden.length > 0">
              <div class="action-group-title">禁止的动作</div>
              <div class="action-items">
                <el-tag
                  v-for="action in stateActions.forbidden"
                  :key="action"
                  size="small"
                  type="info"
                  effect="plain"
                  disabled
                >
                  {{ getActionLabel(action) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">快速操作</span>
            </div>
          </template>
          
          <div class="quick-actions">
            <router-link :to="`/projects/${projectId}/kanban`" class="quick-action">
              <el-icon><Share /></el-icon>
              <span>任务看板</span>
            </router-link>
            <router-link :to="`/projects/${projectId}/gantt`" class="quick-action">
              <el-icon><Calendar /></el-icon>
              <span>甘特图</span>
            </router-link>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="showTransitionDialog"
      title="状态流转确认"
      width="500px"
    >
      <el-form
        ref="transitionFormRef"
        :model="transitionForm"
        :rules="transitionRules"
        label-width="80px"
      >
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(project?.status)">{{ getStatusLabel(project?.status) }}</el-tag>
        </el-form-item>
        <el-form-item label="目标状态">
          <el-tag type="primary">{{ transitionForm.targetState }}</el-tag>
        </el-form-item>
        <el-form-item label="流转动作">
          <el-tag :type="getTransitionType(transitionForm.action)">
            {{ transitionForm.actionName }}
          </el-tag>
        </el-form-item>
        <el-form-item label="备注/意见" prop="comment">
          <el-input
            v-model="transitionForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入备注或审批意见（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTransitionDialog = false">取消</el-button>
        <el-button type="primary" :loading="transitioning" @click="submitTransition">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => route.params.id)
const loading = ref(false)
const transitioning = ref(false)
const project = ref(null)
const statistics = ref(null)
const timeline = ref([])
const availableTransitions = ref([])
const stateActions = ref(null)
const showTransitionDialog = ref(false)
const transitionFormRef = ref(null)

const transitionForm = reactive({
  action: '',
  actionName: '',
  targetState: '',
  comment: ''
})

const transitionRules = {
  comment: [
    { max: 500, message: '备注最多500字', trigger: 'blur' }
  ]
}

const workflowOrder = [
  'draft',
  'pending_initiation',
  'initiated',
  'task_breakdown',
  'executing',
  'acceptance',
  'review_archive',
  'completed'
]

const workflowSteps = computed(() => {
  const currentStatus = project.value?.status
  const currentIndex = workflowOrder.indexOf(currentStatus)
  
  return workflowOrder.map((code, index) => {
    let status = 'future'
    if (index < currentIndex) status = 'completed'
    else if (index === currentIndex) status = 'current'
    
    return {
      code,
      name: getStatusLabel(code),
      order: index + 1,
      status
    }
  })
})

const currentStepInfo = computed(() => {
  if (!stateActions.value) return null
  return stateActions.value
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

const getStatusType = (status) => {
  const map = {
    draft: 'info',
    pending_initiation: 'primary',
    initiated: 'primary',
    task_breakdown: 'warning',
    executing: 'success',
    acceptance: 'danger',
    review_archive: 'info',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getPriorityType = (priority) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const map = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return map[priority] || priority
}

const getProjectTypeLabel = (type) => {
  const map = {
    internal: '内部项目',
    customer: '客户项目',
    rnd: '研发项目',
    operation: '运维项目'
  }
  return map[type] || '内部项目'
}

const getActionLabel = (action) => {
  const map = {
    view: '查看',
    edit: '编辑',
    submit: '提交',
    delete: '删除',
    approve: '审批',
    approve_init: '批准立项',
    reject_init: '驳回立项',
    start_breakdown: '开始任务拆解',
    complete_breakdown: '完成任务拆解',
    execute_task: '执行任务',
    update_task: '更新任务',
    enter_acceptance: '进入验收',
    test: '测试',
    approve_acceptance: '批准验收',
    reject_acceptance: '驳回验收',
    pass_acceptance: '验收通过',
    fail_acceptance: '验收驳回',
    review: '复盘',
    archive: '归档',
    complete_review: '完成复盘归档',
    export: '导出',
    create_task: '创建任务',
    edit_task: '编辑任务',
    breakdown: '拆解',
    cancel: '取消',
    accept: '验收'
  }
  return map[action] || action
}

const getRoleLabel = (role) => {
  const map = {
    project_manager: '项目经理',
    member: '开发成员',
    tester: '测试人员',
    customer: '客户代表',
    management: '管理层',
    unknown: '未知'
  }
  return map[role] || role
}

const getMilestoneStatusType = (status) => {
  const map = {
    pending: 'info',
    in_progress: 'primary',
    completed: 'success',
    overdue: 'danger'
  }
  return map[status] || 'info'
}

const getMilestoneStatusLabel = (status) => {
  const map = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return map[status] || '待开始'
}

const getTransitionType = (actionCode) => {
  const approveActions = ['approve_init', 'pass_acceptance', 'complete_review']
  const rejectActions = ['reject_init', 'fail_acceptance', 'cancel']
  const submitActions = ['submit', 'start_breakdown', 'complete_breakdown', 'enter_acceptance']
  
  if (approveActions.includes(actionCode)) return 'success'
  if (rejectActions.includes(actionCode)) return 'danger'
  if (submitActions.includes(actionCode)) return 'primary'
  return 'default'
}

const getTransitionIcon = (actionCode) => {
  const iconMap = {
    submit: 'Plus',
    approve_init: 'CircleCheck',
    reject_init: 'CircleClose',
    start_breakdown: 'List',
    complete_breakdown: 'Check',
    enter_acceptance: 'Document',
    pass_acceptance: 'CircleCheck',
    fail_acceptance: 'CircleClose',
    complete_review: 'FolderChecked',
    cancel: 'Delete'
  }
  return iconMap[actionCode] || null
}

const getProgressColor = (progress) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 50) return '#409eff'
  if (progress >= 20) return '#e6a23c'
  return '#909399'
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const formatChange = (oldValue, newValue) => {
  try {
    const oldVal = typeof oldValue === 'string' ? JSON.parse(oldValue) : oldValue
    const newVal = typeof newValue === 'string' ? JSON.parse(newValue) : newValue
    
    if (oldVal.status && newVal.status) {
      return `${getStatusLabel(oldVal.status)} → ${getStatusLabel(newVal.status)}`
    }
    return '状态变更'
  } catch {
    return '状态变更'
  }
}

const fetchProject = async () => {
  loading.value = true
  try {
    const response = await api.get(`/projects/${projectId.value}`)
    if (response.success) {
      project.value = response.data
      availableTransitions.value = response.data.availableTransitions || []
      stateActions.value = response.data.stateActions || null
    }
  } catch (error) {
    console.error('获取项目详情失败:', error)
    ElMessage.error('获取项目详情失败')
  } finally {
    loading.value = false
  }
}

const fetchStatistics = async () => {
  try {
    const response = await api.get(`/projects/${projectId.value}/statistics`)
    if (response.success) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('获取项目统计失败:', error)
  }
}

const fetchTimeline = async () => {
  try {
    const response = await api.get(`/projects/${projectId.value}/timeline`)
    if (response.success) {
      timeline.value = response.data || []
    }
  } catch (error) {
    console.error('获取时间轴失败:', error)
  }
}

const handleTransition = (transition) => {
  transitionForm.action = transition.action_code
  transitionForm.actionName = transition.action_name
  transitionForm.targetState = getStatusLabel(transition.to_state)
  transitionForm.comment = ''
  showTransitionDialog.value = true
}

const submitTransition = async () => {
  transitioning.value = true
  try {
    const response = await api.post(`/projects/${projectId.value}/transition`, {
      action: transitionForm.action,
      comment: transitionForm.comment
    })
    
    if (response.success) {
      ElMessage.success('状态流转成功')
      showTransitionDialog.value = false
      fetchProject()
      fetchTimeline()
    }
  } catch (error) {
    console.error('状态流转失败:', error)
    ElMessage.error(error.message || '状态流转失败')
  } finally {
    transitioning.value = false
  }
}

onMounted(() => {
  fetchProject()
  fetchStatistics()
  fetchTimeline()
})
</script>

<style scoped>
.project-detail-page {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 8px 0 0 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  color: #303133;
}

.workflow-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.workflow-card :deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
}

.workflow-card :deep(.card-title) {
  color: white;
}

.workflow-card :deep(.el-tag) {
  background: rgba(255, 255, 255, 0.2);
  border-color: transparent;
  color: white;
}

.workflow-card :deep(.el-card__body) {
  background: white;
  padding: 20px;
}

.workflow-container {
  padding: 0;
}

.workflow-steps {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 16px 0;
  position: relative;
}

.workflow-steps::before {
  content: '';
  position: absolute;
  top: 24px;
  left: 60px;
  right: 60px;
  height: 3px;
  background: #e4e7ed;
  z-index: 0;
}

.workflow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border: 3px solid #e4e7ed;
  transition: all 0.3s;
}

.workflow-step.is-completed .step-icon {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-color: #67c23a;
  color: white;
}

.workflow-step.is-current .step-icon {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-color: #409eff;
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transform: scale(1.1);
}

.current-number,
.future-number {
  font-size: 18px;
  font-weight: bold;
}

.step-label {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #909399;
  text-align: center;
}

.workflow-step.is-completed .step-label {
  color: #67c23a;
}

.workflow-step.is-current .step-label {
  color: #409eff;
  font-weight: 600;
}

.step-connector {
  position: absolute;
  top: 24px;
  left: 50%;
  width: calc(100% - 48px);
  height: 3px;
  z-index: 0;
}

.connector-line {
  width: 100%;
  height: 100%;
  background: #e4e7ed;
  transition: all 0.3s;
}

.connector-line.is-completed {
  background: #67c23a;
}

.workflow-detail {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
}

.workflow-detail-header {
  margin-bottom: 16px;
}

.detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.detail-item {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.detail-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.detail-value {
  font-size: 14px;
}

.workflow-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.actions-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.text-content {
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.milestone-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.milestone-order {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.milestone-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.milestone-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.milestone-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.milestone-description {
  font-size: 13px;
  color: #606266;
  padding-left: 40px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.transition-actions {
  padding: 8px 0;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.current-status .label {
  color: #606266;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-container {
  max-height: 500px;
  overflow-y: auto;
}

.timeline-item {
  position: relative;
  padding-left: 24px;
  padding-bottom: 20px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  z-index: 1;
}

.timeline-item::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 20px;
  width: 2px;
  height: calc(100% - 10px);
  background: #e4e7ed;
}

.timeline-item:last-child::after {
  display: none;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.timeline-user {
  font-weight: 500;
  color: #303133;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
}

.timeline-log,
.timeline-comment {
  font-size: 13px;
  color: #606266;
}

.log-action {
  color: #409eff;
  margin-right: 8px;
}

.log-change {
  color: #909399;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-value.completed {
  color: #67c23a;
}

.stat-value.in-progress {
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-group {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.action-group-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.action-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  text-decoration: none;
  color: #606266;
  transition: all 0.2s;
}

.quick-action:hover {
  background: #ecf5ff;
  color: #409eff;
}

.quick-action .el-icon {
  font-size: 18px;
}
</style>
