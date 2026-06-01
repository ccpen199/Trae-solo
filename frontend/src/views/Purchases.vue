<template>
  <div class="page-container">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="page-title">采购管理</h1>
        <p class="page-subtitle">管理项目采购申请</p>
      </div>
      <el-button type="primary" @click="openDialog" v-if="canSubmit">
        <el-icon><Plus /></el-icon>
        新增采购
      </el-button>
    </div>

    <div class="card">
      <el-table :data="purchases" border stripe>
        <el-table-column prop="purchase_no" label="采购单号" width="130" />
        <el-table-column prop="project_name" label="所属项目" min-width="180" />
        <el-table-column prop="subject_name" label="预算科目" width="120" />
        <el-table-column prop="item_name" label="采购物品" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="unit_price" label="单价" width="100">
          <template #default="{ row }">
            ¥{{ formatMoney(row.unit_price) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总金额" width="120">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 600;">¥{{ formatMoney(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column label="已验收" width="80">
          <template #default="{ row }">
            <el-tag :type="row.has_acceptance ? 'success' : 'warning'" size="small">
              {{ row.has_acceptance ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" type="primary" v-if="row.status === 'pending' && canApprove" @click="approve(row)">
                审批
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="新增采购" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="所属项目">
          <el-select v-model="form.project_id" style="width: 100%;" @change="loadBudgetItems">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算科目">
          <el-select v-model="form.budget_item_id" style="width: 100%;">
            <el-option v-for="item in budgetItems" :key="item.id" :label="item.subject_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购单号">
          <el-input v-model="form.purchase_no" />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="form.applicant" />
        </el-form-item>
        <el-form-item label="采购物品">
          <el-input v-model="form.item_name" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="1" style="width: 100%;" @change="calcTotal" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="form.unit_price" :min="0" :precision="2" style="width: 100%;" @change="calcTotal" />
        </el-form-item>
        <el-form-item label="总金额">
          <span style="font-size: 18px; font-weight: 600; color: #409eff;">¥{{ formatMoney(form.total_amount) }}</span>
        </el-form-item>
        <el-form-item label="已验收">
          <el-switch v-model="form.has_acceptance" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPurchase">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveDialogVisible" title="审批采购" width="400px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="审批人">
          <el-input v-model="approveForm.approver" />
        </el-form-item>
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
import { ElMessage } from 'element-plus'
import { getPurchases, createPurchase, getProjects, getProjectBudget, approvePurchase } from '../api'
import { Plus } from '@element-plus/icons-vue'
import { useUser } from '../store/user'

const { userName, canApprove, canSubmit, currentUser } = useUser()

const purchases = ref([])
const projects = ref([])
const budgetItems = ref([])
const dialogVisible = ref(false)
const approveDialogVisible = ref(false)
const currentPurchase = ref(null)

const form = ref({
  project_id: null,
  budget_item_id: null,
  contract_id: null,
  purchase_no: '',
  applicant: '',
  item_name: '',
  quantity: 1,
  unit_price: 0,
  total_amount: 0,
  has_acceptance: false
})

const approveForm = ref({
  approver: '',
  status: 'approved'
})

watch(currentUser, () => {
  loadData()
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

const calcTotal = () => {
  form.value.total_amount = form.value.quantity * form.value.unit_price
}

const loadData = async () => {
  try {
    const [res, projRes] = await Promise.all([
      getPurchases(),
      getProjects()
    ])
    purchases.value = res.data
    projects.value = projRes.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const loadBudgetItems = async () => {
  if (!form.value.project_id) return
  try {
    const res = await getProjectBudget(form.value.project_id)
    budgetItems.value = res.data
  } catch (error) {
    ElMessage.error('加载预算科目失败')
  }
}

const openDialog = () => {
  form.value = {
    project_id: projects.value[0]?.id,
    budget_item_id: null,
    contract_id: null,
    purchase_no: 'CG' + Date.now().toString().slice(-6),
    applicant: userName.value,
    item_name: '',
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    has_acceptance: false
  }
  budgetItems.value = []
  if (form.value.project_id) {
    loadBudgetItems()
  }
  dialogVisible.value = true
}

const approve = (row) => {
  currentPurchase.value = row
  approveForm.value = { approver: userName.value, status: 'approved' }
  approveDialogVisible.value = true
}

const submitApprove = async () => {
  try {
    await approvePurchase(currentPurchase.value.id, approveForm.value)
    ElMessage.success('审批完成')
    approveDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('审批失败')
  }
}

const submitPurchase = async () => {
  try {
    await createPurchase(form.value)
    ElMessage.success('提交成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '提交失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
