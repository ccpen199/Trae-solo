<template>
  <div>
    <div class="page-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 class="page-title" style="margin:0">变更单</h2>
        <div>
          <el-input v-model="keyword" placeholder="搜索编号/标题" size="small" style="width:220px" clearable />
          <el-select v-model="filter.status" placeholder="状态" size="small" style="width:120px; margin-left:8px" clearable>
            <el-option v-for="s in ['draft','submitted','approved','executed','failed','rejected','closed','reviewing']" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="filter.risk_level" placeholder="风险" size="small" style="width:100px; margin-left:8px" clearable>
            <el-option label="low" value="low" /><el-option label="medium" value="medium" />
            <el-option label="high" value="high" /><el-option label="critical" value="critical" />
          </el-select>
          <el-button type="primary" size="small" style="margin-left:8px" @click="openCreate">新增变更</el-button>
        </div>
      </div>
      <el-divider />
      <el-table :data="rows" size="small" stripe>
        <el-table-column prop="order_no" label="变更编号" width="200" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="app_name" label="应用" width="140" />
        <el-table-column prop="change_type" label="类型" width="110" />
        <el-table-column prop="risk_level" label="风险" width="80">
          <template #default="{ row }"><el-tag :type="riskType(row.risk_level)" size="small">{{ row.risk_level }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="created_by" label="申请人" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="420">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/change-orders/${row.id}`)">详情</el-button>
            <el-button link v-if="row.status === 'draft'" type="success" @click="submit(row)">提交</el-button>
            <el-button link v-if="['submitted','rejected'].includes(row.status) && !isCreator(row)" type="primary" @click="approve(row)">审批</el-button>
            <el-button link v-if="['submitted','approved','reviewing'].includes(row.status) && !isCreator(row)" type="warning" @click="reject(row)">退回</el-button>
            <el-button link v-if="row.status === 'approved'" type="warning" @click="execute(row)">执行</el-button>
            <el-button link v-if="row.status !== 'closed'" type="info" @click="close(row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑变更' : '新增变更'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="应用">
          <el-select v-model="form.app_id" style="width:100%" clearable>
            <el-option v-for="a in apps" :key="a.id" :label="a.app_name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.change_type" style="width:100%">
            <el-option label="release" value="release" /><el-option label="config" value="config" />
            <el-option label="rollback" value="rollback" /><el-option label="emergency" value="emergency" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险">
          <el-select v-model="form.risk_level">
            <el-option label="low" value="low" /><el-option label="medium" value="medium" />
            <el-option label="high" value="high" /><el-option label="critical" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更窗口(起)"><el-input v-model="form.window_start" placeholder="YYYY-MM-DD HH:mm" /></el-form-item>
        <el-form-item label="变更窗口(止)"><el-input v-model="form.window_end" placeholder="YYYY-MM-DD HH:mm" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OrderAPI, AppAPI } from '../api'

const rows = ref([])
const apps = ref([])
const keyword = ref('')
const filter = ref({ status: '', risk_level: '' })
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({ title: '', app_id: '', change_type: 'release', risk_level: 'low', window_start: '', window_end: '', description: '' })
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

function isCreator(row) {
  return row.created_by && row.created_by === user.value?.username && user.value?.role !== 'admin'
}

async function load() {
  const params = { keyword: keyword.value }
  if (filter.value.status) params.status = filter.value.status
  if (filter.value.risk_level) params.risk_level = filter.value.risk_level
  const res = await OrderAPI.list(params)
  if (res?.code === 0) rows.value = res.data
}
async function loadApps() {
  const res = await AppAPI.list({})
  if (res?.code === 0) apps.value = res.data
}
onMounted(() => { load(); loadApps() })
watch([keyword, filter], load, { deep: true })

function openCreate() {
  editing.value = null
  form.value = { title: '', app_id: '', change_type: 'release', risk_level: 'low', window_start: '', window_end: '', description: '' }
  dialogVisible.value = true
}
async function save() {
  if (!form.value.title) return ElMessage.warning('标题必填')
  const res = await OrderAPI.create(form.value)
  if (res?.code === 0) { ElMessage.success('创建成功'); dialogVisible.value = false; load() }
}
async function submit(row) { const res = await OrderAPI.submit(row.id); if (res?.code === 0) { ElMessage.success('已提交'); load() } }
async function approve(row) { const res = await OrderAPI.approve(row.id); if (res?.code === 0) { ElMessage.success('已审批'); load() } }
async function reject(row) {
  try {
    const { value } = await ElMessageBox.prompt('退回原因', '退回', { inputPlaceholder: '例如：描述不充分' }).catch(() => ({ value: '' }))
    const res = await OrderAPI.reject(row.id, { reason: value })
    if (res?.code === 0) { ElMessage.success('已退回'); load() }
  } catch (e) {}
}
async function execute(row) {
  try {
    const res = await OrderAPI.execute(row.id)
    if (res?.code === 0) { ElMessage.success(res.data?.success ? '执行成功' : '执行失败'); load() }
  } catch (e) {
    if (e.response?.status === 409) ElMessage.warning(e.response.data.message)
  }
}
async function close(row) {
  try {
    const { value } = await ElMessageBox.prompt('关闭原因', '关闭').catch(() => ({ value: '' }))
    const res = await OrderAPI.close(row.id, { reason: value })
    if (res?.code === 0) { ElMessage.success('已关闭'); load() }
  } catch (e) {}
}
function statusType(s) {
  return { draft: 'info', submitted: 'warning', approved: 'success', executed: 'success',
    failed: 'danger', rejected: 'danger', closed: 'info', reviewing: 'warning' }[s] || ''
}
function riskType(s) {
  return { low: 'success', medium: 'warning', high: 'danger', critical: 'danger' }[s] || ''
}
</script>
