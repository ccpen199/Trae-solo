<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { request } from '@/utils/api'
import websocketService from '@/utils/websocket'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const orders = ref<any[]>([])
const selectedOrder = ref<any>(null)
const settlementVisible = ref(false)
const paymentMethods = ref([
  { value: 'cash', label: '现金', icon: 'Wallet' },
  { value: 'wechat', label: '微信支付', icon: 'ChatDotRound' },
  { value: 'alipay', label: '支付宝', icon: 'Share' },
  { value: 'card', label: '银行卡', icon: 'CreditCard' },
  { value: 'member', label: '会员余额', icon: 'User' },
])

const selectedPaymentMethod = ref('wechat')
const paymentAmount = ref(0)
const memberId = ref('')
const memberInfo = ref<any>(null)

const pendingOrders = computed(() => {
  return orders.value.filter(
    (o) =>
      ['ready', 'served', 'confirmed', 'preparing'].includes(o.status) &&
      o.paidAmount < o.payableAmount
  )
})

const completedOrders = computed(() => {
  return orders.value.filter(
    (o) => o.status === 'completed' || o.paidAmount >= o.payableAmount
  )
})

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  preparing: '制作中',
  ready: '已出餐',
  served: '已上齐',
  completed: '已完成',
  cancelled: '已取消',
}

const statusColors: Record<string, string> = {
  pending: 'info',
  confirmed: 'warning',
  preparing: 'primary',
  ready: 'success',
  served: 'success',
  completed: 'success',
  cancelled: 'danger',
}

const paymentMethodLabels: Record<string, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '银行卡',
  member: '会员余额',
  combined: '组合支付',
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const result = await request.get('/orders/search', {
      params: { limit: 100 },
    })
    orders.value = result.data
  } catch (error) {
    ElMessage.error('加载订单数据失败')
  } finally {
    loading.value = false
  }
}

const openSettlement = async (order: any) => {
  selectedOrder.value = order
  paymentAmount.value = order.payableAmount - order.paidAmount
  settlementVisible.value = true
}

const searchMember = async () => {
  if (!memberId.value.trim()) return
  try {
    memberInfo.value = await request.get(`/members/${memberId.value}`)
    ElMessage.success(`找到会员: ${memberInfo.value.name}`)
  } catch (error) {
    ElMessage.error('未找到该会员')
    memberInfo.value = null
  }
}

