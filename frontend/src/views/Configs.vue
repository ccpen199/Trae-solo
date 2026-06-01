<template>
  <div>
    <div class="page-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 class="page-title" style="margin:0">配置中心</h2>
        <div>
          <el-input v-model="keyword" placeholder="搜索键/值" size="small" style="width:200px" clearable />
          <el-select v-model="filter.app_id" placeholder="应用" size="small" style="width:140px; margin-left:8px" clearable>
            <el-option v-for="a in apps" :key="a.id" :label="a.app_name" :value="a.id" />
          </el-select>
          <el-select v-model="filter.status" placeholder="状态" size="small" style="width:100px; margin-left:8px" clearable>
            <el-option label="active" value="active" /><el-option label="inactive" value="inactive" />
            <el-option label="pending" value="pending" /><el-option label="archived" value="archived" />
          </el-select>
          <el-button type="primary" size="small" style="margin-left:8px" @click="openCreate">新增配置</el-button>
        </div>
      </div>
      <el-divider />
      <el-table :data="rows" size="small" stripe>
        <el-table-column prop="app_name" label="应用" width="140" />
        <el-table-column prop="env_name" label="环境" width="100" />
        <el-table-column prop="config_key" label="配置键" width="180" />
        <el-table-column prop="config_value" label="配置值" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="value_type" label="类型" width="80" />
        <el-table-column prop="version_no" label="版本" width="70" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link type="warning" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑配置' : '新增配置'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="应用">
          <el-select v-model="form.app_id" style="width:100%" :disabled="!!editing">
            <el-option v-for="a in apps" :key="a.id" :label="a.app_name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="form.env_id" style="width:100%" clearable>
            <el-option v-for="e in envsOfApp" :key="e.id" :label="e.env_name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置键"><el-input v-model="form.config_key" :disabled="!!editing" /></el-form-item>
        <el-form-item label="配置值"><el-input v-model="form.config_value" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width:100%">
            <el-option label="common" value="common" /><el-option label="performance" value="performance" />
            <el-option label="security" value="security" /><el-option label="feature" value="feature" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.value_type">
            <el-option label="string" value="string" /><el-option label="number" value="number" />
            <el-option label="boolean" value="boolean" /><el-option label="json" value="json" /><el-option label="secret" value="secret" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="active" value="active" /><el-option label="inactive" value="inactive" />
            <el-option label="pending" value="pending" /><el-option label="archived" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因"><el-input v-model="form.change_reason" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="配置详情" width="700px">
      <div v-if="detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="应用">{{ detail.app_name }}</el-descriptions-item>
          <el-descriptions-item label="环境">{{ detail.env_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="键">{{ detail.config_key }}</el-descriptions-item>
          <el-descriptions-item label="值"><code>{{ detail.config_value }}</code></el-descriptions-item>
          <el-descriptions-item label="分类">{{ detail.category }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ detail.value_type }}</el-descriptions-item>
          <el-descriptions-item label="当前版本">v{{ detail.version_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
        </el-descriptions>
        <h3 style="margin-top:16px">历史版本</h3>
        <el-table :data="detail.history" size="small" stripe>
          <el-table-column prop="version_no" label="版本" width="80">
            <template #default="{ row }">v{{ row.version_no }}</template>
          </el-table-column>
          <el-table-column prop="config_value" label="值" show-overflow-tooltip />
          <el-table-column prop="changed_by" label="操作人" width="120" />
          <el-table-column prop="change_reason" label="原因" />
          <el-table-column prop="action" label="动作" width="100" />
          <el-table-column prop="changed_at" label="时间" width="180" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="warning" @click="revert(detail.id, row.version_no)" :disabled="row.version_no === detail.version_no">回滚</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ConfigAPI, AppAPI } from '../api'

const rows = ref([])
const apps = ref([])
const envs = ref([])
const keyword = ref('')
const filter = ref({ app_id: '', status: '' })
const dialogVisible = ref(false)
const detailVisible = ref(false)
const editing = ref(null)
const detail = ref(null)
const form = ref({
  app_id: '', env_id: '', config_key: '', config_value: '', category: 'common',
  value_type: 'string', description: '', status: 'active', change_reason: ''
})

const envsOfApp = computed(() => envs.value.filter(e => e.app_id == form.value.app_id))

async function load() {
  const params = { keyword: keyword.value }
  if (filter.value.app_id) params.app_id = filter.value.app_id
  if (filter.value.status) params.status = filter.value.status
  const res = await ConfigAPI.list(params)
  if (res?.code === 0) rows.value = res.data
}
async function loadApps() {
  const res = await AppAPI.list({})
  if (res?.code === 0) {
    apps.value = res.data
    const all = []
    for (const a of res.data) {
      const r = await AppAPI.listEnvs(a.id)
      if (r?.code === 0) all.push(...r.data.map(e => ({ ...e, app_id: a.id })))
    }
    envs.value = all
  }
}
onMounted(() => { load(); loadApps() })
watch([keyword, filter], load, { deep: true })

function openCreate() {
  editing.value = null
  form.value = { app_id: '', env_id: '', config_key: '', config_value: '', category: 'common', value_type: 'string', description: '', status: 'active', change_reason: '' }
  dialogVisible.value = true
}
function openEdit(row) {
  editing.value = row
  form.value = { ...row, change_reason: '' }
  dialogVisible.value = true
}
async function save() {
  if (!form.value.app_id || !form.value.config_key) return ElMessage.warning('应用和配置键必填')
  if (editing.value) {
    const res = await ConfigAPI.update(editing.value.id, form.value)
    if (res?.code === 0) { ElMessage.success('更新成功'); dialogVisible.value = false; load() }
  } else {
    const res = await ConfigAPI.create(form.value)
    if (res?.code === 0) { ElMessage.success('创建成功'); dialogVisible.value = false; load() }
  }
}
async function remove(row) {
  try { await ElMessageBox.confirm(`确定删除配置 ${row.config_key}？`, '提示', { type: 'warning' })
    const res = await ConfigAPI.remove(row.id)
    if (res?.code === 0) { ElMessage.success('删除成功'); load() }
  } catch (e) {}
}
async function openDetail(row) {
  const res = await ConfigAPI.get(row.id)
  if (res?.code === 0) { detail.value = res.data; detailVisible.value = true }
}
async function revert(id, version) {
  try {
    await ElMessageBox.confirm(`确定回滚至 v${version}？`, '提示', { type: 'warning' })
    const res = await ConfigAPI.revert(id, version)
    if (res?.code === 0) { ElMessage.success('回滚成功'); detailVisible.value = false; load() }
  } catch (e) {}
}
</script>
