<template>
  <div class="orders-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
          <el-button type="primary" @click="loadOrders">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="待支付" value="pending" />
            <el-option label="支付中" value="paying" />
            <el-option label="已支付" value="paid" />
            <el-option label="支付失败" value="failed" />
            <el-option label="退款中" value="refunding" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付渠道">
          <el-select v-model="searchForm.channel" placeholder="全部渠道" clearable style="width: 150px">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="银联支付" value="unionpay" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchOrders">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" min-width="200">
          <template #default="{ row }">
            <el-button type="text" @click="viewDetail(row)">
              {{ row.order_no }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="merchant_order_no" label="商户订单号" min-width="180">
          <template #default="{ row }">
            {{ row.merchant_order_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="商品名称" min-width="150" />
        <el-table-column prop="amount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="fee_amount" label="手续费" width="100">
          <template #default="{ row }">
            ¥{{ row.fee_amount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="支付渠道" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getChannelLabel(row.channel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'paid'"
              type="danger"
              text
              size="small"
              @click="showRefundDialog(row)"
            >
              退款
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadOrders"
        @current-change="loadOrders"
        style="margin-top: 20px; justify-content: flex-end"
      />
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
          <el-input v-model="refundForm.order_no" disabled />
        </el-form-item>
        <el-form-item label="订单金额">
          <el-input v-model="refundForm.order_amount" disabled>
            <template #prefix>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="退款金额" prop="refund_amount">
          <el-input-number
            v-model="refundForm.refund_amount"
            :precision="2"
            :min="0.01"
            :max="refundForm.order_amount"
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const orders = ref([])
const refundDialogVisible = ref(false)
const refundLoading = ref(false)
const refundFormRef = ref(null)

const searchForm = reactive({
  status: '',
  channel: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const refundForm = reactive({
  order_no: '',
  order_amount: 0,
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
  'pending': { label: '待支付', type: 'info' },
  'paying': { label: '支付中', type: 'warning' },
  'paid': { label: '已支付', type: 'success' },
  'failed': { label: '支付失败', type: 'danger' },
  'refunding': { label: '退款中', type: 'warning' },
  'refunded': { label: '已退款', type: 'info' },
  'closed': { label: '已关闭', type: 'info' }
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

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function loadOrders() {
  loading.value = true
  try {
    const params = {
      skip: (pagination.page - 1) * pagination.limit,
      limit: pagination.limit
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }
    if (searchForm.channel) {
      params.channel = searchForm.channel
    }
    
    const response = await api.get('/v1/merchant/orders', { params })
    if (response.success) {
      orders.value = response.data.orders || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('Load orders error:', error)
  } finally {
    loading.value = false
  }
}

function searchOrders() {
  pagination.page = 1
  loadOrders()
}

function resetSearch() {
  searchForm.status = ''
  searchForm.channel = ''
  pagination.page = 1
  loadOrders()
}

function viewDetail(row) {
  router.push({
    name: 'MerchantOrderDetail',
    params: { orderNo: row.order_no }
  })
}

function showRefundDialog(row) {
  refundForm.order_no = row.order_no
  refundForm.order_amount = row.amount
  refundForm.refund_amount = row.amount
  refundForm.refund_reason = ''
  refundDialogVisible.value = true
}

async function submitRefund() {
  if (!refundFormRef.value) return
  
  await refundFormRef.value.validate(async (valid) => {
    if (valid) {
      refundLoading.value = true
      try {
        await ElMessageBox.confirm(
          `确认申请退款 ¥${refundForm.refund_amount} 元？`,
          '退款确认',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await api.post('/v1/payment/refund', {
          order_no: refundForm.order_no,
          refund_amount: refundForm.refund_amount,
          refund_reason: refundForm.refund_reason
        })
        
        if (response.success) {
          ElMessage.success('退款申请已提交')
          refundDialogVisible.value = false
          loadOrders()
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
  loadOrders()
})
</script>

<style scoped>
.orders-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
