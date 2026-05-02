<template>
  <div class="order-detail-container">
    <el-button @click="goBack" style="margin-bottom: 20px;">
      <el-icon><ArrowLeft /></el-icon>
      返回订单列表
    </el-button>

    <el-card v-if="orderData">
      <template #header>
        <div class="card-header">
          <span>订单详情</span>
          <el-tag :type="getStatusType(orderData.status)" size="large">
            {{ getStatusLabel(orderData.status) }}
          </el-tag>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="订单号">{{ orderData.order_no }}</el-descriptions-item>
        <el-descriptions-item label="商户订单号">{{ orderData.merchant_order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span class="highlight">¥{{ orderData.amount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ orderData.subject }}</el-descriptions-item>
        <el-descriptions-item label="支付渠道">
          <el-tag size="small">{{ getChannelLabel(orderData.channel) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手续费">¥{{ orderData.fee_amount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="预支付ID">{{ orderData.prepay_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="交易ID">{{ orderData.transaction_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">
          <span v-if="orderData.paid_at">{{ formatDate(orderData.paid_at) }}</span>
          <span v-else class="text-muted">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="3">{{ formatDate(orderData.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 20px;" v-if="orderData">
      <template #header>
        <div class="card-header">
          <span>订单状态</span>
        </div>
      </template>
      <el-steps :active="getStepActive(orderData.status)" align-center>
        <el-step title="创建订单" :description="formatDate(orderData.created_at)" />
        <el-step 
          v-if="orderData.status === 'paying' || orderData.status === 'paid' || orderData.status === 'refunding' || orderData.status === 'refunded'"
          title="支付中" 
        />
        <el-step 
          v-if="orderData.status === 'paid' || orderData.status === 'refunding' || orderData.status === 'refunded'"
          title="支付完成" 
          :description="formatDate(orderData.paid_at)"
        />
        <el-step 
          v-if="orderData.status === 'refunding' || orderData.status === 'refunded'"
          title="退款中" 
        />
        <el-step 
          v-if="orderData.status === 'refunded'"
          title="退款完成" 
        />
      </el-steps>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>快捷操作</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-button
            v-if="orderData.status === 'paid'"
            type="danger"
            plain
            @click="showRefundDialog"
            style="width: 100%;"
          >
            <el-icon><Refund /></el-icon>
            申请退款
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog
      v-model="refundDialogVisible"
      title="申请退款"
      width="500px"
    >
      <el-form
        ref="refundFormRef"
        :model="refundForm"
        :rules="refundRules"
        label-width="100px"
      >
        <el-form-item label="订单号">
          <el-input :value="orderData?.order_no" disabled />
        </el-form-item>
        <el-form-item label="订单金额">
          <el-input :value="`¥${orderData?.amount}`" disabled />
        </el-form-item>
        <el-form-item label="退款金额" prop="refund_amount">
          <el-input-number
            v-model="refundForm.refund_amount"
            :precision="2"
            :min="0.01"
            :max="orderData?.amount || 0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="退款原因" prop="refund_reason">
          <el-input
            v-model="refundForm.refund_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入退款原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="refundLoading" @click="submitRefund">
          提交申请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Refund } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const orderData = ref(null)
const refundDialogVisible = ref(false)
const refundLoading = ref(false)
const refundFormRef = ref(null)

const refundForm = reactive({
  refund_amount: 0,
  refund_reason: ''
})

const refundRules = {
  refund_amount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' }
  ],
  refund_reason: [
    { required: true, message: '请输入退款原因', trigger: 'blur' }
  ]
}

const channelMap = {
  'alipay': '支付宝',
  'wechat': '微信支付',
  'unionpay': '银联支付'
}

const statusMap = {
  'pending': { label: '待支付', type: 'info', step: 0 },
  'paying': { label: '支付中', type: 'warning', step: 1 },
  'paid': { label: '已支付', type: 'success', step: 2 },
  'failed': { label: '支付失败', type: 'danger', step: 1 },
  'refunding': { label: '退款中', type: 'warning', step: 3 },
  'refunded': { label: '已退款', type: 'info', step: 4 },
  'closed': { label: '已关闭', type: 'info', step: 0 }
}

function getChannelLabel(channel) {
  return channelMap[channel] || channel
}

function getStatusLabel(status) {
  return statusMap[status]?.label || status
}

function getStatusType(status) {
  return statusMap[status]?.type || 'info'
}

function getStepActive(status) {
  return statusMap[status]?.step || 0
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadOrderDetail() {
  const orderNo = route.params.orderNo
  if (!orderNo) return

  loading.value = true
  try {
    const response = await api.get(`/v1/payment/order/${orderNo}`)
    if (response.success) {
      orderData.value = response.data
      refundForm.refund_amount = response.data.amount
    }
  } catch (error) {
    console.error('Load order detail error:', error)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'MerchantOrders' })
}

function showRefundDialog() {
  refundForm.refund_reason = ''
  refundDialogVisible.value = true
}

async function submitRefund() {
  if (!refundFormRef.value || !orderData.value) return

  await refundFormRef.value.validate(async (valid) => {
    if (valid) {
      refundLoading.value = true
      try {
        await ElMessageBox.confirm(
          `确认申请退款 ¥${refundForm.refund_amount} 元？',
          '退款确认',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const response = await api.post('/v1/payment/refund', {
          order_no: orderData.value.order_no,
          refund_amount: refundForm.refund_amount,
          refund_reason: refundForm.refund_reason
        })

        if (response.success) {
          ElMessage.success('退款申请已提交')
          refundDialogVisible.value = false
          loadOrderDetail()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Refund error:', error)
        }
      } finally {
        refundLoading.value = false
      }
    }
  })
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.order-detail-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.highlight {
  color: #e6a23c;
  font-weight: bold;
  font-size: 16px;
}

.text-muted {
  color: #909399;
}
</style>
