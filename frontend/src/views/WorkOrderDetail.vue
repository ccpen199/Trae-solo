<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref(null)
const workOrder = ref(null)
const updating = ref(false)

const statusMap = {
  pending: { label: '待处理', class: 'tag-warning' },
  approved: { label: '已审批', class: 'tag-info' },
  executing: { label: '执行中', class: 'tag-primary' },
  completed: { label: '已完成', class: 'tag-success' },
  cancelled: { label: '已取消', class: 'tag-error' }
}

const riskLevelMap = {
  low: { label: '低风险', class: 'tag-success' },
  medium: { label: '中风险', class: 'tag-warning' },
  high: { label: '高风险', class: 'tag-error' }
}

const formatCurrency = (value) => {
  return `¥${Number(value || 0).toLocaleString()}`
}

const fetchWorkOrder = async () => {
  try {
    loading.value = true
    error.value = null
    workOrder.value = await request.get(`/workorders/${route.params.id}`)
  } catch (err) {
    error.value = err.message || '加载工单详情失败'
    console.error('获取工单详情失败:', err)
  } finally {
    loading.value = false
  }
}

const handleRiskConfirmation = async () => {
  if (!confirm('确认已了解风险并同意执行？')) return
  try {
    updating.value = true
    await request.put(`/workorders/${route.params.id}`, {
      risk_confirmation: !workOrder.value.risk_confirmation,
      operator: '管理员'
    })
    fetchWorkOrder()
    alert('操作成功')
  } catch (err) {
    console.error('操作失败:', err)
    alert('操作失败: ' + err.message)
  } finally {
    updating.value = false
  }
}

const handleApprove = async () => {
  if (!confirm('确认审批通过？')) return
  try {
    updating.value = true
    await request.put(`/workorders/${route.params.id}`, {
      status: 'approved',
      approver: '管理员',
      operator: '管理员'
    })
    fetchWorkOrder()
    alert('审批成功')
  } catch (err) {
    console.error('审批失败:', err)
    alert('审批失败: ' + err.message)
  } finally {
    updating.value = false
  }
}

const handleExecute = async () => {
  if (!confirm('确认开始执行？')) return
  try {
    updating.value = true
    await request.post(`/workorders/${route.params.id}/execute`, {
      operator: '管理员'
    })
    fetchWorkOrder()
    alert('执行成功')
  } catch (err) {
    console.error('执行失败:', err)
    alert('执行失败: ' + err.message)
  } finally {
    updating.value = false
  }
}

const handleComplete = async () => {
  const actualSaving = prompt('请输入实际节省金额:', workOrder.value.estimated_saving || workOrder.value.estimated_saving_monthly)
  if (actualSaving === null) return

  const saving = parseFloat(actualSaving)
  if (isNaN(saving) || saving < 0) {
    alert('请输入有效的金额')
    return
  }

  if (!confirm('确认完成工单？')) return

  try {
    updating.value = true
    await request.post(`/workorders/${route.params.id}/complete`, {
      actual_saving: saving,
      operator: '管理员'
    })
    fetchWorkOrder()
    alert('工单已完成')
  } catch (err) {
    console.error('完成失败:', err)
    alert('完成失败: ' + err.message)
  } finally {
    updating.value = false
  }
}

const handleUpdateMaintenanceWindow = async () => {
  const window = prompt('请输入维护窗口:', workOrder.value.maintenance_window || '')
  if (window === null) return

  try {
    updating.value = true
    await request.put(`/workorders/${route.params.id}`, {
      maintenance_window: window,
      operator: '管理员'
    })
    fetchWorkOrder()
    alert('更新成功')
  } catch (err) {
    console.error('更新失败:', err)
    alert('更新失败: ' + err.message)
  } finally {
    updating.value = false
  }
}

const goBack = () => {
  router.push('/workorders')
}

onMounted(() => {
  fetchWorkOrder()
})
</script>

