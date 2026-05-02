<template>
  <div class="audit-timeline-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审计时间线</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="资源类型">
          <el-select v-model="searchForm.resource_type" placeholder="全部类型" clearable @change="handleSearch">
            <el-option label="表单" value="form" />
            <el-option label="提交记录" value="submission" />
            <el-option label="用户" value="user" />
            <el-option label="表单逻辑" value="form_logic" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.action" placeholder="全部操作" clearable @change="handleSearch">
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="发布" value="publish" />
            <el-option label="取消发布" value="unpublish" />
            <el-option label="提交" value="submit" />
            <el-option label="审批通过" value="approve" />
            <el-option label="驳回" value="reject" />
            <el-option label="登录" value="login" />
            <el-option label="退出" value="logout" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAuditLogs">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>

      <div v-loading="loading" class="timeline-content">
        <el-empty v-if="auditLogs.length === 0" description="暂无审计记录" />
        
        <el-timeline v-else>
          <el-timeline-item
            v-for="log in auditLogs"
            :key="log.id"
            :timestamp="formatTime(log.created_at)"
            placement="top"
            :type="getActionType(log.action)"
            :icon="getActionIcon(log.action)"
          >
            <el-card shadow="hover" class="log-card">
              <div class="log-header">
                <span class="log-action">{{ log.action_display }}</span>
                <span class="log-resource">{{ log.resource_type }} #{{ log.resource_id }}</span>
              </div>
              <div class="log-body">
                <div class="log-detail" v-if="log.details">
                  <template v-for="(value, key) in log.details" :key="key">
                    <div class="log-detail-item">
                      <span class="log-detail-key">{{ key }}:</span>
                      <span class="log-detail-value">{{ formatValue(value) }}</span>
                    </div>
                  </template>
                </div>
                <div class="log-meta" v-if="log.ip_address">
                  <span>IP: {{ log.ip_address }}</span>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[20, 50, 100, 200]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchAuditLogs"
        @current-change="fetchAuditLogs"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { commonApi } from '@/api'
import type { AuditLog } from '@/types'

const loading = ref(false)
const auditLogs = ref<AuditLog[]>([])

const searchForm = reactive({
  resource_type: '',
  action: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchAuditLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    if (searchForm.resource_type) {
      params.resource_type = searchForm.resource_type
    }
    if (searchForm.action) {
      params.action = searchForm.action
    }
    const result = await commonApi.getAuditTimeline(params)
    auditLogs.value = result.data
    pagination.total = result.total
  } catch (error) {
    console.error('Fetch audit logs error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchAuditLogs()
}

const getActionType = (action: string) => {
  const map: Record<string, string> = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    publish: 'success',
    unpublish: 'warning',
    submit: 'primary',
    approve: 'success',
    reject: 'danger',
    login: 'info',
    logout: 'info'
  }
  return map[action] || 'info'
}

const getActionIcon = (action: string) => {
  const map: Record<string, string> = {
    create: 'Plus',
    update: 'EditPen',
    delete: 'Delete',
    publish: 'CircleCheck',
    unpublish: 'Warning',
    submit: 'Upload',
    approve: 'Check',
    reject: 'Close',
    login: 'User',
    logout: 'SwitchButton'
  }
  const icon = map[action] || 'Document'
  return h('el-icon', null, { default: () => h('component', { is: icon }) })
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

onMounted(() => {
  fetchAuditLogs()
})
</script>

<style scoped>
.audit-timeline-container {
  padding: 0;
}

.audit-timeline-container :deep(.el-card) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.audit-timeline-container :deep(.el-card__header) {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  padding: 18px 24px;
  border-bottom: none;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-form {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-radius: 12px;
  border-left: 4px solid #fa709a;
}

.search-form :deep(.el-select) {
  width: 160px;
}

.search-form :deep(.el-select:hover .el-input__wrapper) {
  box-shadow: 0 0 0 1px #fa709a inset;
}

.search-form :deep(.el-select.is-focused .el-input__wrapper) {
  box-shadow: 0 0 0 1px #fa709a inset, 0 0 0 3px rgba(250, 112, 154, 0.1);
}

.search-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #303133;
}

.search-form :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(250, 112, 154, 0.4);
}

.timeline-content {
  min-height: 200px;
}

.audit-timeline-container :deep(.el-timeline-item__tail) {
  border-left: 2px solid #e4e7ed;
}

.audit-timeline-container :deep(.el-timeline-item__node--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.audit-timeline-container :deep(.el-timeline-item__node--success) {
  background: linear-gradient(135deg, #67c23a 0%, #5db134 100%);
  border: none;
}

.audit-timeline-container :deep(.el-timeline-item__node--warning) {
  background: linear-gradient(135deg, #e6a23c 0%, #cf9236 100%);
  border: none;
}

.audit-timeline-container :deep(.el-timeline-item__node--danger) {
  background: linear-gradient(135deg, #f56c6c 0%, #e05c5c 100%);
  border: none;
}

.audit-timeline-container :deep(.el-timeline-item__node--info) {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
  border: none;
}

.audit-timeline-container :deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 13px;
}

.log-card {
  margin-bottom: 16px;
  border-radius: 12px !important;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.log-card :deep(.el-card__body) {
  padding: 16px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.log-action {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.log-resource {
  font-size: 13px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 10px;
  border-radius: 4px;
}

.log-body {
  background: linear-gradient(135deg, #fafafa 0%, #f5f7fa 100%);
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.log-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
}

.log-detail-item {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.log-detail-key {
  color: #909399;
  font-weight: 500;
}

.log-detail-value {
  color: #606266;
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.log-meta {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e4e7ed;
  font-size: 12px;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.pagination :deep(.el-pagination__total) {
  color: #606266;
}

.pagination :deep(.el-pagination.is-background .el-pager li:not(.disabled).active) {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #303133;
}

.pagination :deep(.el-pagination.is-background .el-pager li:not(.disabled):hover) {
  color: #fa709a;
}
</style>
