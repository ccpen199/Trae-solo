<template>
  <div class="audit-page">
    <div class="toolbar">
      <div class="title">审计日志</div>
    </div>

    <div class="log-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户</th>
            <th>操作</th>
            <th>目标类型</th>
            <th>目标ID</th>
            <th>详情</th>
            <th>IP地址</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.id }}</td>
            <td>{{ log.username || '系统' }}</td>
            <td>{{ log.action }}</td>
            <td>{{ log.target_type || '-' }}</td>
            <td>{{ log.target_id || '-' }}</td>
            <td>{{ log.details || '-' }}</td>
            <td>{{ log.ip_address || '-' }}</td>
            <td>{{ formatTime(log.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auditLogApi } from '../api'

const logs = ref([])

const loadLogs = async () => {
  try {
    const res = await auditLogApi.list({ page_size: 100 })
    logs.value = res.data.list
  } catch (e) {
    console.error(e)
  }
}

const formatTime = (t) => {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

onMounted(loadLogs)
</script>

<style scoped>
.audit-page { height: 100%; }
.toolbar { margin-bottom: 16px; }
.title { font-size: 18px; font-weight: 600; color: #1e293b; }
.log-table {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
table { width: 100%; border-collapse: collapse; }
th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}
th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}
</style>
