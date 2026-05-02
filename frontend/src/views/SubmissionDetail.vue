<template>
  <div class="submission-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>提交详情</span>
          <div class="header-actions">
            <el-button @click="$router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions title="基本信息" :column="3" border>
        <el-descriptions-item label="提交ID">{{ detailData?.id }}</el-descriptions-item>
        <el-descriptions-item label="表单ID">{{ detailData?.form_id }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ detailData?.user_id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData?.status || '')" size="small">
            {{ getStatusText(detailData?.status || '') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本">{{ detailData?.version }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(detailData?.created_at) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div class="data-section">
        <h3>提交数据</h3>
        <el-descriptions :column="2" border>
          <template v-for="(value, key) in detailData?.data" :key="key">
            <el-descriptions-item :label="key">
              <span v-if="Array.isArray(value)">{{ value.join(', ') }}</span>
              <span v-else-if="typeof value === 'boolean'">{{ value ? '是' : '否' }}</span>
              <span v-else>{{ value || '-' }}</span>
            </el-descriptions-item>
          </template>
        </el-descriptions>
      </div>

      <el-divider />

      <div class="history-section">
        <h3>版本历史</h3>
        <el-timeline>
          <el-timeline-item
            v-for="history in detailData?.histories"
            :key="history.version"
            :timestamp="formatTime(history.created_at)"
            placement="top"
            :type="getStatusType(history.status)"
          >
            <div class="history-item">
              <div class="history-header">
                <span class="history-version">版本 v{{ history.version }}</span>
                <el-tag :type="getStatusType(history.status)" size="small">
                  {{ getStatusText(history.status) }}
                </el-tag>
              </div>
              <div v-if="history.change_reason" class="history-reason">
                变更原因：{{ history.change_reason }}
              </div>
              <div class="history-data">
                <el-collapse>
                  <el-collapse-item title="查看数据详情" name="1">
                    <pre class="data-preview">{{ JSON.stringify(history.data, null, 2) }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <el-divider />

      <div class="actions-section">
        <el-button type="success" @click="handleApprove" v-if="detailData?.status === 'submitted'">
          <el-icon><CircleCheck /></el-icon>
          通过
        </el-button>
        <el-button type="warning" @click="handleReject" v-if="detailData?.status === 'submitted'">
          <el-icon><CircleClose /></el-icon>
          驳回
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { submissionApi } from '@/api'

const route = useRoute()
const router = useRouter()
const submissionId = ref(parseInt(route.params.id as string))
const detailData = ref<any>(null)
const loading = ref(false)

const fetchDetail = async () => {
  loading.value = true
  try {
    const result = await submissionApi.get(submissionId.value)
    detailData.value = result
  } catch (error) {
    console.error('Fetch detail error:', error)
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

const handleApprove = async () => {
  try {
    await ElMessageBox.confirm('确定要通过此提交吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    await submissionApi.approve(submissionId.value)
    ElMessage.success('已通过')
    fetchDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Approve error:', error)
    }
  }
}

const handleReject = async () => {
  try {
    await ElMessageBox.confirm('确定要驳回此提交吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await submissionApi.reject(submissionId.value)
    ElMessage.success('已驳回')
    fetchDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Reject error:', error)
    }
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回'
  }
  return map[status] || status
}

const formatTime = (time?: string) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.submission-detail-container {
  padding: 0;
}

.submission-detail-container :deep(.el-card) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.submission-detail-container :deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 18px 24px;
  border-bottom: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header > span:first-child {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions .el-button {
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  color: #667eea;
  border: none;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.4);
}

.submission-detail-container :deep(.el-descriptions__title) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
}

.submission-detail-container :deep(.el-descriptions__header) {
  margin-bottom: 16px;
}

.submission-detail-container :deep(.el-descriptions--bordered .el-descriptions__label) {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  font-weight: 500;
  color: #606266;
}

.submission-detail-container :deep(.el-descriptions--bordered .el-descriptions__cell) {
  padding: 16px;
}

.submission-detail-container :deep(.el-divider) {
  margin: 28px 0;
}

.submission-detail-container :deep(.el-divider__text) {
  color: #909399;
  font-size: 14px;
}

.data-section,
.history-section {
  margin-top: 20px;
}

.data-section h3,
.history-section h3 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  padding-left: 12px;
  border-left: 4px solid #667eea;
}

.history-item {
  padding: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f7fa 100%);
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-version {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.history-reason {
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-radius: 8px;
  font-size: 14px;
  color: #f56c6c;
  border-left: 3px solid #f56c6c;
}

.history-data {
  margin-top: 12px;
}

.submission-detail-container :deep(.el-collapse) {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.submission-detail-container :deep(.el-collapse-item__header) {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  font-weight: 500;
  color: #606266;
}

.submission-detail-container :deep(.el-collapse-item__header:hover) {
  color: #667eea;
}

.data-preview {
  background: linear-gradient(135deg, #fafafa 0%, #f5f7fa 100%);
  padding: 16px;
  border-radius: 8px;
  font-size: 13px;
  overflow-x: auto;
  border: 1px solid #e4e7ed;
  color: #606266;
  font-family: 'Monaco', 'Menlo', monospace;
  line-height: 1.6;
}

.actions-section {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-radius: 12px;
  margin-top: 20px;
}

.actions-section .el-button {
  padding: 12px 36px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.actions-section .el-button--success {
  background: linear-gradient(135deg, #67c23a 0%, #5db134 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(103, 194, 58, 0.3);
}

.actions-section .el-button--success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(103, 194, 58, 0.4);
}

.actions-section .el-button--warning {
  background: linear-gradient(135deg, #e6a23c 0%, #cf9236 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(230, 162, 60, 0.3);
}

.actions-section .el-button--warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(230, 162, 60, 0.4);
}

.submission-detail-container :deep(.el-tag--info) {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
  border: none;
  color: #fff;
}

.submission-detail-container :deep(.el-tag--warning) {
  background: linear-gradient(135deg, #e6a23c 0%, #cf9236 100%);
  border: none;
  color: #fff;
}

.submission-detail-container :deep(.el-tag--success) {
  background: linear-gradient(135deg, #67c23a 0%, #5db134 100%);
  border: none;
  color: #fff;
}

.submission-detail-container :deep(.el-tag--danger) {
  background: linear-gradient(135deg, #f56c6c 0%, #e05c5c 100%);
  border: none;
  color: #fff;
}

.submission-detail-container :deep(.el-timeline-item__tail) {
  border-left: 2px solid #e4e7ed;
}

.submission-detail-container :deep(.el-timeline-item__node--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.submission-detail-container :deep(.el-timeline-item__node--success) {
  background: linear-gradient(135deg, #67c23a 0%, #5db134 100%);
  border: none;
}

.submission-detail-container :deep(.el-timeline-item__node--warning) {
  background: linear-gradient(135deg, #e6a23c 0%, #cf9236 100%);
  border: none;
}

.submission-detail-container :deep(.el-timeline-item__node--danger) {
  background: linear-gradient(135deg, #f56c6c 0%, #e05c5c 100%);
  border: none;
}

.submission-detail-container :deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 13px;
}
</style>
