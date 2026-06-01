<template>
  <div class="page-container">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="page-title">预算执行</h1>
        <p class="page-subtitle">查看和管理项目预算执行情况</p>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <el-form :inline="true">
        <el-form-item label="选择项目">
          <el-select v-model="selectedProject" style="width: 300px;" @change="loadBudget">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div class="card" v-if="selectedProject">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3>预算科目执行情况</h3>
        <el-button type="primary" @click="openAdjustDialog" v-if="canSubmit">
          <el-icon><Edit /></el-icon>
          预算调整
        </el-button>
      </div>
      <el-table :data="budgetItems" border stripe>
        <el-table-column prop="subject_code" label="科目编码" width="100" />
        <el-table-column prop="subject_name" label="科目名称" width="140" />
        <el-table-column prop="budget_amount" label="预算额度" width="140">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 600;">¥{{ formatMoney(row.budget_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="used_amount" label="已使用" width="140">
          <template #default="{ row }">
            <span style="color: #e6a23c;">¥{{ formatMoney(row.used_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="frozen_amount" label="已冻结" width="120">
          <template #default="{ row }">
            <span style="color: #909399;">¥{{ formatMoney(row.frozen_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="available_amount" label="可用余额" width="140">
          <template #default="{ row }">
            <span :style="{ color: row.available_amount > 0 ? '#67c23a' : '#f56c6c', fontWeight: '600' }">
              ¥{{ formatMoney(row.available_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="执行率" width="120">
          <template #default="{ row }">
            <el-progress :percentage="getRate(row)" :stroke-width="12" />
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
      </el-table>
    </div>

    <div class="card" v-if="selectedProject" style="margin-top: 20px;">
      <h3 style="margin-bottom: 16px;">预算调整历史</h3>
      <el-table :data="adjustments" border stripe v-if="adjustments.length > 0">
        <el-table-column prop="subject_name" label="预算科目" width="140" />
        <el-table-column prop="old_amount" label="原金额" width="120">
          <template #default="{ row }">¥{{ formatMoney(row.old_amount) }}</template>
        </el-table-column>
        <el-table-column prop="new_amount" label="新金额" width="120">
          <template #default="{ row }">¥{{ formatMoney(row.new_amount) }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="调整原因" min-width="150" />
        <el-table-column prop="approver" label="审批人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" v-if="row.status === 'pending' && canApprove" @click="approveAdjust(row)">
              审批
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty description="暂无调整记录" v-else />
    </div>

    <el-dialog v-model="adjustDialogVisible" title="预算调整" width="500px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="预算科目">
          <el-select v-model="adjustForm.budget_item_id" style="width: 100%;">
            <el-option v-for="item in budgetItems" :key="item.id" :label="item.subject_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整后金额">
          <el-input-number v-model="adjustForm.new_amount" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="审批人">
          <el-input v-model="adjustForm.approver" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">提交调整</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveDialogVisible" title="审批预算调整" width="500px">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.status">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProjects, getProjectBudget, adjustBudget, approveBudgetAdjust, getBudgetAdjustments } from '../api'
import { Edit } from '@element-plus/icons-vue'
import { useUser } from '../store/user'

const { userName, canApprove, canSubmit, currentUser } = useUser()

const route = useRoute()
const projects = ref([])
const selectedProject = ref(null)
const budgetItems = ref([])
const adjustments = ref([])
const adjustDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const currentAdjust = ref(null)

const adjustForm = ref({
  project_id: null,
  budget_item_id: null,
  new_amount: 0,
  reason: '',
  approver: ''
})

const approveForm = ref({
  status: 'approved'
})

watch(currentUser, () => {
  loadBudget()
}, { immediate: false })

const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

const loadAdjustments = async () => {
  if (!selectedProject.value) return
  try {
    const res = await getBudgetAdjustments({ project_id: selectedProject.value })
    adjustments.value = res.data
  } catch (error) {
    console.error('加载调整记录失败')
  }
}

const approveAdjust = (row) => {
  currentAdjust.value = row
  approveForm.value = { status: 'approved' }
  approveDialogVisible.value = true
}

const getRate = (row) => {
  if (!row.budget_amount) return 0
  return Math.round((row.used_amount / row.budget_amount) * 100)
}

const loadProjects = async () => {
  try {
    const res = await getProjects()
    projects.value = res.data
    if (projects.value.length > 0) {
      const projectId = route.query.projectId ? parseInt(route.query.projectId) : projects.value[0].id
      selectedProject.value = projectId
      loadBudget()
    }
  } catch (error) {
    ElMessage.error('加载项目列表失败')
  }
}

const loadBudget = async () => {
  if (!selectedProject.value) return
  try {
    const [budgetRes, adjustRes] = await Promise.all([
      getProjectBudget(selectedProject.value),
      getBudgetAdjustments({ project_id: selectedProject.value })
    ])
    budgetItems.value = budgetRes.data
    adjustments.value = adjustRes.data
  } catch (error) {
    ElMessage.error('加载预算数据失败')
  }
}

const openAdjustDialog = () => {
  adjustForm.value = {
    project_id: selectedProject.value,
    budget_item_id: budgetItems.value[0]?.id,
    new_amount: 0,
    reason: '',
    approver: userName.value
  }
  adjustDialogVisible.value = true
}

const submitAdjust = async () => {
  try {
    await adjustBudget(adjustForm.value)
    ElMessage.success('预算调整成功')
    adjustDialogVisible.value = false
    loadBudget()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '调整失败')
  }
}

const submitApprove = async () => {
  try {
    await approveBudgetAdjust(currentAdjust.value.id, approveForm.value)
    ElMessage.success('审批完成')
    approveDialogVisible.value = false
    loadBudget()
  } catch (error) {
    ElMessage.error('审批失败')
  }
}

onMounted(() => {
  loadProjects()
})
</script>
