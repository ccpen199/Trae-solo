<template>
  <div class="issues-page">
    <div class="page-header">
      <h2 class="page-title">问题管理</h2>
      <el-button type="primary" @click="openCreateDialog" v-if="canCreateIssue">
        <el-icon><Plus /></el-icon>
        新建问题
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="专业">
          <el-select v-model="filters.specialty" clearable placeholder="全部专业">
            <el-option v-for="s in specialties" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼栋">
          <el-select v-model="filters.building" clearable placeholder="全部楼栋">
            <el-option v-for="b in buildings" :key="b" :label="b" :value="b" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任单位">
          <el-select v-model="filters.responsible_org_id" clearable placeholder="全部单位">
            <el-option v-for="org in organizations" :key="org.id" :label="org.name" :value="org.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="超期风险">
          <el-switch v-model="filters.overdue" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadIssues">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="displayIssues" stripe v-loading="loading">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="title" label="问题标题" min-width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">
              {{ row.title }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="floor" label="楼层" width="100" />
        <el-table-column prop="specialty" label="专业" width="100">
          <template #default="{ row }">
            {{ specialtyMap[row.specialty] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="issue_type" label="类型" width="100">
          <template #default="{ row }">
            {{ typeMap[row.issue_type] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="severityTypeMap[row.severity]">
              {{ severityMap[row.severity] || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsible_org_name" label="责任单位" width="120" />
        <el-table-column label="超期" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_overdue" type="danger" size="small">超期</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">详情</el-button>
            <el-button type="primary" link @click="openFlowDialog(row)" v-if="canHandleIssue(row)">
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新建问题" width="800px">
      <el-form :model="newIssue" label-width="100px" ref="issueForm">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="问题标题" prop="title" :rules="[{ required: true, message: '请输入标题' }]">
              <el-input v-model="newIssue.title" placeholder="请输入问题标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专业">
              <el-select v-model="newIssue.specialty" placeholder="请选择专业">
                <el-option v-for="s in specialties" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="问题类型">
              <el-select v-model="newIssue.issue_type" placeholder="请选择类型">
                <el-option v-for="t in issueTypes" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重程度">
              <el-select v-model="newIssue.severity" placeholder="请选择严重程度">
                <el-option v-for="s in severityOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任单位">
              <el-select v-model="newIssue.responsible_org_id" placeholder="请选择责任单位">
                <el-option v-for="org in organizations" :key="org.id" :label="org.name" :value="org.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="楼栋">
              <el-input v-model="newIssue.building" placeholder="例如：A栋" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="楼层">
              <el-input v-model="newIssue.floor" placeholder="例如：3F" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="模型位置">
              <el-input v-model="newIssue.model_location" placeholder="模型构件ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图纸版本">
              <el-input v-model="newIssue.drawing_version" placeholder="例如：V1.0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="整改期限">
              <el-date-picker v-model="newIssue.due_date" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="问题描述">
              <el-input v-model="newIssue.description" type="textarea" :rows="3" placeholder="请详细描述问题" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createIssue">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="flowDialogVisible" :title="flowDialogTitle" width="600px">
      <el-form :model="flowForm" label-width="100px">
        <el-form-item label="操作类型">
          <el-select v-model="flowForm.action" :disabled="!!currentIssue">
            <el-option v-for="a in flowActions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="flowForm.action === 'assign' || flowForm.action === 'reassign'" label="转派给">
          <el-select v-model="flowForm.responsible_org_id" placeholder="请选择责任单位">
            <el-option v-for="org in organizations" :key="org.id" :label="org.name" :value="org.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="flowForm.action === 'assign'" label="整改期限">
          <el-date-picker v-model="flowForm.due_date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="flowForm.action === 'verify'" label="是否通过">
          <el-radio-group v-model="flowForm.passed">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理意见">
          <el-input v-model="flowForm.comment" type="textarea" :rows="3" placeholder="请输入处理意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="flowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFlow">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { issuesAPI, orgsAPI } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const issues = ref([])
const organizations = ref([])
const createDialogVisible = ref(false)
const flowDialogVisible = ref(false)
const currentIssue = ref(null)

const filters = ref({
  specialty: '',
  building: '',
  status: '',
  responsible_org_id: '',
  overdue: false
})

const displayIssues = computed(() => {
  if (userStore.isAdmin) return issues.value
  return issues.value.filter(i => i.responsible_org_id === userStore.userOrgId)
})

const canCreateIssue = computed(() => userStore.isAdmin || userStore.isOwner || userStore.isSupervisor)

watch(() => userStore.currentUser, () => {
  loadIssues()
}, { deep: true })

const newIssue = ref({
  title: '',
  description: '',
  model_location: '',
  floor: '',
  building: '',
  specialty: '',
  issue_type: '',
  severity: '',
  drawing_version: '',
  responsible_org_id: null,
  due_date: ''
})

const flowForm = ref({
  action: '',
  responsible_org_id: null,
  due_date: '',
  comment: '',
  passed: true
})

const flowActions = [
  { value: 'assign', label: '派发' },
  { value: 'reassign', label: '转派' },
  { value: 'fix', label: '整改提交' },
  { value: 'reject', label: '退回整改' },
  { value: 'verify', label: '复验' },
  { value: 'close', label: '关闭' }
]

const flowDialogTitle = ref('流程处理')

const specialties = [
  { value: 'architecture', label: '建筑' },
  { value: 'structure', label: '结构' },
  { value: 'mep', label: '机电' },
  { value: 'civil', label: '土建' },
  { value: 'hvac', label: '暖通' },
  { value: 'plumbing', label: '给排水' },
  { value: 'electrical', label: '电气' }
]

const buildings = ['A栋', 'B栋', 'C栋', 'D栋']

const issueTypes = [
  { value: 'design', label: '设计问题' },
  { value: 'construction', label: '施工问题' },
  { value: 'material', label: '材料问题' },
  { value: 'safety', label: '安全问题' },
  { value: 'quality', label: '质量问题' },
  { value: 'conflict', label: '碰撞冲突' }
]

const severityOptions = [
  { value: 'critical', label: '严重' },
  { value: 'major', label: '主要' },
  { value: 'minor', label: '次要' },
  { value: 'trivial', label: '轻微' }
]

const statusOptions = [
  { value: 'pending', label: '待派发' },
  { value: 'assigned', label: '已派发' },
  { value: 'fixed', label: '待复验' },
  { value: 'rejected', label: '已退回' },
  { value: 'verified', label: '已验收' },
  { value: 'closed', label: '已关闭' }
]

const statusMap = {
  draft: '草稿',
  pending: '待派发',
  assigned: '已派发',
  fixed: '待复验',
  rejected: '已退回',
  verified: '已验收',
  reopened: '已重开',
  closed: '已关闭'
}

const statusTypeMap = {
  draft: 'info',
  pending: 'warning',
  assigned: 'primary',
  fixed: 'success',
  rejected: 'danger',
  verified: 'success',
  reopened: 'warning',
  closed: 'info'
}

const specialtyMap = {
  architecture: '建筑',
  structure: '结构',
  mep: '机电',
  civil: '土建',
  hvac: '暖通',
  plumbing: '给排水',
  electrical: '电气'
}

const typeMap = {
  design: '设计问题',
  construction: '施工问题',
  material: '材料问题',
  safety: '安全问题',
  quality: '质量问题',
  conflict: '碰撞冲突'
}

const severityMap = {
  critical: '严重',
  major: '主要',
  minor: '次要',
  trivial: '轻微'
}

const severityTypeMap = {
  critical: 'danger',
  major: 'warning',
  minor: 'primary',
  trivial: 'info'
}

const canHandleIssue = (row) => {
  if (row.status === 'closed') return false
  if (userStore.isAdmin || userStore.isOwner || userStore.isSupervisor) {
    return row.status !== 'assigned' && row.status !== 'reopened' && row.status !== 'rejected'
  }
  if (row.status === 'assigned' || row.status === 'reopened' || row.status === 'rejected') {
    return row.responsible_org_id === userStore.userOrgId
  }
  return false
}

const loadIssues = async () => {
  loading.value = true
  try {
    const params = {}
    Object.keys(filters.value).forEach(key => {
      if (filters.value[key]) {
        params[key] = filters.value[key]
      }
    })
    const res = await issuesAPI.list(params)
    issues.value = res.data
  } catch (e) {
    ElMessage.error('加载问题列表失败')
  } finally {
    loading.value = false
  }
}

const loadOrganizations = async () => {
  try {
    const res = await orgsAPI.list()
    organizations.value = res.data
  } catch (e) {
    console.error('加载组织失败', e)
  }
}

const resetFilters = () => {
  filters.value = {
    specialty: '',
    building: '',
    status: '',
    responsible_org_id: '',
    overdue: false
  }
  loadIssues()
}

const openCreateDialog = () => {
  newIssue.value = {
    title: '',
    description: '',
    model_location: '',
    floor: '',
    building: '',
    specialty: '',
    issue_type: '',
    severity: '',
    drawing_version: '',
    responsible_org_id: null,
    due_date: ''
  }
  createDialogVisible.value = true
}

const createIssue = async () => {
  if (!newIssue.value.title) {
    ElMessage.warning('请输入问题标题')
    return
  }
  if (!newIssue.value.model_location && !newIssue.value.floor) {
    ElMessage.warning('请补充定位信息（模型位置或楼层）')
    return
  }
  try {
    await issuesAPI.create(newIssue.value)
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    loadIssues()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '创建失败')
  }
}

const openFlowDialog = (issue) => {
  currentIssue.value = issue
  flowForm.value = {
    action: '',
    responsible_org_id: null,
    due_date: '',
    comment: '',
    passed: true
  }
  flowDialogVisible.value = true
}

const submitFlow = async () => {
  if (!flowForm.value.action) {
    ElMessage.warning('请选择操作类型')
    return
  }
  try {
    const id = currentIssue.value.id
    switch (flowForm.value.action) {
      case 'assign':
        await issuesAPI.assign(id, {
          responsible_org_id: flowForm.value.responsible_org_id,
          due_date: flowForm.value.due_date,
          comment: flowForm.value.comment
        })
        break
      case 'reassign':
        await issuesAPI.reassign(id, {
          responsible_org_id: flowForm.value.responsible_org_id,
          comment: flowForm.value.comment
        })
        break
      case 'fix':
        await issuesAPI.fix(id, { comment: flowForm.value.comment })
        break
      case 'reject':
        await issuesAPI.reject(id, { comment: flowForm.value.comment })
        break
      case 'verify':
        await issuesAPI.verify(id, {
          passed: flowForm.value.passed,
          comment: flowForm.value.comment
        })
        break
      case 'close':
        await issuesAPI.close(id, { comment: flowForm.value.comment })
        break
    }
    ElMessage.success('操作成功')
    flowDialogVisible.value = false
    loadIssues()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const viewDetail = (id) => {
  router.push(`/issues/${id}`)
}

onMounted(() => {
  loadIssues()
  loadOrganizations()
})
</script>

<style scoped>
.issues-page {
  padding-bottom: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.filter-card {
  margin-bottom: 20px;
}
.filter-form {
  margin: 0;
}
.text-muted {
  color: #909399;
}
</style>