const processPayment = async () => {
  if (!selectedOrder.value) return
  if (paymentAmount.value <= 0) {
    ElMessage.warning('支付金额必须大于0')
    return
  }

  if (selectedPaymentMethod.value === 'member' && !memberInfo.value) {
    ElMessage.warning('请先查询会员信息')
    return
  }

  if (
    selectedPaymentMethod.value === 'member' &&
    memberInfo.value.balance < paymentAmount.value
  ) {
    ElMessage.warning('会员余额不足')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要收取 ¥${paymentAmount.value.toFixed(2)} (${paymentMethodLabels[selectedPaymentMethod.value]}) 吗？`,
      '确认收款',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success',
      }
    )

    const paymentData = {
      orderId: selectedOrder.value.id,
      amount: paymentAmount.value,
      method: selectedPaymentMethod.value,
      memberId: selectedPaymentMethod.value === 'member' ? memberInfo.value?.id : undefined,
    }

    await request.post('/payments', paymentData)

    ElNotification({
      title: '收款成功',
      message: `订单 ${selectedOrder.value.orderNumber} 收款 ¥${paymentAmount.value.toFixed(2)}`,
      type: 'success',
    })

    settlementVisible.value = false
    selectedOrder.value = null
    memberInfo.value = null
    memberId.value = ''
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '收款失败')
    }
  }
}

const viewOrderDetail = async (order: any) => {
  try {
    selectedOrder.value = await request.get(`/orders/${order.id}`)
  } catch (error) {
    ElMessage.error('加载订单详情失败')
  }
}

const getPendingAmount = (order: any) => {
  return order.payableAmount - order.paidAmount
}

const onPaymentComplete = (data: any) => {
  ElMessage.info(`订单 ${data.orderNumber} 支付完成`)
  fetchOrders()
}

const onNewOrder = (data: any) => {
  ElNotification({
    title: '新订单',
    message: `订单 ${data.orderNumber} 已创建`,
    type: 'info',
    duration: 0,
  })
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
  
  if (authStore.user) {
    websocketService.connect(authStore.user.role, authStore.user.id)
    websocketService.on('paymentComplete', onPaymentComplete)
    websocketService.on('newOrder', onNewOrder)
  }
})

onUnmounted(() => {
  websocketService.off('paymentComplete', onPaymentComplete)
  websocketService.off('newOrder', onNewOrder)
})
</script>

<template>
  <div class="pos-page">
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <span class="card-title">收银台</span>
          <el-button type="primary" size="small" @click="fetchOrders">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="orders-card" v-loading="loading">
          <template #header>
            <span class="card-title">待结账单 ({{ pendingOrders.length }})</span>
          </template>

          <el-empty v-if="pendingOrders.length === 0" description="暂无待结账订单" />

          <el-table :data="pendingOrders" stripe max-height="500">
            <el-table-column prop="orderNumber" label="订单号" width="140">
              <template #default="{ row }">
                <span class="order-number">{{ row.orderNumber }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="tableNumber" label="桌号" width="80">
              <template #default="{ row }">
                <span v-if="row.table">{{ row.table.tableNumber }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusColors[row.status]" size="small">
                  {{ statusLabels[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="总金额" width="100">
              <template #default="{ row }">
                ¥{{ row.totalAmount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="paidAmount" label="已付" width="100">
              <template #default="{ row }">
                <span class="paid-amount">¥{{ row.paidAmount.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="pendingAmount" label="待付" width="120">
              <template #default="{ row }">
                <span class="pending-amount">¥{{ getPendingAmount(row).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="200">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewOrderDetail(row)">
                  详情
                </el-button>
                <el-button type="success" size="small" @click="openSettlement(row)">
                  收款
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="orders-card mt-20">
          <template #header>
            <span class="card-title">已结账单 ({{ completedOrders.length }})</span>
          </template>

          <el-table :data="completedOrders" stripe max-height="300">
            <el-table-column prop="orderNumber" label="订单号" width="140">
              <template #default="{ row }">
                <span class="order-number">{{ row.orderNumber }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="tableNumber" label="桌号" width="80">
              <template #default="{ row }">
                <span v-if="row.table">{{ row.table.tableNumber }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="金额" width="100">
              <template #default="{ row }">
                ¥{{ row.totalAmount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="180">
              <template #default="{ row }">
                {{ new Date(row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="quick-actions-card">
          <template #header>
            <span class="card-title">快捷操作</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-button type="primary" size="large" @click="fetchOrders" style="width: 100%">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button type="success" size="large" @click="viewOrderDetail(null)" style="width: 100%">
                <el-icon><Plus /></el-icon>
                新建订单
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="settlementVisible"
      title="结算收银"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedOrder" class="settlement-content">
        <div class="order-summary">
          <div class="summary-row">
            <span class="label">订单号:</span>
            <span class="value order-number">{{ selectedOrder.orderNumber }}</span>
          </div>
          <div class="summary-row">
            <span class="label">桌号:</span>
            <span class="value">{{ selectedOrder.table?.tableNumber || '-' }}</span>
          </div>
          <div class="summary-row">
            <span class="label">商品合计:</span>
            <span class="value">¥{{ selectedOrder.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-row" v-if="selectedOrder.discountAmount > 0">
            <span class="label">优惠金额:</span>
            <span class="value discount">-¥{{ selectedOrder.discountAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-row total">
            <span class="label">应付金额:</span>
            <span class="value">¥{{ selectedOrder.payableAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span class="label">已付金额:</span>
            <span class="value">¥{{ selectedOrder.paidAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-row pending">
            <span class="label">待付金额:</span>
            <span class="value pending-amount">¥{{ getPendingAmount(selectedOrder).toFixed(2) }}</span>
          </div>
        </div>

        <el-divider />

        <div class="payment-section">
          <h4 class="section-title">支付方式</h4>
          <el-radio-group v-model="selectedPaymentMethod" class="payment-methods">
            <el-radio-button v-for="method in paymentMethods" :key="method.value" :label="method.value">
              <el-icon :size="16"><component :is="method.icon" /></el-icon>
              <span>{{ method.label }}</span>
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="member-section" v-if="selectedPaymentMethod === 'member'">
          <h4 class="section-title">会员信息</h4>
          <el-input
            v-model="memberId"
            placeholder="请输入会员手机号/会员号"
            style="margin-bottom: 12px"
            @keyup.enter="searchMember"
          >
            <template #append>
              <el-button @click="searchMember">查询</el-button>
            </template>
          </el-input>
          <div v-if="memberInfo" class="member-info">
            <el-tag type="success">会员: {{ memberInfo.name }}</el-tag>
            <span class="member-balance">余额: ¥{{ memberInfo.balance.toFixed(2) }}</span>
          </div>
        </div>

        <div class="amount-section">
          <h4 class="section-title">收款金额</h4>
          <el-input-number
            v-model="paymentAmount"
            :min="0.01"
            :max="getPendingAmount(selectedOrder)"
            :precision="2"
            :step="10"
            size="large"
            style="width: 100%"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="settlementVisible = false">取消</el-button>
        <el-button type="primary" size="large" @click="processPayment">
          确认收款 ¥{{ paymentAmount.toFixed(2) }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="selectedOrder !== null && !settlementVisible"
      title="订单详情"
      width="600px"
    >
      <div v-if="selectedOrder" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">
            {{ selectedOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusColors[selectedOrder.status]" size="small">
              {{ statusLabels[selectedOrder.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="桌号">
            {{ selectedOrder.table?.tableNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ new Date(selectedOrder.createdAt).toLocaleString() }}
          </el-descriptions-item>
        </el-descriptions>

        <el-table :data="selectedOrder.items || []" size="small" style="margin-top: 20px">
          <el-table-column prop="name" label="菜品" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="price" label="单价" width="100">
            <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="100">
            <template #default="{ row }">¥{{ row.subtotal.toFixed(2) }}</template>
          </el-table-column>
        </el-table>

        <div class="amount-summary" style="margin-top: 20px">
          <div class="amount-row">
            <span>商品合计:</span>
            <span>¥{{ selectedOrder.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="amount-row">
            <span>优惠:</span>
            <span>-¥{{ selectedOrder.discountAmount.toFixed(2) }}</span>
          </div>
          <div class="amount-row total">
            <span>应付:</span>
            <span class="total-amount">¥{{ selectedOrder.payableAmount.toFixed(2) }}</span>
          </div>
          <div class="amount-row">
            <span>已付:</span>
            <span class="paid-amount">¥{{ selectedOrder.paidAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.pos-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card,
.orders-card,
.quick-actions-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.mt-20 {
  margin-top: 20px;
}

.order-number {
  font-weight: 600;
  color: #409eff;
}

.paid-amount {
  color: #67c23a;
}

.pending-amount {
  font-weight: 600;
  color: #f56c6c;
}

.settlement-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-summary {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  &.total {
    padding-top: 8px;
    border-top: 1px solid #dcdfe6;

    .value {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  &.pending {
    .pending-amount {
      font-size: 18px;
      font-weight: 600;
      color: #f56c6c;
    }
  }
}

.summary-row .label {
  font-size: 14px;
  color: #606266;
}

.summary-row .value {
  font-size: 14px;
  color: #303133;
}

.summary-row .discount {
  color: #67c23a;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.payment-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.payment-methods :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
}

.member-section,
.amount-section {
  margin-top: 16px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-balance {
  font-size: 14px;
  color: #409eff;
}

.amount-summary {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;

  &:last-child {
    margin-bottom: 0;
  }

  &.total {
    padding-top: 8px;
    border-top: 1px solid #dcdfe6;

    .total-amount {
      font-size: 16px;
      font-weight: 600;
      color: #f56c6c;
    }
  }
}
</style>
