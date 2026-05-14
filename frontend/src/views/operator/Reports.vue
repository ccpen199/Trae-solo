<template>
  <div class="reports-page">
    <h2 class="page-title">举报处理</h2>
    
    <div class="filter-bar">
      <el-select v-model="statusFilter" placeholder="状态" @change="loadReports" style="width: 150px;">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已忽略" value="ignored" />
      </el-select>
      
      <el-select v-model="categoryFilter" placeholder="类型" clearable @change="loadReports" style="width: 150px;">
        <el-option label="广告" value="ad" />
        <el-option label="色情" value="porn" />
        <el-option label="政治" value="political" />
        <el-option label="暴力" value="violence" />
        <el-option label="诈骗" value="fraud" />
        <el-option label="其他" value="other" />
      </el-select>
    </div>
    
    <div v-if="loading" class="page-loading">
      <el-skeleton :rows="4" animated />
    </div>
    
    <div v-else-if="reports.length === 0" class="page-empty">
      <el-empty description="暂无举报" />
    </div>
    
    <div v-else class="report-list">
      <el-card v-for="report in reports" :key="report.id" class="report-card">
        <div class="report-header">
          <div class="report-type">
            <el-tag :type="targetTypeTag(report.target_type)">
              {{ targetTypeText(report.target_type) }}
            </el-tag>
            <el-tag v-if="report.reason_category" size="small">
              {{ categoryText(report.reason_category) }}
            </el-tag>
            <el-tag :type="statusTagType(report.status)" size="small">
              {{ statusText(report.status) }}
            </el-tag>
          </div>
          <div class="report-meta">
            <span>举报者: {{ report.reporter_nickname }}</span>
            <span>{{ formatTime(report.created_at) }}</span>
          </div>
        </div>
        
        <div class="report-target">
          <h4>目标: {{ report.target_info?.name || report.target_info?.title || report.target_info?.content || report.target_info?.nickname || 'ID: ' + report.target_id }}</h4>
          <p class="report-reason">举报理由: {{ report.reason }}</p>
        </div>
        
        <div v-if="report.status === 'pending' || report.status === 'processing'" class="report-actions">
          <el-input
            v-model="handleResults[report.id]"
            placeholder="处理结果（可选）"
            style="width: 300px; margin-right: 12px;"
          />
          <el-checkbox v-model="removeContents[report.id]">删除内容</el-checkbox>
          <el-button type="success" @click="resolve(report)">标记解决</el-button>
          <el-button @click="ignore(report)">忽略</el-button>
        </div>
        
        <div v-else class="report-result">
          <span v-if="report.result">处理结果: {{ report.result }}</span>
          <span>处理时间: {{ report.handled_at ? formatTime(report.handled_at) : '-' }}</span>
        </div>
      </el-card>
    </div>
    
    <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="prev, pager, next"
        @current-change="loadReports"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/utils/api'

const loading = ref(false)
const statusFilter = ref('pending')
const categoryFilter = ref('')
const reports = ref([])
const handleResults = ref({})
const removeContents = ref({})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

function statusText(status) {
  const map = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    ignored: '已忽略'
  }
  return map[status] || '未知'
}

function statusTagType(status) {
  const map = {
    pending: 'warning',
    processing: 'primary',
    resolved: 'success',
    ignored: 'info'
  }
  return map[status] || ''
}

function targetTypeText(type) {
  const map = {
    bar: '产品吧',
    post: '帖子',
    comment: '评论',
    user: '用户'
  }
  return map[type] || type
}

function targetTypeTag(type) {
  const map = {
    bar: 'primary',
    post: 'success',
    comment: 'info',
    user: 'warning'
  }
  return map[type] || ''
}

function categoryText(category) {
  const map = {
    ad: '广告',
    porn: '色情',
    political: '政治',
    violence: '暴力',
    fraud: '诈骗',
    other: '其他'
  }
  return map[category] || category
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function loadReports() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: statusFilter.value
    }
    if (categoryFilter.value) {
      params.reason_category = categoryFilter.value
    }
    
    const res = await api.get('/operator/reports', { params })
    if (res.success) {
      reports.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('加载举报列表失败:', e)
  } finally {
    loading.value = false
  }
}

async function resolve(report) {
  try {
    const res = await api.post(`/operator/reports/${report.id}/handle`, {
      action: 'resolve',
      result: handleResults.value[report.id] || '已处理',
      remove_content: removeContents.value[report.id] || false
    })
    if (res.success) {
      ElMessage.success('已标记为解决')
      loadReports()
    }
  } catch (e) {
    console.error('处理失败:', e)
  }
}

async function ignore(report) {
  try {
    await ElMessageBox.confirm('确定忽略此举报？', '提示', { type: 'warning' })
    
    const res = await api.post(`/operator/reports/${report.id}/handle`, {
      action: 'ignore',
      result: handleResults.value[report.id] || '不构成违规'
    })
    if (res.success) {
      ElMessage.success('已忽略')
      loadReports()
    }
  } catch (e) {
    console.error('处理失败:', e)
  }
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.reports-page {
  min-height: 100%;
}

.page-title {
  font-size: 22px;
  color: #303133;
  margin-bottom: 24px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-card {
  transition: box-shadow 0.2s;
}

.report-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.report-type {
  display: flex;
  gap: 8px;
}

.report-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.report-target h4 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.report-reason {
  font-size: 14px;
  color: #606266;
}

.report-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.report-result {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 13px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
</style>
