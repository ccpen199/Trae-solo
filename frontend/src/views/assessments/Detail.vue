<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-button type="text" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">评估详情 - {{ assessment?.assessment_no || '' }}</h2>
      </div>
      <div>
        <el-button type="primary" @click="openTaskDialog" v-if="assessment?.status !== 'closed'">
          <el-icon><Plus /></el-icon>
          创建挽回任务
        </el-button>
        <el-button type="primary" @click="openReviewDialog" v-if="canReview">复核</el-button>
      </div>
    </div>

    <el-descriptions :column="4" border class="card-wrapper" v-loading="loading">
      <el-descriptions-item label="评估编号">{{ assessment?.assessment_no }}</el-descriptions-item>
      <el-descriptions-item label="客户名称">
        <el-link type="primary" @click="$router.push(`/customers/${assessment?.customer_id}`)">
          {{ assessment?.customer_name }}
        </el-link>
      </el-descriptions-item>
      <el-descriptions-item label="风险分">
        <span :class="['risk-badge', `risk-${assessment?.risk_level}`]">{{ assessment?.risk_score }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="风险等级">
        <el-tag :type="getRiskType(assessment?.risk_level)" size="small">{{ getRiskLevelText(assessment?.risk_level) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="状态" :span="2">
        <el-tag size="small" :type="getStatusType(assessment?.status)">{{ getStatusText(assessment?.status) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建人" :span="2">{{ assessment?.creator_name }}</el-descriptions-item>
      <el-descriptions-item label="风险标签" :span="4">
        <span v-for="tag in parseTags(assessment?.risk_tags)" :key="tag" class="tag-item">{{ tag }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="风险原因" :span="4">
        <ul style="margin: 0; padding-left: 20px;">
          <li v-for="(reason, idx) in parseReasons(assessment?.risk_reasons)" :key="idx">{{ reason }}</li>
        </ul>
      </el-descriptions-item>
      <el-descriptions-item label="复核结果" :span="2" v-if="assessment?.review_result">
        {{ assessment?.review_result }}
      </el-descriptions-item>
      <el-descriptions-item label="复核人" :span="1" v-if="assessment?.reviewer_name">
        {{ assessment?.reviewer_name }}
      </el-descriptions-item>
      <el-descriptions-item label="复核时间" :span="1" v-if="assessment?.review_time">
        {{ assessment?.review_time }}
      </el-descriptions-item>
      <el-descriptions-item label="复核备注" :span="4" v-if="assessment?.review_remark">
        {{ assessment?.review_remark }}
      </el-descriptions-item>
      <el-descriptions-item label="评估时间" :span="2">{{ assessment?.assessment_time }}</el-descriptions-item>
      <el-descriptions-item label="版本" :span="2">v{{ assessment?.version }}</el-descriptions-item>
    </el-descriptions>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="历史版本" name="history">
        <div class="card-wrapper">
          <el-timeline>
            <el-timeline-item
              v-for="item in history"
              :key="item.id"
              :timestamp="item.created_at"
              placement="top"
              :type="getTimelineType(item.status)"
            >
              <div class="flex-between">
                <strong>版本 v{{ item.version }}</strong>
                <span>{{ item.operator_name }}</span>
              </div>
              <p>风险分: {{ item.risk_score }} | 状态: {{ getStatusText(item.status) }}</p>
              <p style="color: #606266;">{{ item.change_log }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-tab-pane>

      <el-tab-pane label="关联任务" name="tasks">
        <div class="card-wrapper">
          <el-table :data="tasks" border>
            <el-table-column prop="task_no" label="任务编号" width="140" />
            <el-table-column prop="task_title" label="任务标题" />
            <el-table-column prop="task_type" label="类型" width="100" />
            <el-table-column prop="priority" label="优先级" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)" size="small">{{ getPriorityText(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee_name" label="负责人" width="100" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="['status-badge', `status-${row.status}`]">{{ getTaskStatusText(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="$router.push(`/tasks/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="reviewDialogVisible" title="复核评估" width="500px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="复核结果">
          <el-radio-group v-model="reviewForm.status">
            <el-radio value="auto_blocked">自动拦截</el-radio>
            <el-radio value="manual_review">人工复核</el-radio>
            <el-radio value="watching">继续观察</el-radio>
            <el-radio value="closed">已关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核结论">
          <el-input v-model="reviewForm.review_result" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reviewForm.review_remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleReview">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import api from '../../api'

const route = useRoute()
const router = useRouter()
const assessmentId = route.params.id
const loading = ref(false)
const submitLoading = ref(false)
const activeTab = ref('history')
const assessment = ref({})
const history = ref([])
const tasks = ref([])
const reviewDialogVisible = ref(false)

const reviewForm = reactive({
  status: 'manual_review',
  review_result: '',
  review_remark: ''
})

const canReview = computed(() => {
  return ['pending', 'manual_review', 'watching'].includes(assessment.value?.status)
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get(`/assessments/${assessmentId}`)
    assessment.value = res.data.assessment
    history.value = res.data.history
    tasks.value = res.data.tasks
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openTaskDialog = () => {
  router.push({ 
    path: '/tasks', 
    query: { customerId: assessment.value.customer_id, assessmentId: assessmentId, create: '1' } 
  })
}

const openReviewDialog = () => {
  reviewForm.status = assessment.value.status === 'pending' ? 'manual_review' : assessment.value.status
  reviewForm.review_result = ''
  reviewForm.review_remark = ''
  reviewDialogVisible.value = true
}

const handleReview = async () => {
  submitLoading.value = true
  try {
    await api.post(`/assessments/${assessmentId}/review`, reviewForm)
    ElMessage.success('复核完成')
    reviewDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const getRiskType = (level) => {
  const types = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }
  return types[level] || 'info'
}

const getRiskLevelText = (level) => {
  const texts = { low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险' }
  return texts[level] || level
}

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    auto_blocked: 'danger',
    manual_review: 'primary',
    watching: 'info',
    closed: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    auto_blocked: '自动拦截',
    manual_review: '人工复核',
    watching: '继续观察',
    closed: '已关闭'
  }
  return texts[status] || status
}

const getTimelineType = (status) => {
  const types = {
    pending: 'warning',
    auto_blocked: 'danger',
    manual_review: 'primary',
    watching: 'info',
    closed: 'success'
  }
  return types[status] || ''
}

const getPriorityType = (priority) => {
  const types = { low: 'info', medium: 'warning', high: 'danger', urgent: 'danger' }
  return types[priority] || 'info'
}

const getPriorityText = (priority) => {
  const texts = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return texts[priority] || priority
}

const getTaskStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const parseTags = (tags) => {
  try {
    return JSON.parse(tags || '[]')
  } catch {
    return []
  }
}

const parseReasons = (reasons) => {
  try {
    return JSON.parse(reasons || '[]')
  } catch {
    return [reasons]
  }
}

onMounted(() => {
  loadData()
})
</script>
