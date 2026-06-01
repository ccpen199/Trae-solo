<template>
  <div class="permission-apply">
    <div class="page-card">
      <h2 class="page-title">权限申请</h2>
      <p class="page-desc">选择需要申请权限的应用，填写申请信息，提交后由对应负责人审批</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="apply-form">
        <el-form-item label="选择应用" prop="catalog_id">
          <el-select
            v-model="form.catalog_id" placeholder="请选择要申请权限的应用"
            filterable style="width: 100%;" size="large"
            @change="onAppChange">
            <el-option
              v-for="app in apps" :key="app.id"
              :label="`${app.icon} ${app.app_name} (${app.category})`"
              :value="app.id">
              <div class="app-option">
                <span class="icon">{{ app.icon }}</span>
                <span class="name">{{ app.app_name }}</span>
                <el-tag v-if="app.approval_required === 1" type="warning" size="small">需审批</el-tag>
                <el-tag v-else type="success" size="small">免审批</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <template v-if="selectedApp">
          <el-alert
            :title="selectedApp.approval_required === 1
              ? `该应用需由 ${ownerLabel(selectedApp.owner)} 审批，审批通过后自动开通`
              : '该应用无需审批，提交后立即开通'"
            :type="selectedApp.approval_required === 1 ? 'warning' : 'success'"
            :closable="false" show-icon style="margin-bottom: 20px;" />

          <el-form-item label="申请标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入申请标题" size="large" maxlength="100" show-word-limit />
          </el-form-item>

          <el-form-item label="授权范围" prop="scope">
            <el-select v-model="form.scope" placeholder="请选择授权范围" size="large" style="width: 100%;">
              <el-option label="全部功能" value="全部功能" />
              <el-option label="只读权限" value="只读权限" />
              <el-option label="读写权限" value="读写权限" />
              <el-option label="指定功能模块" value="指定功能模块" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="form.scope === '指定功能模块'" label="指定模块">
            <el-select v-model="form.modules" multiple placeholder="请选择具体模块" size="large" style="width: 100%;">
              <el-option label="查询模块" value="查询模块" />
              <el-option label="数据导出" value="数据导出" />
              <el-option label="配置管理" value="配置管理" />
              <el-option label="用户管理" value="用户管理" />
              <el-option label="报表中心" value="报表中心" />
            </el-select>
          </el-form-item>

          <el-form-item label="申请理由" prop="reason">
            <el-input
              v-model="form.reason" type="textarea" :rows="4"
              placeholder="请详细说明申请理由，包括使用场景、业务需求等"
              maxlength="500" show-word-limit />
          </el-form-item>

          <el-form-item label="有效期" prop="valid_to">
            <el-radio-group v-model="periodType" size="large">
              <el-radio value="custom">自定义</el-radio>
              <el-radio value="90">90 天</el-radio>
              <el-radio value="180">180 天</el-radio>
              <el-radio value="365">1 年</el-radio>
              <el-radio value="permanent">长期</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="有效期至" v-if="periodType === 'custom'" prop="valid_to">
            <el-date-picker
              v-model="form.valid_to" type="date" placeholder="选择到期日期"
              size="large" style="width: 100%;"
              :disabled-date="disabledDate" value-format="YYYY-MM-DD" />
          </el-form-item>

          <el-form-item label="审批人">
            <el-input :value="ownerLabel(selectedApp.owner)" disabled size="large" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
              <el-icon><Check /></el-icon> 提交申请
            </el-button>
            <el-button size="large" @click="resetForm">重置</el-button>
            <el-button size="large" @click="$router.push('/my-permissions')">查看我的申请</el-button>
          </el-form-item>
        </template>
      </el-form>
    </div>

    <div class="page-card" v-if="myPerms.length">
      <h3 class="section-title">📑 我的历史申请</h3>
      <el-table :data="myPerms" size="small" stripe>
        <el-table-column prop="req_no" label="申请编号" width="180" />
        <el-table-column prop="app_name" label="应用" width="130" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="scope" label="授权范围" width="120" />
        <el-table-column prop="valid_to" label="有效期至" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approval_opinion" label="审批意见" width="180" />
        <el-table-column label="操作" width="120" v-if="selectedApp">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" link type="danger" @click="handleCancel(row)">撤销</el-button>
            <el-button v-if="row.status === 'approved' && isExpiring(row)" link type="primary" @click="handleRenew(row)">续期</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CatalogAPI, PermissionAPI } from '../api'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const apps = ref([])
