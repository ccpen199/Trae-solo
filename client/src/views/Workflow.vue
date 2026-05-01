<template>
  <div class="workflow-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="workflow-header">
          <div>
            <h2>工作流状态追踪</h2>
            <div class="question-info" v-if="question">
              <router-link :to="`/questions/${questionId}`" class="question-link">
                <el-icon><ArrowLeft /></el-icon>
                返回问题详情
              </router-link>
              <span class="question-title">{{ question.title }}</span>
            </div>
          </div>
          <div class="workflow-status" v-if="question">
            <el-tag :type="getWorkflowStatusType" size="large">
              {{ getCurrentStageName }}
            </el-tag>
          </div>
        </div>
      </template>

      <div v-if="question" class="workflow-content">
        <el-steps :active="currentStepIndex" finish-status="success" align-center>
          <el-step
            v-for="(stage, index) in workflowStages"
            :key="stage.status"
            :title="stage.name"
            :description="stage.description"
          >
            <template #icon>
              <div class="step-icon" :class="{ active: index === currentStepIndex, finished: index < currentStepIndex }">
                <el-icon :size="20">{{ stage.icon }}</el-icon>
              </div>
            </template>
          </el-step>
        </el-steps>

        <el-divider>工作流详情</el-divider>

        <el-timeline>
          <el-timeline-item
            v-for="item in timelineItems"
            :key="item.id"
            :timestamp="formatTime(item.timestamp)"
            placement="top"
            :type="item.type"
            :hollow="item.hollow"
          >
            <el-card class="timeline-card">
              <template #header>
                <div class="timeline-header">
                  <span class="action-name">{{ item.action }}</span>
                  <el-tag :type="item.statusType" size="small">{{ item.status }}</el-tag>
                </div>
              </template>
              <p>{{ item.description }}</p>
              <div class="timeline-meta">
                <span v-if="item.operator">操作人: {{ item.operator }}</span>
                <span v-if="item.engine">处理引擎: {{ item.engine }}</span>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <el-divider>引擎处理记录</el-divider>

        <el-table :data="engineLogs" size="small">
          <el-table-column prop="engine" label="引擎" width="140">
            <template #default="{ row }">
              <el-tag :type="getEngineType(row.engine)" size="small">
                {{ getEngineName(row.engine) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="action" label="操作" width="120" />
          <el-table-column prop="result" label="结果">
            <template #default="{ row }">
              <div class="engine-result">
                <span v-if="Array.isArray(row.result)">
                  <el-tag v-for="(item, idx) in row.result" :key="idx" size="mini" style="margin-right: 5px;">
                    {{ item }}
                  </el-tag>
                </span>
                <span v-else-if="typeof row.result === 'object'">
                  <span v-for="(value, key) in row.result" :key="key">
                    {{ key }}: {{ value }}
                  </span>
                </span>
                <span v-else>{{ row.result }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>

        <el-divider>审计追踪</el-divider>

        <el-table :data="question.auditTrail || []" size="small">
          <el-table-column prop="action" label="操作" width="120" />
          <el-table-column prop="performedBy" label="操作人" width="120" />
          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getRoleName(row.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fromStatus" label="原状态" width="120">
            <template #default="{ row }">
              <span v-if="row.fromStatus">{{ getWorkflowName(row.fromStatus) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="toStatus" label="新状态" width="120">
            <template #default="{ row }">
              <span v-if="row.toStatus">{{ getWorkflowName(row.toStatus) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-if="!loading && !question" description="问题不存在或无工作流记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'

const route = useRoute()
const questionId = computed(() => route.params.questionId)

const loading = ref(false)
const question = ref(null)
const workflowStages = ref([
  { status: 'business_request', name: '业务请求', description: '提问者发布问题', icon: 'Edit' },
  { status: 'processing_ticket', name: '处理工单', description: '语义解析与专家匹配', icon: 'Search' },
  { status: 'associated_credentials', name: '关联凭证', description: '回答撰写与投票', icon: 'ChatDotRound' },
  { status: 'result_confirmation', name: '结果确认', description: '采纳答案与结算', icon: 'CircleCheck' },
  { status: 'archived_record', name: '归档记录', description: '收录知识库', icon: 'Box' }
])

const timelineItems = ref([])
const engineLogs = ref([])

const currentStepIndex = computed(() => {
  if (!question.value) return 0
  const status = question.value.workflowStatus
  const index = workflowStages.value.findIndex(s => s.status === status)
  return index >= 0 ? index : 0
})

const getCurrentStageName = computed(() => {
  if (!question.value) return ''
  const stage = workflowStages.value.find(s => s.status === question.value.workflowStatus)
  return stage?.name || question.value.workflowStatus
})

const getWorkflowStatusType = computed(() => {
  if (!question.value) return 'info'
  const typeMap = {
    'business_request': 'primary',
    'processing_ticket': 'warning',
    'associated_credentials': '',
    'result_confirmation': 'success',
    'archived_record': 'info'
  }
  return typeMap[question.value.workflowStatus] || 'info'
})

const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const getWorkflowName = (status) => {
  const nameMap = {
    'business_request': '业务请求',
    'processing_ticket': '处理工单',
    'associated_credentials': '关联凭证',
    'result_confirmation': '结果确认',
    'archived_record': '归档记录'
  }
  return nameMap[status] || status
}

const getEngineType = (engine) => {
  const typeMap = {
    'expert_matching': 'primary',
    'knowledge_graph': 'success',
    'quality_credit': 'warning',
    'revenue_settlement': 'danger'
  }
  return typeMap[engine] || 'info'
}

const getEngineName = (engine) => {
  const nameMap = {
    'expert_matching': '专家匹配引擎',
    'knowledge_graph': '知识图谱引擎',
    'quality_credit': '信用引擎',
    'revenue_settlement': '结算引擎'
  }
  return nameMap[engine] || engine
}

const getRoleName = (role) => {
  const nameMap = {
    'admin': '管理员',
    'editor': '知识编辑',
    'expert': '行业专家',
    'answerer': '回答者',
    'questioner': '提问者'
  }
  return nameMap[role] || role
}

const loadWorkflow = () => {
  loading.value = true

  question.value = {
    questionId: questionId.value || 'Q-DEMO-001',
    title: '如何优化大型React应用的性能？',
    workflowStatus: 'result_confirmation',
    status: 'solved',
    createdAt: new Date(Date.now() - 86400000 * 3),
    auditTrail: [
      {
        action: '创建问题',
        performedBy: 'testuser',
        role: 'questioner',
        fromStatus: null,
        toStatus: 'business_request',
        timestamp: new Date(Date.now() - 86400000 * 3)
      },
      {
        action: '语义解析完成',
        performedBy: 'System',
        role: 'system',
        fromStatus: 'business_request',
        toStatus: 'processing_ticket',
        timestamp: new Date(Date.now() - 86400000 * 3 + 3600000)
      },
      {
        action: '专家匹配完成',
        performedBy: 'System',
        role: 'system',
        fromStatus: 'processing_ticket',
        toStatus: 'associated_credentials',
        timestamp: new Date(Date.now() - 86400000 * 3 + 7200000)
      },
      {
        action: '回答被采纳',
        performedBy: 'testuser',
        role: 'questioner',
        fromStatus: 'associated_credentials',
        toStatus: 'result_confirmation',
        timestamp: new Date(Date.now() - 86400000)
      }
    ]
  }

  timelineItems.value = [
    {
      id: 1,
      action: '问题发布',
      status: '已完成',
      statusType: 'success',
      description: '提问者发布问题，设置悬赏：100积分 + ¥50',
      operator: 'testuser',
      engine: null,
      timestamp: new Date(Date.now() - 86400000 * 3),
      type: 'primary'
    },
    {
      id: 2,
      action: '语义解析',
      status: '已完成',
      statusType: 'success',
      description: '提取关键词：React、性能优化、大型应用；推断领域：前端开发',
      operator: '系统',
      engine: '专家匹配引擎',
      timestamp: new Date(Date.now() - 86400000 * 3 + 1800000),
      type: 'success'
    },
    {
      id: 3,
      action: '专家匹配',
      status: '已完成',
      statusType: 'success',
      description: '匹配到3位专家：JavaScript专家(评分92)、React专家(评分88)、前端架构师(评分85)',
      operator: '系统',
      engine: '专家匹配引擎',
      timestamp: new Date(Date.now() - 86400000 * 3 + 7200000),
      type: 'success'
    },
    {
      id: 4,
      action: '回答撰写',
      status: '已完成',
      statusType: 'success',
      description: '收到12个回答，内容完整度最高92%，平均答题耗时15分钟',
      operator: '多位回答者',
      engine: '信用引擎',
      timestamp: new Date(Date.now() - 86400000 * 2),
      type: ''
    },
    {
      id: 5,
      action: '答案采纳',
      status: '进行中',
      statusType: 'primary',
      description: '提问者采纳了JavaScript专家的回答，触发结算引擎',
      operator: 'testuser',
      engine: '结算引擎',
      timestamp: new Date(Date.now() - 86400000),
      type: 'warning',
      hollow: true
    }
  ]

  engineLogs.value = [
    {
      engine: 'expert_matching',
      action: '关键词提取',
      result: ['React', '性能优化', '大型应用', '前端开发'],
      createdAt: new Date(Date.now() - 86400000 * 3 + 1800000)
    },
    {
      engine: 'expert_matching',
      action: '专家匹配评分',
      result: { 'JavaScript专家': 92, 'React专家': 88, '前端架构师': 85 },
      createdAt: new Date(Date.now() - 86400000 * 3 + 7200000)
    },
    {
      engine: 'quality_credit',
      action: '内容完整度评估',
      result: { '最高': '92%', '平均': '78%' },
      createdAt: new Date(Date.now() - 86400000 * 2)
    },
    {
      engine: 'revenue_settlement',
      action: '结算处理',
      result: { '状态': '处理中', '预计到账': 'T+1' },
      createdAt: new Date(Date.now() - 3600000)
    }
  ]

  loading.value = false
}

onMounted(() => {
  loadWorkflow()
})
</script>

<style lang="scss" scoped>
.workflow-page {
  max-width: 1200px;
  margin: 0 auto;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
  }

  .question-info {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #909399;
    font-size: 14px;

    .question-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #409eff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .question-title {
      color: #303133;
      font-weight: 500;
    }
  }
}

.workflow-content {
  :deep(.el-steps) {
    padding: 40px 0;
  }
}

.step-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e4e7ed;
  color: #909399;

  &.active {
    background-color: #409eff;
    color: #fff;
  }

  &.finished {
    background-color: #67c23a;
    color: #fff;
  }
}

.timeline-card {
  :deep(.el-card__header) {
    padding: 12px 16px;
  }

  :deep(.el-card__body) {
    padding: 12px 16px;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .action-name {
      font-weight: 600;
      color: #303133;
    }
  }

  p {
    margin: 8px 0;
    color: #606266;
    font-size: 14px;
  }

  .timeline-meta {
    display: flex;
    gap: 20px;
    font-size: 12px;
    color: #909399;
  }
}

.engine-result {
  font-size: 13px;
  color: #606266;
}
</style>
