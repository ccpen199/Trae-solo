<template>
  <div>
    <div class="page-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 class="page-title" style="margin:0">执行任务</h2>
        <div>
          <el-input v-model="keyword" placeholder="搜索任务编号/标题" size="small" style="width:220px" clearable />
          <el-select v-model="filter.status" placeholder="状态" size="small" style="width:120px; margin-left:8px" clearable>
            <el-option v-for="s in ['created','submitted','executed','failed','reviewing','rejected','closed']" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="filter.app_id" placeholder="应用" size="small" style="width:140px; margin-left:8px" clearable>
            <el-option v-for="a in apps" :key="a.id" :label="a.app_name" :value="a.id" />
          </el-select>
          <el-button type="primary" size="small" style="margin-left:8px" @click="openCreate">新增任务</el-button>
        </div>
      </div>
      <el-divider />
      <el-table :data="rows" size="small" stripe>
        <el-table-column prop="task_no" label="任务编号" width="200" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="app_name" label="应用" width="140" />
        <el-table-column prop="task_type" label="类型" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="created_by" label="申请人" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="380">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/tasks/${row.id}`)">详情</el-button>
            <el-button link v-if="row.status === 'created'" type="success" @click="submit(row)">提交</el-button>
            <el-button link v-if="['created','submitted'].includes(row.status)" type="warning" @click="execute(row)">执行</el-button>
            <el-button link v-if="['submitted','reviewing','failed','executed'].includes(row.status) && !isCreator(row)" type="info" @click="review(row)">复核</el-button>
            <el-button link v-if="row.status !== 'closed'" type="info" @click="close(row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑任务' : '新增任务'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="应用">
          <el-select v-model="form.app_id" style="width:100%" clearable>
            <el-option v-for="a in apps" :key="a.id" :label="a.app_name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.task_type" style="width:100%">
            <el-option label="deploy" value="deploy" /><el-option label="inspect" value="inspect" />
            <el-option label="rollback" value="rollback" /><el-option label="restart" value="restart" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数(JSON)"><el-input v-model="form.paramsText" type="textarea" :rows="3" placeholder='例如 {"version":"1.0.0"}' /></el-form-item>
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
import { TaskAPI, AppAPI } from '../api'

const rows = ref([])
const apps = ref([])
const keyword = ref('')
const filter = ref({ status: '', app_id: '' })
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({ title: '', app_id: '', task_type: '', paramsText: '' })
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

function isCreator(row) {
  return row.created_by && row.created_by === user.value?.username && user.value?.role !== 'admin'
}

async function load() {
  const params = { keyword: keyword.value }
  if (filter.value.status) params.status = filter.value.status
  if (filter.value.app_id) params.app_id = filter.value.app_id
  const res = await TaskAPI.list(params)
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
  form.value = { title: '', app_id: '', task_type: 'deploy', paramsText: '' }
  dialogVisible.value = true
}
async function save() {
  if (!form.value.title) return ElMessage.warning('标题必填')
  const payload = { ...form.value }
  delete payload.paramsText
  if (form.value.paramsText) {
    try { payload.params = JSON.parse(form.value.paramsText) } catch (e) { return ElMessage.warning('参数必须是合法 JSON') }
  }
  const res = await TaskAPI.create(payload)
  if (res?.code === 0) { ElMessage.success('创建成功'); dialogVisible.value = false; load() }
}
async function submit(row) {
  const res = await TaskAPI.submit(row.id)
  if (res?.code === 0) { ElMessage.success('提交成功'); load() }
}
async function execute(row) {
  try {
    const res = await TaskAPI.execute(row.id)
    if (res?.code === 0) { ElMessage.success(res.data?.success ? '执行成功' : '执行失败'); load() }
  } catch (e) {
    if (e.response?.status === 409) ElMessage.warning(e.response.data.message)
  }
}
async function review(row) {
  const { value } = await ElMessageBox.prompt('请输入复核结果（approve / reject）', '复核', {
    inputPattern: /^(approve|reject)$/, inputErrorMessage: '只能输入 approve 或 reject'
  }).catch(() => ({ value: null }))
  if (!value) return
  const reason = await ElMessageBox.prompt('复核意见', '意见', { inputPlaceholder: '留空使用默认' }).catch(() => ({ value: '' }))
  const res = await TaskAPI.review(row.id, { decision: value, reason: reason.value })
  if (res?.code === 0) { ElMessage.success('复核完成'); load() }
}
async function close(row) {
  try {
    const { value } = await ElMessageBox.prompt('关闭原因', '关闭', { inputPlaceholder: '留空使用默认' }).catch(() => ({ value: '' }))
    const res = await TaskAPI.close(row.id, { reason: value })
    if (res?.code === 0) { ElMessage.success('已关闭'); load() }
  } catch (e) {}
}
function statusType(s) {
  return { created: 'info', submitted: 'warning', executed: 'success', failed: 'danger',
    reviewing: 'warning', rejected: 'danger', closed: 'info', blocked: 'danger' }[s] || ''
}
</script>
