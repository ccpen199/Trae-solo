<template>
  <div v-if="task">
    <div class="page-card">
      <h2 class="page-title">{{ task.title }} <span class="muted">({{ task.task_no }})</span></h2>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="应用">{{ task.app_id }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ task.task_type }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType(task.status)">{{ task.status }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="创建人">{{ task.created_by }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ task.created_at }}</el-descriptions-item>
        <el-descriptions-item label="执行时间">{{ task.executed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关闭原因" :span="2">{{ task.close_reason || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="page-card">
      <h3 class="page-title" style="margin:0 0 12px 0">事件回放</h3>
      <el-timeline>
        <el-timeline-item v-for="e in task.events" :key="e.id" :timestamp="e.created_at" placement="top">
          <el-tag size="small" :type="eventType(e.event_type)">{{ e.event_type }}</el-tag>
          <span style="margin-left:8px">{{ e.detail }}</span>
          <span class="muted" style="margin-left:8px">- {{ e.operator }}</span>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div class="page-card">
      <h3 class="page-title" style="margin:0 0 12px 0">执行记录</h3>
      <el-table :data="task.executions" size="small" stripe>
        <el-table-column prop="action" label="动作" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="started_at" label="开始" width="180" />
        <el-table-column prop="finished_at" label="结束" width="180" />
        <el-table-column prop="duration_ms" label="耗时(ms)" width="100" />
        <el-table-column prop="request_payload" label="请求" show-overflow-tooltip />
        <el-table-column prop="response_payload" label="响应" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { TaskAPI } from '../api'

const route = useRoute()
const task = ref(null)
onMounted(async () => {
  const res = await TaskAPI.get(route.params.id)
  if (res?.code === 0) task.value = res.data
})
function statusType(s) {
  return { created: 'info', submitted: 'warning', executed: 'success', failed: 'danger', reviewing: 'warning', rejected: 'danger', closed: 'info' }[s] || ''
}
function eventType(e) {
  return { created: 'info', submitted: 'warning', executed: 'success', failed: 'danger', blocked: 'danger', reviewed_approve: 'success', reviewed_reject: 'danger', closed: 'info' }[e] || ''
}
</script>
