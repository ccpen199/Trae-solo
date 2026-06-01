<template>
  <div>
    <el-alert type="info" style="margin-bottom: 20px" show-icon>
      <template #title>工作台说明</template>
      这里显示待审批变更和最近执行任务。告警处理请前往【告警中心】页面。
    </el-alert>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: bold; display: flex; align-items: center">
                <el-icon style="color: #e6a23c; margin-right: 8px"><Document /></el-icon>
                待审批变更单
              </span>
              <el-button type="primary" link size="small" @click="$router.push('/change-orders')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="workbench.pending_approvals" size="small" v-loading="loading.approvals">
            <el-table-column prop="change_no" label="变更单号" width="140" />
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="creator_name" label="申请人" width="100" />
            <el-table-column prop="created_at" label="申请时间" width="160" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="approveChange(row)">批准</el-button>
                <el-button type="danger" size="small" link>拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loading.approvals && workbench.pending_approvals.length === 0" description="暂无待审批变更" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: bold; display: flex; align-items: center">
                <el-icon style="color: #409eff; margin-right: 8px"><List /></el-icon>
                最近执行任务
              </span>
              <el-button type="primary" link size="small" @click="$router.push('/tasks')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="workbench.recent_tasks" size="small" v-loading="loading.tasks">
            <el-table-column prop="task_id" label="任务ID" width="140" />
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getTaskStatusType(row.status)" size="small">{{ getTaskStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="executor_name" label="执行人" width="100" />
          </el-table>
          <el-empty v-if="!loading.tasks && workbench.recent_tasks.length === 0" description="暂无执行任务" />
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dashboardApi, changeApi } from '../api'

const workbench = reactive({
  pending_approvals: [],
  recent_tasks: []
})

const loading = reactive({
  approvals: false,
  tasks: false
})

async function loadWorkbench() {
  loading.approvals = loading.tasks = true
  try {
    const res = await dashboardApi.workbench()
    Object.assign(workbench, res.data)
  } catch (e) {
    console.error(e)
  } finally {
    loading.approvals = loading.tasks = false
  }
}

async function approveChange(row) {
  try {
    await ElMessageBox.confirm('确认批准该变更单？', '提示', { type: 'warning' })
    await changeApi.approve(row.id)
    ElMessage.success('批准成功')
    loadWorkbench()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

function getTaskStatusType(status) {
  const map = { pending: 'info', running: 'warning', success: 'success', failed: 'danger' }
  return map[status] || 'info'
}

function getTaskStatusText(status) {
  const map = { pending: '待执行', running: '执行中', success: '成功', failed: '失败' }
  return map[status] || status
}

onMounted(() => {
  loadWorkbench()
})
</script>
