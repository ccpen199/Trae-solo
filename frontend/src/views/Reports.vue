<template>
  <div class="reports-page">
    <div class="toolbar">
      <div class="title">举报审核队列</div>
      <div class="filters">
        <select v-model="statusFilter" @change="loadReports">
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
    </div>

    <div class="report-list">
      <div v-for="report in reports" :key="report.id" class="report-card">
        <div class="report-header">
          <span class="report-id">#{{ report.id }}</span>
          <span class="status-badge" :class="'status-' + report.status">{{ statusText(report.status) }}</span>
          <span class="report-time">{{ formatTime(report.created_at) }}</span>
        </div>
        <div class="report-body">
          <div class="report-row">
            <span class="label">举报人：</span>
            <span>{{ report.reporter_name || '系统' }} (ID: {{ report.reporter_id }})</span>
          </div>
          <div class="report-row">
            <span class="label">被举报用户：</span>
            <span>{{ report.reported_nickname || report.reported_name }} (ID: {{ report.reported_user_id }})</span>
          </div>
          <div class="report-row">
            <span class="label">举报原因：</span>
            <span>{{ report.reason }}</span>
          </div>
          <div v-if="report.description" class="report-row">
            <span class="label">详细描述：</span>
            <span>{{ report.description }}</span>
          </div>
          <div v-if="report.message_content" class="report-row">
            <span class="label">关联消息：</span>
            <span class="msg-content">{{ report.message_content }}</span>
          </div>
          <div v-if="report.action" class="report-row">
            <span class="label">处理结果：</span>
            <span>{{ report.action }}{{ report.action_note ? ' - ' + report.action_note : '' }}</span>
          </div>
          <div v-if="report.moderator_name" class="report-row">
            <span class="label">处理人：</span>
            <span>{{ report.moderator_name }}</span>
          </div>
        </div>
        <div v-if="report.status === 'pending' || report.status === 'processing'" class="report-actions">
          <select v-model="report.actionType">
            <option value="">选择处理方式</option>
            <option value="warn">警告</option>
            <option value="mute">禁言</option>
            <option value="ban">封号</option>
            <option value="delete_message">删除消息</option>
            <option value="reject">驳回举报</option>
          </select>
          <input v-if="report.actionType === 'mute' || report.actionType === 'ban'"
                 v-model="report.duration" type="number" placeholder="时长(分钟)" style="width:100px" />
          <input v-model="report.actionNote" placeholder="处理备注" style="flex:1" />
          <button class="btn-primary" @click="processReport(report)">处理</button>
        </div>
      </div>
      <div v-if="reports.length === 0" class="empty">暂无举报</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { reportApi } from '../api'

const reports = ref([])
const statusFilter = ref('pending')

const loadReports = async () => {
  try {
    const res = await reportApi.list({ status: statusFilter.value, page_size: 50 })
    reports.value = res.data.list.map(r => ({ ...r, actionType: '', actionNote: '', duration: 0 }))
  } catch (e) {
    console.error(e)
  }
}

const statusText = (s) => {
  const map = { pending: '待处理', processing: '处理中', resolved: '已解决', rejected: '已拒绝' }
  return map[s] || s
}

const formatTime = (t) => {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

const processReport = async (report) => {
  if (!report.actionType) {
    alert('请选择处理方式')
    return
  }
  try {
    await reportApi.process(report.id, {
      action: report.actionType,
      action_note: report.actionNote,
      punish_type: report.actionType !== 'reject' && report.actionType !== 'delete_message' ? report.actionType : null,
      duration: report.duration || 0
    })
    loadReports()
  } catch (e) {
    alert(e.response?.data?.error || '处理失败')
  }
}

onMounted(loadReports)
</script>

<style scoped>
.reports-page { height: 100%; }
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title { font-size: 18px; font-weight: 600; color: #1e293b; }
.filters select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}
.report-list { display: flex; flex-direction: column; gap: 12px; }
.report-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}
.report-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}
.report-id { color: #64748b; font-size: 13px; }
.status-badge {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}
.status-pending { background: #fef3c7; color: #92400e; }
.status-processing { background: #dbeafe; color: #1e40af; }
.status-resolved { background: #dcfce7; color: #166534; }
.status-rejected { background: #f1f5f9; color: #475569; }
.report-time { margin-left: auto; color: #94a3b8; font-size: 12px; }
.report-body { display: flex; flex-direction: column; gap: 8px; }
.report-row { display: flex; align-items: flex-start; font-size: 14px; }
.report-row .label { color: #64748b; min-width: 80px; flex-shrink: 0; }
.msg-content { background: #f8fafc; padding: 4px 8px; border-radius: 4px; }
.report-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.report-actions select, .report-actions input {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}
.btn-primary {
  padding: 6px 16px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.empty { text-align: center; color: #94a3b8; padding: 40px; }
</style>
