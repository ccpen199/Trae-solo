<template>
  <div class="exceptions-page">
    <div class="page-header flex justify-between items-center mb-4">
      <div>
        <h2 class="page-title">异常队列</h2>
        <p class="page-subtitle">追踪和处理系统中的异常事件，降低业务风险</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-icon" style="background: #f56c6c">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-value">{{ stats.pending }}</div>
            <div class="stat-card-label">待处理</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-icon" style="background: #67c23a">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-value">{{ stats.resolved }}</div>
            <div class="stat-card-label">已解决</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-icon" style="background: #e6a23c">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-value">{{ stats.highPriority }}</div>
            <div class="stat-card-label">高优先级</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-card-icon" style="background: #409eff">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-value">{{ stats.total }}</div>
            <div class="stat-card-label">总异常数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header flex justify-between items-center">
          <div class="filter-bar">
            <el-select
              v-model="filters.status"
              placeholder="状态筛选"
              clearable
              style="width: 120px"
              @change="refreshData"
            >
              <el-option label="全部" value="" />
              <el-option label="待处理" value="pending" />
              <el-option label="已解决" value="resolved" />
            </el-select>
            <el-select
              v-model="filters.type"
              placeholder="类型筛选"
              clearable
              style="width: 140px"
              @change="refreshData"
            >
              <el-option label="全部类型" value="" />
              <el-option label="编辑冲突" value="edit_conflict" />
              <el-option label="授权过期" value="license_expired" />
              <el-option label="审核驳回" value="audit_rejected" />
              <el-option label="版本回退" value="version_rollback" />
              <el-option label="外链失效" value="link_expired" />
              <el-option label="任务逾期" value="task_overdue" />
              <el-option label="里程碑风险" value="milestone_at_risk" />
            </el-select>
            <el-select
              v-model="filters.priority"
              placeholder="优先级筛选"
              clearable
              style="width: 120px"
              @change="refreshData"
            >
              <el-option label="全部" value="" />
              <el-option label="高优先级" value="high" />
              <el-option label="中优先级" value="medium" />
              <el-option label="低优先级" value="low" />
            </el-select>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="exceptions.length > 0" class="exception-list">
          <div
            v-for="exception in exceptions"
            :key="exception.id"
            class="exception-card"
            :class="[
              `exception-status-${exception.status}`,
              `exception-priority-${exception.priority}`
            ]"
          >
            <div class="exception-card-header">
              <div class="exception-icon-wrapper" :class="`icon-${exception.type}`">
                <el-icon :size="20">
                  <component :is="getExceptionIcon(exception.type)" />
                </el-icon>
              </div>
              <div class="exception-main-info">
                <div class="exception-title-row">
                  <span class="exception-title">{{ exception.title }}</span>
                  <el-tag
                    :type="getPriorityTagType(exception.priority)"
                    size="small"
                    effect="light"
                  >
                    {{ getPriorityLabel(exception.priority) }}
                  </el-tag>
                  <el-tag
                    :type="getStatusTagType(exception.status)"
                    size="small"
                  >
                    {{ getStatusLabel(exception.status) }}
                  </el-tag>
                </div>
                <div class="exception-meta">
                  <span class="exception-type-badge">{{ getExceptionTypeLabel(exception.type) }}</span>
                  <span v-if="exception.project_name" class="exception-project">
                    <el-icon><Folder /></el-icon>
                    {{ exception.project_name }}
                  </span>
                  <span v-if="exception.assigned_to_name" class="exception-assignee">
                    <el-icon><User /></el-icon>
                    {{ exception.assigned_to_name }}
                  </span>
                  <span class="exception-time">
                    <el-icon><Clock /></el-icon>
                    {{ formatTime(exception.created_at) }}
                  </span>
                </div>
              </div>
              <div class="exception-actions">
                <el-button
                  v-if="exception.status === 'pending'"
                  type="primary"
                  size="small"
                  @click="handleResolve(exception)"
                >
                  处理
                </el-button>
                <el-button
                  v-else
                  type="success"
                  size="small"
                  link
                  disabled
                >
                  已解决
                </el-button>
              </div>
            </div>
            
            <div v-if="exception.description" class="exception-card-body">
              <p class="exception-description">{{ exception.description }}</p>
            </div>

            <div v-if="exception.status === 'resolved'" class="exception-card-footer">
              <div class="resolved-info">
                <el-icon><CircleCheck /></el-icon>
                <span>由 {{ exception.resolved_by_name || '系统' }} 于 {{ formatTime(exception.resolved_at) }} 解决</span>
              </div>
              <div v-if="exception.resolution" class="resolution">
                <span class="resolution-label">处理方案：</span>
                <span class="resolution-content">{{ exception.resolution }}</span>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无异常记录" />
      </div>
    </el-card>

    <el-dialog
      v-model="showResolveDialog"
      title="处理异常"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="resolveFormRef"
        :model="resolveForm"
        :rules="resolveRules"
        label-width="80px"
      >
        <el-form-item label="异常标题">
          <el-input :value="currentException?.title" disabled />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-tag :type="getExceptionTagType(currentException?.type)">
            {{ getExceptionTypeLabel(currentException?.type) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="处理方案" prop="resolution">
          <el-input
            v-model="resolveForm.resolution"
            type="textarea"
            :rows="4"
            placeholder="请输入处理方案和结果说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="primary" :loading="resolving" @click="submitResolve">
          标记已解决
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const resolving = ref(false)
const exceptions = ref([])
const currentException = ref(null)
const showResolveDialog = ref(false)
const resolveFormRef = ref(null)

const filters = reactive({
  status: '',
  type: '',
  priority: ''
})

const resolveForm = reactive({
  resolution: ''
})

const resolveRules = {
  resolution: [
    { required: true, message: '请输入处理方案', trigger: 'blur' }
  ]
}

const stats = computed(() => {
  const list = exceptions.value
  return {
    total: list.length,
    pending: list.filter(e => e.status === 'pending').length,
    resolved: list.filter(e => e.status === 'resolved').length,
    highPriority: list.filter(e => e.priority === 'high' && e.status === 'pending').length
  }
})

const fetchExceptions = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.type) params.type = filters.type
    if (filters.priority) params.priority = filters.priority

    const response = await api.get('/dashboard/exceptions', { params })
    if (response.success) {
      exceptions.value = response.data || []
    }
  } catch (error) {
    console.error('获取异常列表失败:', error)
    ElMessage.error('获取异常列表失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchExceptions()
}

const getExceptionIcon = (type) => {
  const icons = {
    edit_conflict: 'Warning',
    license_expired: 'Lock',
    audit_rejected: 'Close',
    version_rollback: 'RefreshLeft',
    link_expired: 'Link',
    task_overdue: 'Timer',
    milestone_at_risk: 'Flag',
    approval_pending: 'Document'
  }
  return icons[type] || 'Warning'
}

const getExceptionTypeLabel = (type) => {
  const labels = {
    edit_conflict: '编辑冲突',
    license_expired: '授权过期',
    audit_rejected: '审核驳回',
    version_rollback: '版本回退',
    link_expired: '外链失效',
    task_overdue: '任务逾期',
    milestone_at_risk: '里程碑风险',
    approval_pending: '待审批'
  }
  return labels[type] || type
}

const getExceptionTagType = (type) => {
  const types = {
    edit_conflict: 'danger',
    license_expired: 'warning',
    audit_rejected: 'danger',
    version_rollback: 'info',
    link_expired: 'warning',
    task_overdue: 'danger',
    milestone_at_risk: 'warning',
    approval_pending: 'primary'
  }
  return types[type] || 'info'
}

const getPriorityLabel = (priority) => {
  const labels = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return labels[priority] || priority
}

const getPriorityTagType = (priority) => {
  const types = { high: 'danger', medium: 'warning', low: 'info' }
  return types[priority] || 'info'
}

const getStatusLabel = (status) => {
  const labels = { pending: '待处理', resolved: '已解决' }
  return labels[status] || status
}

const getStatusTagType = (status) => {
  const types = { pending: 'warning', resolved: 'success' }
  return types[status] || 'info'
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const handleResolve = (exception) => {
  currentException.value = exception
  resolveForm.resolution = ''
  showResolveDialog.value = true
}

const submitResolve = async () => {
  const valid = await resolveFormRef.value.validate().catch(() => false)
  if (!valid) return

  resolving.value = true
  try {
    const response = await api.post(`/dashboard/exceptions/${currentException.value.id}/resolve`, {
      resolution: resolveForm.resolution
    })
    if (response.success) {
      ElMessage.success('异常已标记为已解决')
      showResolveDialog.value = false
      refreshData()
    }
  } catch (error) {
    console.error('处理异常失败:', error)
    ElMessage.error(error.message || '处理失败')
  } finally {
    resolving.value = false
  }
}

onMounted(() => {
  fetchExceptions()
})
</script>

<style scoped>
.exceptions-page {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-card-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-card-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.exception-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exception-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.exception-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.exception-card.exception-priority-high {
  border-left: 4px solid #f56c6c;
}

.exception-card.exception-priority-medium {
  border-left: 4px solid #e6a23c;
}

.exception-card.exception-priority-low {
  border-left: 4px solid #909399;
}

.exception-card.exception-status-resolved {
  background: #fafafa;
  opacity: 0.8;
}

.exception-card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
}

.exception-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exception-icon-wrapper.icon-edit_conflict {
  background: #fef0f0;
  color: #f56c6c;
}

.exception-icon-wrapper.icon-license_expired {
  background: #fdf6ec;
  color: #e6a23c;
}

.exception-icon-wrapper.icon-audit_rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.exception-icon-wrapper.icon-version_rollback {
  background: #f4f4f5;
  color: #909399;
}

.exception-icon-wrapper.icon-link_expired {
  background: #fdf6ec;
  color: #e6a23c;
}

.exception-icon-wrapper.icon-task_overdue {
  background: #fef0f0;
  color: #f56c6c;
}

.exception-icon-wrapper.icon-milestone_at_risk {
  background: #fdf6ec;
  color: #e6a23c;
}

.exception-main-info {
  flex: 1;
  min-width: 0;
}

.exception-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.exception-title {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.exception-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #909399;
}

.exception-meta > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.exception-type-badge {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.exception-actions {
  flex-shrink: 0;
}

.exception-card-body {
  padding: 0 16px 16px 80px;
}

.exception-description {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.exception-card-footer {
  padding: 12px 16px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
}

.resolved-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #67c23a;
  margin-bottom: 8px;
}

.resolution {
  font-size: 12px;
}

.resolution-label {
  color: #909399;
}

.resolution-content {
  color: #606266;
}
</style>
