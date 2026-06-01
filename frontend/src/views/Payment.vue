<template>
  <div>
    <div class="page-header">
      <span class="page-title">支付管理</span>
      <div>
        <el-tag :type="canExecutePayment ? 'success' : 'info'" size="large">
          {{ canExecutePayment ? '财务支付权限' : '仅查看权限' }}
        </el-tag>
      </div>
    </div>

    <el-alert 
      v-if="!canExecutePayment"
      type="warning"
      style="margin-bottom: 20px"
      show-icon
    >
      您当前是{{ userRoleText }}角色，仅可查看支付记录，不能执行支付操作。请切换到财务账号执行支付。
    </el-alert>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待支付" name="pending">
        <el-card>
          <el-table :data="pendingPayments" border stripe>
            <el-table-column prop="id" label="申请编号" width="90" />
            <el-table-column prop="project_unit" label="项目单位" />
            <el-table-column prop="applicant" label="申请人" width="100" />
            <el-table-column prop="amount" label="支付金额" width="140">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: 600">¥{{ Number(row.amount).toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="available_balance" label="项目余额" width="140">
              <template #default="{ row }">
                <span style="color: #67c23a">¥{{ Number(row.available_balance).toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" width="160" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="executePayment(row)"
                  :disabled="!canExecutePayment"
                >
                  执行支付
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="支付回执" name="receipts">
        <el-card>
          <el-table :data="receipts" border stripe>
            <el-table-column prop="id" label="回执ID" width="90" />
            <el-table-column prop="application_id" label="申请编号" width="100" />
            <el-table-column prop="batch_no" label="支付批次" width="180" />
            <el-table-column prop="project_unit" label="项目单位" />
            <el-table-column prop="amount" label="支付金额" width="130">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: 600">¥{{ Number(row.amount).toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
                  {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '处理中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failure_reason" label="失败原因" show-overflow-tooltip />
            <el-table-column prop="retry_count" label="重试次数" width="90" />
            <el-table-column prop="paid_at" label="支付时间" width="160" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'failed' && canExecutePayment" 
                  type="warning" 
                  size="small"
                  @click="retryPayment(row.application_id)"
                >
                  重发
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="paymentDialogVisible" title="执行支付" width="400px">
      <el-form :model="paymentForm" label-width="80px">
        <el-form-item label="支付批次">
          <el-input v-model="paymentForm.batch_no" placeholder="例如：PAY20240101001" />
        </el-form-item>
        <el-alert v-if="paymentInfo" type="info" style="margin-bottom: 16px">
          <div>项目单位：{{ paymentInfo.project_unit }}</div>
          <div>支付金额：¥{{ Number(paymentInfo.amount).toLocaleString() }}</div>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPayment" :loading="paying">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { applicationsApi, paymentApi } from '../api'
import { useUserStore } from '../stores/user'

const { userRole, currentUser } = useUserStore()

const activeTab = ref('pending')
const pendingPayments = ref([])
const receipts = ref([])
const paymentDialogVisible = ref(false)
const currentPayment = ref(null)
const paying = ref(false)

const paymentForm = ref({
  batch_no: ''
})

const roleTexts = {
  admin: '管理员',
  finance: '财务',
  leader: '领导',
  business: '业务',
  applicant: '项目单位'
}

const userRoleText = computed(() => roleTexts[userRole.value] || userRole.value)

const canExecutePayment = computed(() => {
  return userRole.value === 'finance' || userRole.value === 'admin'
})

const paymentInfo = computed(() => currentPayment.value)

const loadPendingPayments = async () => {
  try {
    const apps = await applicationsApi.list()
    pendingPayments.value = apps.filter(a => a.status === 'approved')
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const loadReceipts = async () => {
  try {
    receipts.value = await paymentApi.receipts()
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const executePayment = (row) => {
  if (!canExecutePayment.value) {
    ElMessage.warning('您没有支付权限，请切换到财务账号')
    return
  }
  currentPayment.value = row
  paymentForm.value.batch_no = `PAY${Date.now()}`
  paymentDialogVisible.value = true
}

const confirmPayment = async () => {
  if (!paymentForm.value.batch_no) {
    ElMessage.warning('请输入支付批次号')
    return
  }
  
  paying.value = true
  try {
    const result = await paymentApi.execute(currentPayment.value.id, { 
      batch_no: paymentForm.value.batch_no,
      operator: currentUser.value.name
    })
    
    if (result.status === 'success') {
      ElMessage.success(result.message)
    } else {
      ElMessage.warning(`${result.message}：${result.failure_reason}`)
    }
    
    paymentDialogVisible.value = false
    loadPendingPayments()
    loadReceipts()
  } catch (error) {
    ElMessage.error(error.error || '支付失败')
  } finally {
    paying.value = false
  }
}

const retryPayment = async (applicationId) => {
  try {
    await ElMessageBox.confirm('确定要重发支付吗？', '确认', { type: 'warning' })
    await paymentApi.retry(applicationId)
    ElMessage.success('重发成功')
    loadReceipts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重发失败')
    }
  }
}

onMounted(() => {
  loadPendingPayments()
  loadReceipts()
})
</script>
