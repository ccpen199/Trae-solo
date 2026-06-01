<template>
  <div>
    <div class="page-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 class="page-title" style="margin:0">告警中心</h2>
        <div>
          <el-input v-model="keyword" placeholder="搜索告警" size="small" style="width:220px" clearable />
          <el-select v-model="filter.severity" placeholder="严重度" size="small" style="width:110px; margin-left:8px" clearable>
            <el-option label="info" value="info" /><el-option label="low" value="low" />
            <el-option label="medium" value="medium" /><el-option label="high" value="high" /><el-option label="critical" value="critical" />
          </el-select>
          <el-select v-model="filter.status" placeholder="状态" size="small" style="width:110px; margin-left:8px" clearable>
            <el-option label="open" value="open" /><el-option label="blocked" value="blocked" />
            <el-option label="reviewing" value="reviewing" /><el-option label="watching" value="watching" /><el-option label="closed" value="closed" />
          </el-select>
          <el-button type="primary" size="small" style="margin-left:8px" @click="openCreate">新增告警</el-button>
        </div>
      </div>
      <el-divider />
      <el-table :data="rows" size="small" stripe>
        <el-table-column prop="alert_no" label="告警编号" width="200" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="app_name" label="应用" width="140" />
        <el-table-column prop="severity" label="严重度" width="80">
          <template #default="{ row }"><el-tag :type="riskType(row.severity)" size="small">{{ row.severity }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="auto_action" label="自动动作" width="140" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button link v-if="row.status === 'open'" type="primary" @click="handle(row)">处理</el-button>
            <el-button link v-if="row.status !== 'closed'" type="info" @click="close(row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="新增告警" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="应用">
          <el-select v-model="form.app_id" style="width:100%" clearable>
            <el-option v-for="a in apps" :key="a.id" :label="a.app_name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重度">
          <el-select v-model="form.severity" style="width:100%">
            <el-option label="info" value="info" /><el-option label="low" value="low" />
            <el-option label="medium" value="medium" /><el-option label="high" value="high" /><el-option label="critical" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源"><el-input v-model="form.source" placeholder="monitor/manual/task_execution" /></el-form-item>
        <el-form-item label="详情"><el-input v-model="form.detail" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="handleVisible" title="处理告警" width="500px">
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
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AlertAPI, AppAPI } from '../api'

const rows = ref([])
const apps = ref([])
const keyword = ref('')
const filter = ref({ severity: '', status: '' })
const dialogVisible = ref(false)
const handleVisible = ref(false)
const handleForm = ref({ result: '', action: '' })
const current = ref(null)
const form = ref({ title: '', app_id: '', severity: 'info', source: 'manual', detail: '' })

async function load() {
  const params = { keyword: keyword.value }
  if (filter.value.severity) params.severity = filter.value.severity
  if (filter.value.status) params.status = filter.value.status
  const res = await AlertAPI.list(params)
  if (res?.code === 0) rows.value = res.data
}
async function loadApps() {
  const res = await AppAPI.list({})
  if (res?.code === 0) apps.value = res.data
}
onMounted(() => { load(); loadApps() })
watch([keyword, filter], load, { deep: true })

function openCreate() {
  form.value = { title: '', app_id: '', severity: 'info', source: 'manual', detail: '' }
  dialogVisible.value = true
}
async function save() {
  if (!form.value.title) return ElMessage.warning('标题必填')
  const res = await AlertAPI.create(form.value)
  if (res?.code === 0) { ElMessage.success('创建成功'); dialogVisible.value = false; load() }
}
function handle(row) {
  current.value = row
  handleForm.value = { result: '', action: '' }
  handleVisible.value = true
}
async function submitHandle() {
  if (!handleForm.value.result) return ElMessage.warning('请选择处理结果')
  const res = await AlertAPI.handle(current.value.id, handleForm.value)
  if (res?.code === 0) { ElMessage.success('处理完成'); handleVisible.value = false; load() }
}
async function close(row) {
  try {
    await ElMessageBox.confirm(`确定关闭告警 ${row.alert_no}？`, '提示', { type: 'warning' })
    const res = await AlertAPI.close(row.id, {})
    if (res?.code === 0) { ElMessage.success('已关闭'); load() }
  } catch (e) {}
}
function statusType(s) {
  return { open: 'danger', blocked: 'danger', reviewing: 'warning', watching: 'warning', closed: 'info' }[s] || ''
}
function riskType(s) { return { info: 'info', low: 'success', medium: 'warning', high: 'danger', critical: 'danger' }[s] || '' }
</script>
