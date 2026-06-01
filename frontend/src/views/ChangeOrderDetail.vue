<template>
  <div v-if="order">
    <div class="page-card">
      <h2 class="page-title">{{ order.title }} <span class="muted">({{ order.order_no }})</span></h2>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="应用">{{ order.app_id }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ order.change_type }}</el-descriptions-item>
        <el-descriptions-item label="风险"><el-tag :type="riskType(order.risk_level)">{{ order.risk_level }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType(order.status)">{{ order.status }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="创建人">{{ order.created_by }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ order.created_at }}</el-descriptions-item>
        <el-descriptions-item label="窗口起">{{ order.window_start || '-' }}</el-descriptions-item>
        <el-descriptions-item label="窗口止">{{ order.window_end || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ order.approver || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关闭原因">{{ order.close_reason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ order.description }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="page-card">
      <h3 class="page-title" style="margin:0 0 12px 0">事件回放</h3>
      <el-timeline>
        <el-timeline-item v-for="e in order.events" :key="e.id" :timestamp="e.created_at" placement="top">
          <el-tag size="small" :type="eventType(e.event_type)">{{ e.event_type }}</el-tag>
          <span style="margin-left:8px">{{ e.detail }}</span>
          <span class="muted" style="margin-left:8px">- {{ e.operator }}</span>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { OrderAPI } from '../api'

const route = useRoute()
const order = ref(null)
onMounted(async () => {
  const res = await OrderAPI.get(route.params.id)
  if (res?.code === 0) order.value = res.data
})
function statusType(s) {
  return { draft: 'info', submitted: 'warning', approved: 'success', executed: 'success', failed: 'danger', rejected: 'danger', closed: 'info', reviewing: 'warning' }[s] || ''
}
function riskType(s) { return { low: 'success', medium: 'warning', high: 'danger', critical: 'danger' }[s] || '' }
function eventType(e) {
  return { created: 'info', submitted: 'warning', approved: 'success', executed: 'success', failed: 'danger', rejected: 'danger', closed: 'info', blocked: 'danger' }[e] || ''
}
</script>
