<template>
  <div class="page-container">
    <div class="page-header">
      <h2>调度中心</h2>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待调度任务" name="pending">
        <el-table :data="pendingTasks" v-loading="loading" stripe>
          <el-table-column prop="task_no" label="任务号" width="180" />
          <el-table-column prop="order_no" label="订单号" width="180" />
          <el-table-column label="路线" min-width="150">
            <template #default="{ row }">
              {{ row.route_name }}
            </template>
          </el-table-column>
          <el-table-column label="货物" width="120">
            <template #default="{ row }">
              {{ row.goods_name }} / {{ row.weight }}吨
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <el-tag :type="row.priority === 'URGENT' ? 'danger' : 'info'">
                {{ row.priority === 'URGENT' ? '紧急' : '普通' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleDispatch(row)">调度</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="调度历史" name="history">
        <el-table :data="dispatchHistory" v-loading="loading" stripe>
          <el-table-column prop="task_no" label="任务号" width="180" />
          <el-table-column prop="vehicle_no" label="车牌号" width="120" />
          <el-table-column prop="driver_name" label="司机" width="100" />
          <el-table-column prop="assigned_at" label="调度时间" width="160" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag>{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { dispatchApi } from '@/api'

const loading = ref(false)
const activeTab = ref('pending')
const pendingTasks = ref([])
const dispatchHistory = ref([])

onMounted(() => {
  fetchPendingTasks()
  fetchHistory()
})

async function fetchPendingTasks() {
  loading.value = true
  try {
    const res = await dispatchApi.pendingTasks()
    pendingTasks.value = res.data
  } catch (error) {
    ElMessage.error('获取待调度任务失败')
  } finally {
    loading.value = false
  }
}

async function fetchHistory() {
  try {
    const res = await dispatchApi.history()
    dispatchHistory.value = res.data
  } catch (error) {
    console.error('获取调度历史失败', error)
  }
}

function handleDispatch(row) {
  ElMessage.info('调度功能：' + row.task_no)
}

function getStatusText(status) {
  const texts = {
    PENDING: '待调度',
    DISPATCHED: '已调度',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return texts[status] || status
}
</script>
