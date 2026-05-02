<template>
  <div v-loading="loading">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div>
                <el-tag :type="getStatusType(document?.status)" size="large" style="margin-right: 10px">
                  {{ getStatusLabel(document?.status) }}
                </el-tag>
                <span style="font-size: 18px; font-weight: bold">{{ document?.title }}</span>
              </div>
              <span style="color: #909399">单号: {{ document?.main_order_no }}</span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="创建人">{{ document?.creator_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="责任人">{{ document?.responsible_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前步骤">{{ getStepLabel(document?.current_step) }}</el-descriptions-item>
            <el-descriptions-item label="版本">v{{ document?.version }}</el-descriptions-item>
            <el-descriptions-item label="期望完成时间">{{ document?.expected_completion_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(document?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="标签" :span="2">
              <el-tag v-for="tag in tags" :key="tag.id" :color="tag.color" size="small" style="margin-right: 4px">
                {{ tag.name }}
              </el-tag>
              <span v-if="!tags?.length">-</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider>文档内容</el-divider>

          <div class="document-content" v-html="formattedContent"></div>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>操作记录（时间轴）</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(event, index) in timeline"
              :key="event.id"
              :timestamp="formatTime(event.created_at)"
              placement="top"
            >
              <el-card>
                <h4 style="margin: 0 0 10px">
                  <el-tag :type="getTimelineTagType(event.event_type)" size="small">
                    {{ getTimelineTypeLabel(event.event_type) }}
                  </el-tag>
                  {{ event.event_title }}
                </h4>
                <p style="color: #606266; margin: 0">{{ event.event_details }}</p>
                <p style="color: #909399; font-size: 12px; margin: 8px 0 0">
                  操作人: {{ event.user_name || '系统' }}
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>可用操作</span>
          </template>
          <div style="display: flex; flex-direction: column; gap: 10px">
            <el-button
              v-for="action in availableActions"
              :key="action.action"
              :type="getActionButtonType(action.action)"
              @click="executeAction(action.action)"
            >
              {{ action.label }}
            </el-button>
            <el-button @click="$router.back()">返回</el-button>
          </div>
        </el-card>

        <el-card style="margin-top: 20px" v-if="document?.status === 'pending_review'">
          <template #header>
            <span>审核操作</span>
          </template>
          <el-form :model="reviewForm" label-width="80px">
            <el-form-item label="操作">
              <el-radio-group v-model="reviewForm.action">
                <el-radio value="approve">通过</el-radio>
                <el-radio value="reject">驳回</el-radio>
                <el-radio value="supplement">补充资料</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="意见">
              <el-input v-model="reviewForm.comment" type="textarea" :rows="3" placeholder="请输入审核意见" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="actionLoading" @click="submitReview">提交</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px" v-if="document?.status === 'pending_update'">
          <template #header>
            <span>更新操作</span>
          </template>
          <el-form :model="updateForm" label-width="80px">
            <el-form-item label="操作">
              <el-radio-group v-model="updateForm.action">
                <el-radio value="approve">通过更新</el-radio>
                <el-radio value="reject">驳回更新</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="意见">
              <el-input v-model="updateForm.comment" type="textarea" :rows="3" placeholder="请输入意见" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="actionLoading" @click="submitUpdateReview">提交</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px" v-if="versions?.length > 0">
          <template #header>
            <span>版本历史</span>
          </template>
          <el-table :data="versions" size="small">
            <el-table-column prop="version_no" label="版本" width="80">
              <template #default="{ row }">
                v{{ row.version_no }}
              </template>
            </el-table-column>
            <el-table-column prop="change_log" label="变更说明" show-overflow-tooltip />
            <el-table-column prop="created_at" label="时间" width="140">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" v-if="canRollback">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="rollbackVersion(row)">回退</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>流程步骤</span>
          </template>
          <el-steps direction="vertical" :active="currentWorkflowStep">
            <el-step
              v-for="step in workflowSteps"
              :key="step.id"
              :title="getStepLabel(step.step_name)"
              :description="step.status === 'completed' ? `完成于: ${formatTime(step.completed_at)}` : step.status === 'in_progress' ? '进行中' : '未开始'"
              :status="getStepStatus(step.status)"
            />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="rollbackDialogVisible" title="版本回退" width="400px">
      <el-form label-width="80px">
        <el-form-item label="回退原因">
          <el-input v-model="rollbackReason" type="textarea" :rows="3" placeholder="请输入回退原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rollbackDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmRollback">确认回退</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { documentApi, userApi } from '@/api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const actionLoading = ref(false)
const document = ref(null)
const tags = ref([])
const versions = ref([])
const timeline = ref([])
const workflowSteps = ref([])
const availableActions = ref([])

const reviewForm = reactive({
  action: 'approve',
  comment: ''
})

const updateForm = reactive({
  action: 'approve',
  comment: ''
})

const rollbackDialogVisible = ref(false)
const rollbackVersionData = ref(null)
const rollbackReason = ref('')

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const formattedContent = computed(() => {
  if (!document.value?.content) return '<p style="color: #909399">暂无内容</p>'
  return document.value.content.replace(/\n/g, '<br/>')
})

const canRollback = computed(() => {
  return user.value.role === 'admin' || user.value.role === 'knowledge_manager'
})

const currentWorkflowStep = computed(() => {
  if (!workflowSteps.value.length) return 0
  const inProgressIndex = workflowSteps.value.findIndex(s => s.status === 'in_progress')
  if (inProgressIndex >= 0) return inProgressIndex
  const completedCount = workflowSteps.value.filter(s => s.status === 'completed').length
  return completedCount
})

const getStatusType = (status) => {
  const types = {
    pending_creation: 'info',
    pending_review: 'warning',
    published: 'success',
    pending_use: '',
    pending_update: 'warning'
  }
  return types[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    pending_creation: '待创建',
    pending_review: '待审核',
    published: '已发布',
    pending_use: '待使用',
    pending_update: '待更新'
  }
  return labels[status] || status
}

const getStepLabel = (step) => {
  const labels = {
    create: '创建',
    review: '分类审核',
    publish: '发布',
    use: '搜索使用',
    update: '更新迭代'
  }
  return labels[step] || step
}

const getStepStatus = (status) => {
  const map = {
    pending: '',
    in_progress: 'process',
    completed: 'finish'
  }
  return map[status] || ''
}

const getTimelineTagType = (type) => {
  const types = {
    create: 'primary',
    edit: '',
    review: 'warning',
    status_change: 'primary',
    use: 'success',
    update_request: '',
    update_review: 'warning',
    rollback: 'danger',
    delete: 'danger',
    version: 'primary',
    conflict: 'warning',
    link_invalid: 'danger'
  }
  return types[type] || ''
}

const getTimelineTypeLabel = (type) => {
  const labels = {
    create: '创建',
    edit: '编辑',
    review: '审核',
    status_change: '状态变更',
    use: '使用',
    update_request: '更新申请',
    update_review: '更新审核',
    rollback: '回退',
    delete: '删除',
    version: '版本',
    conflict: '冲突',
    link_invalid: '链接失效'
  }
  return labels[type] || type
}

const getActionButtonType = (action) => {
  const types = {
    edit: '',
    submit_review: 'primary',
    view: '',
    approve: 'success',
    reject: 'danger',
    supplement: 'warning',
    reassign: '',
    search_use: 'primary',
    request_update: 'primary',
    rollback: 'warning',
    delete: 'danger'
  }
  return types[action] || ''
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const loadDocument = async () => {
  loading.value = true
  try {
    const res = await documentApi.get(route.params.id)
    document.value = res.data.document
    tags.value = res.data.tags || []
    versions.value = res.data.versions || []
    timeline.value = res.data.timeline || []
    workflowSteps.value = res.data.workflowSteps || []
    availableActions.value = res.data.availableActions || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const executeAction = async (action) => {
  try {
    switch (action) {
      case 'edit':
        router.push(`/documents/create?id=${document.value.id}`)
        break
      case 'submit_review':
        await ElMessageBox.confirm('确定要提交审核吗？', '提示', { type: 'warning' })
        actionLoading.value = true
        await documentApi.submitReview(document.value.id)
        ElMessage.success('提交审核成功')
        loadDocument()
        break
      case 'search_use':
        await ElMessageBox.confirm('确定要标记为已使用吗？', '提示', { type: 'warning' })
        actionLoading.value = true
        await documentApi.searchUse(document.value.id)
        ElMessage.success('标记使用成功')
        loadDocument()
        break
      case 'request_update':
        await ElMessageBox.confirm('确定要申请更新吗？', '提示', { type: 'warning' })
        actionLoading.value = true
        await documentApi.requestUpdate(document.value.id, { reason: '申请更新' })
        ElMessage.success('申请更新成功')
        loadDocument()
        break
      case 'rollback':
        ElMessage.info('请在版本历史中选择要回退的版本')
        break
      case 'delete':
        await ElMessageBox.confirm(`确定要删除文档"${document.value.title}"吗？`, '提示', { type: 'warning' })
        actionLoading.value = true
        await documentApi.delete(document.value.id)
        ElMessage.success('删除成功')
        router.push('/documents')
        break
      default:
        ElMessage.info(`操作: ${action}`)
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  } finally {
    actionLoading.value = false
  }
}

const submitReview = async () => {
  try {
    actionLoading.value = true
    await documentApi.review(document.value.id, reviewForm)
    ElMessage.success('审核操作成功')
    loadDocument()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
  }
}

const submitUpdateReview = async () => {
  try {
    actionLoading.value = true
    await documentApi.updateReview(document.value.id, updateForm)
    ElMessage.success('更新审核操作成功')
    loadDocument()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
  }
}

const rollbackVersion = (row) => {
  rollbackVersionData.value = row
  rollbackDialogVisible.value = true
}

const confirmRollback = async () => {
  if (!rollbackReason.value) {
    ElMessage.warning('请输入回退原因')
    return
  }
  try {
    actionLoading.value = true
    await documentApi.rollback(document.value.id, {
      version_no: rollbackVersionData.value.version_no,
      reason: rollbackReason.value
    })
    ElMessage.success('版本回退成功')
    rollbackDialogVisible.value = false
    loadDocument()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadDocument()
})
</script>

<style scoped>
.document-content {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #303133;
}
</style>
