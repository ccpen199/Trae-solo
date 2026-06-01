<template>
  <div>
    <div class="page-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 class="page-title" style="margin:0">复核中心</h2>
        <div class="muted">仅展示他人创建、需我复核的单据，禁止自审自批</div>
      </div>
    </div>

    <el-tabs v-model="tab">
      <el-tab-pane label="任务复核" name="tasks">
        <div class="page-card">
          <el-table :data="pendingTasks" size="small" stripe>
            <el-table-column prop="task_no" label="任务编号" width="200" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="app_name" label="应用" width="140" />
            <el-table-column prop="task_type" label="类型" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="created_by" label="申请人" width="120" />
            <el-table-column prop="created_at" label="申请时间" width="180" />
            <el-table-column label="操作" width="260">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push(`/tasks/${row.id}`)">详情</el-button>
                <el-button link type="success" @click="reviewTask(row, 'approve')">通过</el-button>
                <el-button link type="danger" @click="reviewTask(row, 'reject')">退回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="pendingTasks.length === 0" class="muted" style="padding:24px; text-align:center;">暂无待复核的任务</div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="变更单复核" name="orders">
        <div class="page-card">
          <el-table :data="pendingOrders" size="small" stripe>
            <el-table-column prop="order_no" label="变更编号" width="200" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="app_name" label="应用" width="140" />
            <el-table-column prop="risk_level" label="风险" width="80">
              <template #default="{ row }"><el-tag :type="riskType(row.risk_level)" size="small">{{ row.risk_level }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="created_by" label="申请人" width="120" />
            <el-table-column prop="created_at" label="申请时间" width="180" />
            <el-table-column label="操作" width="260">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push(`/change-orders/${row.id}`)">详情</el-button>
                <el-button link type="success" @click="approveOrder(row)">通过</el-button>
                <el-button link type="danger" @click="rejectOrder(row)">退回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="pendingOrders.length === 0" class="muted" style="padding:24px; text-align:center;">暂无待复核的变更单</div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="告警复核" name="alerts">
        <div class="page-card">
          <el-table :data="pendingAlerts" size="small" stripe>
            <el-table-column prop="alert_no" label="告警编号" width="200" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="app_name" label="应用" width="140" />
            <el-table-column prop="severity" label="严重度" width="80">
              <template #default="{ row }"><el-tag :type="riskType(row.severity)" size="small">{{ row.severity }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="120" />
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleAlert(row)">处理</el-button>
                <el-button link type="info" @click="closeAlert(row)">关闭</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="pendingAlerts.length === 0" class="muted" style="padding:24px; text-align:center;">暂无待复核的告警</div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="handleAlertVisible" title="处理告警" width="500px">
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="处理结果">
          <el-select v-model="handleForm.result" style="width:100%">
            <el-option label="auto_blocked（自动拦截）" value="auto_blocked" />
            <el-option label="human_review（人工复核）" value="human_review" />
            <el-option label="continue_watch（继续观察）" value="continue_watch" />
            <el-option label="closed（已关闭）" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="动作"><el-input v-model="handleForm.action" placeholder="例如：kill_process / scale_up" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleAlertVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandleAlert">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TaskAPI, OrderAPI, AlertAPI } from '../api'

const tab = ref('tasks')
const pendingTasks = ref([])
const pendingOrders = ref([])
const pendingAlerts = ref([])
const handleAlertVisible = ref(false)
const currentAlert = ref(null)
const handleForm = ref({ result: '', action: '' })

async function load() {
  const t = await TaskAPI.pendingReview()
  if (t?.code === 0) pendingTasks.value = t.data

  const o = await OrderAPI.pendingReview()
  if (o?.code === 0) pendingOrders.value = o.data

  const a = await AlertAPI.list({ status: 'open' })
  if (a?.code === 0) pendingAlerts.value = a.data
}
onMounted(load)
watch(tab, load)

async function reviewTask(row, decision) {
  const reason = await ElMessageBox.prompt('复核意见', '意见', { inputPlaceholder: '留空使用默认' }).catch(() => ({ value: '' }))
  const res = await TaskAPI.review(row.id, { decision, reason: reason.value })
  if (res?.code === 0) { ElMessage.success('复核完成'); load() }
}
async function approveOrder(row) {
  const res = await OrderAPI.approve(row.id)
  if (res?.code === 0) { ElMessage.success('已审批'); load() }
}
async function rejectOrder(row) {
  const { value } = await ElMessageBox.prompt('退回原因', '退回', { inputPlaceholder: '例如：描述不充分' }).catch(() => ({ value: '' }))
  const res = await OrderAPI.reject(row.id, { reason: value })
  if (res?.code === 0) { ElMessage.success('已退回'); load() }
}
function handleAlert(row) {
  currentAlert.value = row
  handleForm.value = { result: '', action: '' }
  handleAlertVisible.value = true
}
async function submitHandleAlert() {
  if (!handleForm.value.result) return ElMessage.warning('请选择处理结果')
  const res = await AlertAPI.handle(currentAlert.value.id, handleForm.value)
  if (res?.code === 0) { ElMessage.success('处理完成'); handleAlertVisible.value = false; load() }
}
async function closeAlert(row) {
  try {
    await ElMessageBox.confirm(`确定关闭告警 ${row.alert_no}？`, '提示', { type: 'warning' })
    const res = await AlertAPI.close(row.id, {})
    if (res?.code === 0) { ElMessage.success('已关闭'); load() }
  } catch (e) {}
}
function statusType(s) {
  return { created: 'info', submitted: 'warning', approved: 'success', executed: 'success', failed: 'danger', reviewing: 'warning', rejected: 'danger', open: 'danger', watching: 'warning', closed: 'info', blocked: 'danger' }[s] || ''
}
function riskType(s) { return { low: 'success', medium: 'warning', high: 'danger', critical: 'danger', info: 'info' }[s] || '' }
</script>
