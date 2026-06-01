<template>
  <div v-loading="loading">
    <el-page-header @back="$router.back()" :content="order?.title || '变更单详情'" />
    <el-card v-if="order" style="margin-top: 20px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="变更单号">{{ order.change_no }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ order.type }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联应用">{{ order.app_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="变更原因" :span="2">{{ order.reason }}</el-descriptions-item>
        <el-descriptions-item label="影响范围" :span="2">{{ order.impact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="恢复路径" :span="2">{{ order.recovery_path || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-card style="margin-top: 20px">
      <template #header>关联执行任务</template>
      <el-table :data="order.tasks || []" size="small">
        <el-table-column prop="task_id" label="任务ID" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusType(row.status)" size="small">{{ getTaskStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { changeApi } from '../api'

const route = useRoute()
const loading = ref(false)
const order = ref(null)

async function loadData() {
  loading.value = true
  try {
    order.value = await changeApi.get(route.params.id)
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function getStatusType(status) {
  const map = { pending: 'warning', approved: 'info', executed: 'success', rejected: 'danger' }
  return map[status] || 'info'
}
function getStatusText(status) {
  const map = { pending: '待审批', approved: '已批准', executed: '已执行', rejected: '已拒绝' }
  return map[status] || status
}
function getTaskStatusType(status) {
  const map = { pending: 'info', running: 'warning', success: 'success', failed: 'danger' }
  return map[status] || 'info'
}
function getTaskStatusText(status) {
  const map = { pending: '待执行', running: '执行中', success: '成功', failed: '失败' }
  return map[status] || status
}

onMounted(() => loadData())
</script>