const myPerms = ref([])
const periodType = ref('180')

const form = reactive({
  catalog_id: null,
  title: '',
  scope: '全部功能',
  modules: [],
  reason: '',
  valid_from: new Date().toISOString().slice(0, 10),
  valid_to: ''
})

const rules = {
  catalog_id: [{ required: true, message: '请选择应用', trigger: 'change' }],
  title: [{ required: true, message: '请输入申请标题', trigger: 'blur' }],
  scope: [{ required: true, message: '请选择授权范围', trigger: 'change' }],
  reason: [{ required: true, message: '请输入申请理由', trigger: 'blur' }],
  valid_to: [{ required: true, message: '请选择有效期', trigger: 'change' }]
}

const selectedApp = computed(() =>
  form.catalog_id ? apps.value.find(a => a.id === form.catalog_id) : null
)

function computeValidTo(v) {
  if (v === 'permanent') {
    form.valid_to = '2099-12-31'
  } else if (v !== 'custom') {
    const days = parseInt(v)
    const d = new Date()
    d.setDate(d.getDate() + days)
    form.valid_to = d.toISOString().slice(0, 10)
  }
}

watch(periodType, (v) => {
  computeValidTo(v)
})

onMounted(async () => {
  computeValidTo(periodType.value)
  const [list, mine] = await Promise.all([
    CatalogAPI.list(),
    PermissionAPI.getMine()
  ])
  if (list?.code === 0) apps.value = list.data.list
  if (mine?.code === 0) myPerms.value = mine.data

  if (route.query.catalog_id) {
    form.catalog_id = parseInt(route.query.catalog_id)
    onAppChange()
  }
})

function onAppChange() {
  if (selectedApp.value) {
    form.title = `申请访问 ${selectedApp.value.app_name}`
    if (!form.reason) form.reason = `因工作需要，申请访问${selectedApp.value.app_name}，用于日常业务处理。`
  }
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload = {
      catalog_id: form.catalog_id,
      title: form.title,
      reason: form.reason,
      scope: form.scope === '指定功能模块' ? `${form.scope}：${form.modules.join(', ')}` : form.scope,
      valid_from: form.valid_from,
      valid_to: form.valid_to
    }
    const r = await PermissionAPI.create(payload)
    if (r?.code === 0) {
      if (r.data.auto_approved) {
        ElMessage.success('申请已提交，无需审批，权限已自动开通')
      } else {
        ElMessage.success(`申请已提交，编号 ${r.data.req_no}，请等待审批`)
      }
      setTimeout(() => router.push('/my-permissions'), 1500)
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  formRef.value?.resetFields()
  periodType.value = '180'
  form.catalog_id = null
}

async function handleCancel(row) {
  ElMessageBox.confirm('确定撤销此申请？', '提示', { type: 'warning' }).then(async () => {
    await PermissionAPI.cancel(row.id)
    ElMessage.success('已撤销')
    const r = await PermissionAPI.getMine()
    if (r?.code === 0) myPerms.value = r.data
  }).catch(() => {})
}

function handleRenew(row) {
  form.catalog_id = row.catalog_id
  onAppChange()
  form.title = `续期申请 - ${row.app_name}`
  form.reason = `因业务需要，申请${row.app_name}权限续期。`
  ElMessage.info('已预填充续期信息，请确认后提交')
}

function disabledDate(d) {
  return d && d.getTime() < Date.now() - 86400000
}

function isExpiring(row) {
  if (!row.valid_to) return false
  const d = new Date(row.valid_to)
  const now = new Date()
  const diff = (d - now) / (1000 * 60 * 60 * 24)
  return diff <= 30
}

function ownerLabel(o) {
  return { admin: '系统管理员', platform: '平台工程师', ops: '运维工程师', owner: '应用负责人', security: '安全管理员' }[o] || o
}
function statusType(s) {
  return { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'info', expired: 'danger' }[s] || 'info'
}
function statusLabel(s) {
  return { draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已驳回', cancelled: '已撤销', expired: '已过期' }[s] || s
}
</script>

<style scoped>
.page-desc { color: #909399; margin: 0 0 24px; }
.apply-form { max-width: 800px; }
.app-option { display: flex; align-items: center; gap: 8px; }
.app-option .icon { font-size: 18px; }
.app-option .name { flex: 1; }
.section-title { margin: 0 0 16px; font-size: 16px; }
</style>
