<template>
  <div class="order-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单详情</span>
          <div>
            <el-button v-if="canPrepay" type="primary" @click="handlePrepay">
              支付预付款
            </el-button>
            <el-button v-if="canCancel" type="danger" @click="handleCancel">
              取消订单
            </el-button>
            <el-button @click="goBack">
              返回列表
            </el-button>
          </div>
        </div>
      </template>

      <el-steps :active="stepStatus" align-center style="margin-bottom: 40px">
        <el-step
          v-for="step in orderSteps"
          :key="step.value"
          :title="step.title"
          :status="step.status"
        />
      </el-steps>

      <el-descriptions title="基本信息" :column="2" border style="margin-bottom: 20px">
        <el-descriptions-item label="订单号">{{ order?.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(order?.status)">
            {{ getStatusText(order?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ order?.productName }}</el-descriptions-item>
        <el-descriptions-item label="产品类别">{{ order?.productCategory }}</el-descriptions-item>
        <el-descriptions-item label="采购商">{{ order?.buyer?.realName }}</el-descriptions-item>
        <el-descriptions-item label="容差率">{{ (order?.toleranceRate || 0) * 100 }}%</el-descriptions-item>
        <el-descriptions-item label="是否冷链">
          <el-tag :type="order?.hasColdChain ? 'primary' : 'info'">
            {{ order?.hasColdChain ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="质量标准">{{ order?.qualityStandard || '无' }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="预计信息" :column="3" border style="margin-bottom: 20px">
        <el-descriptions-item label="预计重量">{{ formatNumber(order?.expectedWeight) }} kg</el-descriptions-item>
        <el-descriptions-item label="预计单价">¥{{ formatNumber(order?.expectedPrice) }} / kg</el-descriptions-item>
        <el-descriptions-item label="预计金额">¥{{ formatNumber(order?.expectedAmount) }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions v-if="hasActualData" title="实际信息" :column="3" border style="margin-bottom: 20px">
        <el-descriptions-item label="实际重量">{{ formatNumber(order?.actualWeight) }} kg</el-descriptions-item>
        <el-descriptions-item label="实际单价">¥{{ formatNumber(order?.actualPrice) }} / kg</el-descriptions-item>
        <el-descriptions-item label="实际金额">¥{{ formatNumber(order?.actualAmount) }}</el-descriptions-item>
        <el-descriptions-item label="预付金额">¥{{ formatNumber(order?.prepaidAmount) }}</el-descriptions-item>
        <el-descriptions-item v-if="order?.settlementAmount" label="结算金额">
          ¥{{ formatNumber(order?.settlementAmount) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="产地信息" :column="3" border style="margin-bottom: 20px">
        <el-descriptions-item label="省份">{{ order?.originProvince }}</el-descriptions-item>
        <el-descriptions-item label="城市">{{ order?.originCity }}</el-descriptions-item>
        <el-descriptions-item label="区县">{{ order?.originDistrict }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="目的地信息" :column="3" border style="margin-bottom: 20px">
        <el-descriptions-item label="省份">{{ order?.destinationProvince }}</el-descriptions-item>
        <el-descriptions-item label="城市">{{ order?.destinationCity }}</el-descriptions-item>
        <el-descriptions-item label="区县">{{ order?.destinationDistrict }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="时间信息" :column="3" border style="margin-bottom: 20px">
        <el-descriptions-item label="创建时间">{{ formatTime(order?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(order?.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="order?.expectedPickupDate" label="预计提货">
          {{ formatTime(order?.expectedPickupDate) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">子订单信息</el-divider>

      <el-table :data="subOrders" stripe style="width: 100%; margin-bottom: 20px">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="subOrderNo" label="子订单号" width="200" />
        <el-table-column label="农户" width="120">
          <template #default="{ row }">
            {{ row.farmer?.realName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品" />
        <el-table-column label="预计重量(kg)" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.expectedWeight) }}
          </template>
        </el-table-column>
        <el-table-column label="实际重量(kg)" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.actualWeight) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="预计金额(元)" width="120">
          <template #default="{ row }">
            ¥{{ formatNumber(row.expectedAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="实际金额(元)" width="120">
          <template #default="{ row }">
            {{ row.actualAmount ? `¥${formatNumber(row.actualAmount)}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="质检等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.qualityGrade" :type="getGradeType(row.qualityGrade)">
              {{ getGradeText(row.qualityGrade) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">操作日志</el-divider>

      <el-timeline v-if="auditLogs.length > 0">
        <el-timeline-item
          v-for="log in auditLogs"
          :key="log.id"
          :timestamp="formatTime(log.createdAt)"
          placement="top"
          :type="getLogType(log.action)"
        >
          <el-card>
            <h4>{{ log.changeSummary }}</h4>
            <p style="margin: 8px 0; color: #909399; font-size: 13px">
              操作人：{{ log.operatorName }} ({{ getRoleText(log.operatorRole) }})
            </p>
            <p style="color: #606266; font-size: 12px">
              操作类型：{{ getLogActionText(log.action) }}
            </p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无操作日志" />
    </el-card>

    <el-dialog v-model="prepayDialogVisible" title="支付预付款" width="500px">
      <el-form :model="prepayForm" label-width="120px">
        <el-form-item label="订单金额">
          <span style="font-size: 18px; font-weight: 600; color: #409eff">
            ¥{{ formatNumber(order?.expectedAmount) }}
          </span>
        </el-form-item>
        <el-form-item label="预付金额">
          <el-input-number
            v-model="prepayForm.amount"
            :min="0"
            :max="order?.expectedAmount || 0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="prepayForm.paymentMethod" placeholder="请选择支付方式" style="width: 100%">
            <el-option label="虚拟账户" value="VIRTUAL_ACCOUNT">
              <span>虚拟账户</span>
              <span style="float: right; color: #909399; font-size: 12px">
                余额: ¥{{ formatNumber(virtualAccount?.balance) }}
              </span>
            </el-option>
            <el-option label="微信支付" value="WECHAT" />
            <el-option label="支付宝" value="ALIPAY" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="prepayDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="prepayLoading" @click="submitPrepay">
          确认支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '@/api/order'
import mockData from '@/utils/mock-data'
import { useUserStore } from '@/stores/user'
import type { Order, SubOrder, OrderStatus, Role, QualityLevel, LogAction, VirtualAccount, AuditLog } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const order = ref<Order | null>(null)
const subOrders = ref<SubOrder[]>([])
const auditLogs = ref<AuditLog[]>([])
const virtualAccount = ref<VirtualAccount | null>(null)
const loading = ref(false)
const prepayDialogVisible = ref(false)
const prepayLoading = ref(false)

const prepayForm = reactive({
  amount: 0,
  paymentMethod: 'VIRTUAL_ACCOUNT',
})

const orderStatusFlow: OrderStatus[] = [
  'DRAFT',
  'PENDING_PREPAYMENT',
  'PREPAYMENT_PAID',
  'IN_COLLECTION',
  'QUALITY_CHECKED',
  'IN_TRANSPORT',
  'DELIVERED',
  'SETTLED',
]

const orderSteps = computed(() => {
  const status = order.value?.status
  const steps = [
    { value: 'DRAFT', title: '创建订单' },
    { value: 'PENDING_PREPAYMENT', title: '待预付' },
    { value: 'PREPAYMENT_PAID', title: '已预付' },
    { value: 'IN_COLLECTION', title: '采集中' },
    { value: 'QUALITY_CHECKED', title: '质检完成' },
    { value: 'IN_TRANSPORT', title: '运输中' },
    { value: 'DELIVERED', title: '已到货' },
    { value: 'SETTLED', title: '已结算' },
  ]

  if (!status) {
    return steps.map(s => ({ ...s, status: '' as const }))
  }

  const currentIndex = orderStatusFlow.indexOf(status)
  return steps.map((s, index) => {
    const flowIndex = orderStatusFlow.indexOf(s.value as OrderStatus)
    let stepStatus: '' | 'wait' | 'process' | 'finish' | 'error' = 'wait'
    
    if (status === 'CANCELLED' || status === 'EXCEPTION_HANDLING') {
      if (flowIndex < currentIndex) stepStatus = 'finish'
      else if (flowIndex === currentIndex) stepStatus = status === 'EXCEPTION_HANDLING' ? 'error' : 'wait'
    } else {
      if (flowIndex < currentIndex) stepStatus = 'finish'
      else if (flowIndex === currentIndex) stepStatus = 'process'
    }
    
    return { ...s, status: stepStatus }
  })
})

const stepStatus = computed(() => {
  if (order.value?.status === 'CANCELLED') return 1
  const index = orderStatusFlow.indexOf(order.value?.status || 'DRAFT')
  return index >= 0 ? index : 0
})

const canPrepay = computed(() => {
  return userStore.isBuyer && order.value?.status === 'PENDING_PREPAYMENT'
})

const canCancel = computed(() => {
  return (
    userStore.isBuyer &&
    ['DRAFT', 'PENDING_PREPAYMENT', 'PREPAYMENT_PAID'].includes(order.value?.status || '')
  )
})

const hasActualData = computed(() => {
  return (
    order.value?.actualWeight !== undefined ||
    order.value?.actualPrice !== undefined ||
    order.value?.actualAmount !== undefined
  )
})

const statusMap: Record<OrderStatus, { text: string; type: string }> = {
  DRAFT: { text: '草稿', type: 'info' },
  PENDING_PREPAYMENT: { text: '待预付', type: 'warning' },
  PREPAYMENT_PAID: { text: '已预付', type: '' },
  IN_COLLECTION: { text: '采集中', type: 'primary' },
  QUALITY_CHECKED: { text: '质检完成', type: '' },
  IN_TRANSPORT: { text: '运输中', type: 'primary' },
  DELIVERED: { text: '已到货', type: 'success' },
  SETTLED: { text: '已结算', type: 'success' },
  CANCELLED: { text: '已取消', type: 'danger' },
  EXCEPTION_HANDLING: { text: '异常处理', type: 'danger' },
  STORAGE_TRANSFERRED: { text: '货权转移', type: 'warning' },
}

const getStatusType = (status?: OrderStatus) => status ? (statusMap[status]?.type || '') : ''
const getStatusText = (status?: OrderStatus) => status ? (statusMap[status]?.text || status) : ''

const gradeMap: Record<QualityLevel, { text: string; type: string }> = {
  PREMIUM: { text: '特级', type: 'success' },
  GRADE_A: { text: '一级', type: 'primary' },
  GRADE_B: { text: '二级', type: '' },
  GRADE_C: { text: '三级', type: 'info' },
  REJECTED: { text: '等外', type: 'danger' },
}

const getGradeType = (grade: QualityLevel) => gradeMap[grade]?.type || ''
const getGradeText = (grade: QualityLevel) => gradeMap[grade]?.text || grade

const roleMap: Record<Role, string> = {
  [Role.BUYER]: '采购商',
  [Role.FARMER]: '农户',
  [Role.OPERATOR]: '平台运营',
  [Role.FINANCE]: '财务人员',
  [Role.STORAGE]: '收储机构',
}

const getRoleText = (role: Role) => roleMap[role] || role

const logActionMap: Record<LogAction, string> = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  PAYMENT: '支付',
  REFUND: '退款',
  TRANSFER: '转账',
  SETTLEMENT: '结算',
  STATUS_CHANGE: '状态变更',
}

const getLogActionText = (action: LogAction) => logActionMap[action] || action

const getLogType = (action: LogAction): '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  switch (action) {
    case 'CREATE':
    case 'UPDATE':
      return 'primary'
    case 'PAYMENT':
    case 'TRANSFER':
    case 'SETTLEMENT':
      return 'success'
    case 'REFUND':
      return 'warning'
    case 'DELETE':
      return 'danger'
    default:
      return ''
  }
}

const formatNumber = (num: any) => {
  if (num?.toNumber) {
    return num.toNumber().toFixed(2)
  }
  return Number(num || 0).toFixed(2)
}

const formatTime = (time: string | Date | undefined) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const loadOrderDetail = async () => {
  const orderId = route.params.id as string
  if (!orderId) return

  loading.value = true
  try {
    order.value = await orderApi.getById(orderId)
    
    if (userStore.isLoggedIn && userStore.user) {
      virtualAccount.value = mockData.getMockVirtualAccount(userStore.user.id) || null
    }
    
    loadRelatedData()
  } catch (error) {
    console.error('Failed to load order detail:', error)
    ElMessage.error('加载订单详情失败')
  } finally {
    loading.value = false
  }
}

const loadRelatedData = () => {
  if (order.value) {
    subOrders.value = mockData.mockSubOrders.filter(
      so => so.mainOrderId === order.value?.id
    )
    
    auditLogs.value = mockData.mockAuditLogs.filter(
      log => log.entityType === 'Order' && log.entityId === order.value?.id
    ).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
}

const handlePrepay = () => {
  prepayForm.amount = order.value?.expectedAmount?.toNumber?.() || order.value?.expectedAmount || 0
  prepayForm.paymentMethod = 'VIRTUAL_ACCOUNT'
  prepayDialogVisible.value = true
}

const submitPrepay = async () => {
  if (prepayForm.amount <= 0) {
    ElMessage.warning('请输入有效的预付金额')
    return
  }

  prepayLoading.value = true
  try {
    await orderApi.prepay(route.params.id as string, prepayForm.amount, prepayForm.paymentMethod)
    ElMessage.success('预付款支付成功')
    prepayDialogVisible.value = false
    loadOrderDetail()
  } catch (error) {
    console.error('Failed to prepay:', error)
    ElMessage.error('支付失败')
  } finally {
    prepayLoading.value = false
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确认要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await orderApi.cancel(route.params.id as string)
    ElMessage.success('订单已取消')
    loadOrderDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to cancel order:', error)
    }
  }
}

const goBack = () => {
  router.push('/orders')
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style lang="scss" scoped>
.order-detail {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
