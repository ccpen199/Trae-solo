<template>
  <div class="order-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单详情 - {{ order?.order_no }}</span>
          <el-button-group>
            <el-button @click="goBack">返回</el-button>
            <el-button 
              v-if="canSubmit" 
              type="primary" 
              :loading="actionLoading"
              @click="handleSubmit"
            >
              提交
            </el-button>
          </el-button-group>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order?.order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[order?.status]?.type || 'info'">
            {{ statusMap[order?.status]?.label || order?.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="金额">
          ¥{{ Number(order?.total_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
        </el-descriptions-item>
        <el-descriptions-item label="期望完成日期">
          {{ order?.expected_completion_date || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="供应商">
          {{ order?.supplier_org?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="核心企业">
          {{ order?.core_org?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ order?.creator?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前责任人">
          {{ order?.assignee?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="锁定状态" :span="2">
          <el-tag v-if="order?.is_locked" type="danger">已锁定 - {{ order?.lock_reason }}</el-tag>
          <span v-else>未锁定</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
    
    <el-card style="margin-top: 20px" v-if="order?.details?.length > 0">
      <template #header>订单明细</template>
      <el-table :data="order.details" border>
        <el-table-column prop="item_name" label="商品名称" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="unit_price" label="单价">
          <template #default="{ row }">
            ¥{{ Number(row.unit_price).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">
            ¥{{ Number(row.amount).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card style="margin-top: 20px" v-if="allowedActions.length > 0">
      <template #header>可用操作</template>
      <div class="action-buttons">
        <template v-for="action in allowedActions" :key="action.action">
          <el-button 
            v-if="action.action === 'approve'"
            type="success"
            :loading="actionLoading"
            @click="handleApprove"
          >
            通过
          </el-button>
          <el-button 
            v-else-if="action.action === 'reject'"
            type="danger"
            :loading="actionLoading"
            @click="handleReject"
          >
            拒绝
          </el-button>
          <el-button 
            v-else-if="action.action === 'return'"
            type="warning"
            :loading="actionLoading"
            @click="handleReturn"
          >
            退回
          </el-button>
          <el-button 
            v-else-if="action.action === 'supplement'"
            type="warning"
            :loading="actionLoading"
            @click="handleSupplement"
          >
            补充资料
          </el-button>
          <el-button 
            v-else-if="action.action === 'reassign'"
            type="info"
            :loading="actionLoading"
            @click="handleReassign"
          >
            转派
          </el-button>
          <el-button 
            v-else-if="action.action === 'loan'"
            type="primary"
            :loading="actionLoading"
            @click="handleLoan"
          >
            放款
          </el-button>
          <el-button 
            v-else-if="action.action === 'repay'"
            type="success"
            :loading="actionLoading"
            @click="handleRepay"
          >
            回款核销
          </el-button>
          <el-button 
            v-else-if="action.action === 'lock'"
            type="danger"
            :loading="actionLoading"
            @click="handleLock"
          >
            锁定
          </el-button>
          <el-button 
            v-else-if="action.action === 'unlock'"
            type="warning"
            :loading="actionLoading"
            @click="handleUnlock"
          >
            解锁
          </el-button>
          <el-button 
            v-else-if="action.action === 'retry'"
            type="primary"
            :loading="actionLoading"
            @click="handleRetry"
          >
            重试
          </el-button>
          <el-button 
            v-else-if="action.action === 'close'"
            type="danger"
            :loading="actionLoading"
            @click="handleClose"
          >
            关闭
          </el-button>
          <el-button 
            v-else-if="action.action === 'cancel'"
            type="warning"
            :loading="actionLoading"
            @click="handleCancel"
          >
            撤销
          </el-button>
        </template>
      </div>
    </el-card>
    
    <el-card style="margin-top: 20px" v-if="order?.audit_logs?.length > 0">
      <template #header>操作时间轴</template>
      <el-timeline>
        <el-timeline-item
          v-for="(log, index) in order.audit_logs"
          :key="log.id"
          :timestamp="log.created_at"
          placement="top"
        >
          <el-card shadow="hover">
            <h4>{{ log.message }}</h4>
            <p style="color: #606266; font-size: 13px">
              操作人: {{ log.user?.name || '-' }} | 
              操作: {{ actionMap[log.action] || log.action }} | 
              状态: {{ log.from_status || '创建' }} → {{ log.to_status }}
            </p>
            <p v-if="log.detail" style="color: #909399; font-size: 12px; margin-top: 8px">
              详情: {{ log.detail }}
            </p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
    
    <el-dialog v-model="commentDialogVisible" title="请输入原因" width="500px">
      <el-input
        v-model="actionForm.comment"
        type="textarea"
        :rows="4"
        placeholder="请输入原因"
      />
      <template #footer>
        <el-button @click="commentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAction">确认</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="loanDialogVisible" title="放款信息" width="500px">
      <el-form label-width="100px">
        <el-form-item label="放款金额">
          <el-input-number v-model="actionForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="actionForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="loanDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmLoan">确认放款</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="repayDialogVisible" title="回款核销信息" width="500px">
      <el-form label-width="100px">
        <el-form-item label="本金金额">
          <el-input-number v-model="actionForm.principal_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="利息">
          <el-input-number v-model="actionForm.interest_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="罚息">
          <el-input-number v-model="actionForm.penalty_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="actionForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repayDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmRepay">确认核销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { statusMap, actionMap } from '@/api'
import * as api from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const order = ref(null)
const allowedActions = ref([])
const actionLoading = ref(false)

const commentDialogVisible = ref(false)
const loanDialogVisible = ref(false)
const repayDialogVisible = ref(false)

const pendingAction = ref('')

const actionForm = reactive({
  comment: '',
  rejection_reason: '',
  supplement_request: '',
  reason: '',
  amount: 0,
  principal_amount: 0,
  interest_amount: 0,
  penalty_amount: 0
})

const canSubmit = computed(() => {
  return (
    order.value?.status === 'pending_asset_registration' &&
    userStore.role === 'supplier'
  )
})

const goBack = () => {
  router.back()
}

const fetchOrderDetail = async () => {
  try {
    order.value = await api.getOrder(route.params.id)
    actionForm.amount = order.value.total_amount
    actionForm.principal_amount = order.value.total_amount
    
    const actions = await api.getOrderAllowedActions(route.params.id)
    allowedActions.value = actions
  } catch (error) {
    console.error('获取订单详情失败:', error)
  }
}

const handleSubmit = async () => {
  actionLoading.value = true
  try {
    await api.submitOrder(order.value.id, actionForm.comment)
    ElMessage.success('提交成功')
    fetchOrderDetail()
  } finally {
    actionLoading.value = false
  }
}

const handleApprove = async () => {
  pendingAction.value = 'approve'
  actionForm.comment = ''
  commentDialogVisible.value = true
}

const handleReject = async () => {
  pendingAction.value = 'reject'
  actionForm.comment = ''
  commentDialogVisible.value = true
}

const handleReturn = async () => {
  pendingAction.value = 'return'
  actionForm.comment = ''
  commentDialogVisible.value = true
}

const handleSupplement = async () => {
  pendingAction.value = 'supplement'
  actionForm.comment = ''
  commentDialogVisible.value = true
}

const handleReassign = async () => {
  ElMessage.warning('转派功能需要选择用户，简化流程直接执行转派演示')
}

const handleLoan = async () => {
  loanDialogVisible.value = true
}

const handleRepay = async () => {
  repayDialogVisible.value = true
}

const handleLock = async () => {
  pendingAction.value = 'lock'
  actionForm.reason = ''
  commentDialogVisible.value = true
}

const handleUnlock = async () => {
  pendingAction.value = 'unlock'
  await executeAction({ action: 'unlock' })
}

const handleRetry = async () => {
  pendingAction.value = 'retry'
  actionForm.comment = ''
  commentDialogVisible.value = true
}

const handleClose = async () => {
  pendingAction.value = 'close'
  actionForm.comment = ''
  commentDialogVisible.value = true
}

const handleCancel = async () => {
  pendingAction.value = 'cancel'
  actionForm.comment = ''
  commentDialogVisible.value = true
}

const executeAction = async (data) => {
  actionLoading.value = true
  try {
    await api.executeOrderAction(order.value.id, data)
    ElMessage.success('操作成功')
    fetchOrderDetail()
  } finally {
    actionLoading.value = false
  }
}

const confirmAction = async () => {
  commentDialogVisible.value = false
  
  let data = { action: pendingAction.value }
  
  if (pendingAction.value === 'approve') {
    data.comment = actionForm.comment
  } else if (pendingAction.value === 'reject') {
    data.rejection_reason = actionForm.comment
  } else if (pendingAction.value === 'return') {
    data.rejection_reason = actionForm.comment
  } else if (pendingAction.value === 'supplement') {
    data.supplement_request = actionForm.comment
  } else if (pendingAction.value === 'lock') {
    data.reason = actionForm.comment
  } else if (pendingAction.value === 'retry') {
    data.comment = actionForm.comment
  } else if (pendingAction.value === 'close') {
    data.comment = actionForm.comment
  } else if (pendingAction.value === 'cancel') {
    data.comment = actionForm.comment
  }
  
  await executeAction(data)
}

const confirmLoan = async () => {
  loanDialogVisible.value = false
  await executeAction({
    action: 'loan',
    amount: actionForm.amount,
    comment: actionForm.comment
  })
}

const confirmRepay = async () => {
  repayDialogVisible.value = false
  await executeAction({
    action: 'repay',
    principal_amount: actionForm.principal_amount,
    interest_amount: actionForm.interest_amount,
    penalty_amount: actionForm.penalty_amount,
    comment: actionForm.comment
  })
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