<template>
  <div class="workorder-detail-page">
    <div class="mb-4">
      <button class="btn" @click="goBack">← 返回列表</button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span class="ml-2">加载中...</span>
    </div>

    <div v-else-if="error" class="error">
      <span>⚠️</span>
      <span>{{ error }}</span>
      <button class="btn btn-primary btn-sm mt-2" @click="fetchWorkOrder">重试</button>
    </div>

    <template v-else-if="workOrder">
      <div class="card mb-4">
        <div class="card-header">
          <div class="flex items-center gap-3">
            <h3 class="card-title">📋 工单详情</h3>
            <span class="tag" :class="statusMap[workOrder.status]?.class">
              {{ statusMap[workOrder.status]?.label }}
            </span>
          </div>
          <span class="font-mono text-primary">{{ workOrder.work_order_no }}</span>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <h4 class="text-lg font-semibold mb-3">基本信息</h4>
            <div class="space-y-3">
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">工单标题</span>
                <span class="font-medium">{{ workOrder.title }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">操作类型</span>
                <span><span class="tag tag-info">{{ workOrder.action_type || '-' }}</span></span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">风险等级</span>
                <span>
                  <span
                    v-if="workOrder.risk_level"
                    class="tag"
                    :class="riskLevelMap[workOrder.risk_level]?.class"
                  >
                    {{ riskLevelMap[workOrder.risk_level]?.label }}
                  </span>
                  <span v-else>-</span>
                </span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">预计节省</span>
                <span class="font-semibold text-success">
                  {{ formatCurrency(workOrder.estimated_saving_monthly || workOrder.estimated_saving) }}
                </span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">实际节省</span>
                <span class="font-semibold" :class="workOrder.actual_saving > 0 ? 'text-success' : 'text-secondary'">
                  {{ workOrder.actual_saving > 0 ? formatCurrency(workOrder.actual_saving) : '-' }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-lg font-semibold mb-3">关联资源</h4>
            <div class="space-y-3">
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">资源名称</span>
                <span class="font-medium">{{ workOrder.resource_name || '-' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">资源类型</span>
                <span>{{ workOrder.resource_type || '-' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">所属项目</span>
                <span>{{ workOrder.project_name || '-' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">所属账号</span>
                <span>{{ workOrder.account_name || '-' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">地域</span>
                <span>{{ workOrder.region || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6 mt-6">
          <div>
            <h4 class="text-lg font-semibold mb-3">流程信息</h4>
            <div class="space-y-3">
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">申请人</span>
                <span>{{ workOrder.requester || '-' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">审批人</span>
                <span>{{ workOrder.approver || '-' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">创建时间</span>
                <span>{{ workOrder.created_at?.replace('T', ' ') }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">执行时间</span>
                <span>{{ workOrder.execution_time ? workOrder.execution_time.replace('T', ' ') : '-' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">完成时间</span>
                <span>{{ workOrder.completion_time ? workOrder.completion_time.replace('T', ' ') : '-' }}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-lg font-semibold mb-3">风险与维护</h4>
            <div class="space-y-3">
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">风险确认</span>
                <span>
                  <span
                    class="tag"
                    :class="workOrder.risk_confirmation ? 'tag-success' : 'tag-warning'"
                  >
                    {{ workOrder.risk_confirmation ? '已确认' : '未确认' }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-700">
                <span class="text-secondary">维护窗口</span>
                <div class="flex items-center gap-2">
                  <span>{{ workOrder.maintenance_window || '未设置' }}</span>
                  <button
                    v-if="workOrder.status !== 'completed' && workOrder.status !== 'cancelled'"
                    class="btn btn-primary btn-sm"
                    :disabled="updating"
                    @click="handleUpdateMaintenanceWindow"
                  >
                    修改
                  </button>
                </div>
              </div>
              <div v-if="workOrder.suggestion_description" class="py-2 border-b border-gray-700">
                <span class="text-secondary">建议描述</span>
                <p class="mt-1 text-sm text-secondary">{{ workOrder.suggestion_description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="workOrder.status !== 'completed' && workOrder.status !== 'cancelled'" class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">⚡ 操作</h3>
        </div>
        <div class="flex gap-3 flex-wrap">
          <button
            v-if="!workOrder.risk_confirmation"
            class="btn btn-warning"
            :disabled="updating"
            @click="handleRiskConfirmation"
          >
            确认风险
          </button>
          <button
            v-if="workOrder.status === 'pending' && workOrder.risk_confirmation"
            class="btn btn-primary"
            :disabled="updating"
            @click="handleApprove"
          >
            审批通过
          </button>
          <button
            v-if="workOrder.status === 'pending' || workOrder.status === 'approved'"
            class="btn btn-success"
            :disabled="updating"
            @click="handleExecute"
          >
            开始执行
          </button>
          <button
            v-if="workOrder.status === 'executing'"
            class="btn btn-primary"
            :disabled="updating"
            @click="handleComplete"
          >
            完成工单
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📝 执行记录</h3>
        </div>
        <div v-if="!workOrder.logs || workOrder.logs.length === 0" class="empty">
          <span>📭</span>
          <span>暂无执行记录</span>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(log, index) in workOrder.logs"
            :key="log.id"
            class="flex gap-4 p-3 rounded bg-tertiary"
          >
            <div class="flex flex-col items-center">
              <div
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-primary': log.action === 'create',
                  'bg-success': log.action === 'complete',
                  'bg-warning': log.action === 'execute',
                  'bg-info': log.action === 'update'
                }"
              ></div>
              <div v-if="index < workOrder.logs.length - 1" class="w-px flex-1 bg-gray-600 mt-1"></div>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <span class="font-medium">{{ log.action === 'create' ? '创建工单' : log.action === 'execute' ? '开始执行' : log.action === 'complete' ? '完成工单' : '更新信息' }}</span>
                  <span class="ml-2 text-sm text-secondary">操作人: {{ log.operator || 'system' }}</span>
                </div>
                <span class="text-sm text-muted">{{ log.created_at?.replace('T', ' ') }}</span>
              </div>
              <p v-if="log.remark" class="mt-1 text-sm text-secondary">{{ log.remark }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.workorder-detail-page {
  min-height: 100%;
}

.space-y-3 > * + * {
  margin-top: 12px;
}

.border-gray-700 {
  border-color: var(--border-color);
}

.bg-tertiary {
  background: var(--bg-tertiary);
}

.bg-info {
  background: var(--primary-color);
}
</style>
