<template>
  <div class="order-detail-container">
    <el-page-header @back="goBack" content="订单详情">
      <template #extra>
        <el-button type="primary" @click="loadDetail">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>
    </el-page-header>
    
    <el-card v-loading="loading" class="detail-card">
      <template #header>
        <div class="card-header">
          <span>订单信息</span>
          <el-tag :type="getStatusType(orderData.order?.status)" size="large">
            {{ getStatusLabel(orderData.order?.status) }}
          </el-tag>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">
          <el-text type="primary">{{ orderData.order?.order_no }}</el-text>
        </el-descriptions-item>
        <el-descriptions-item label="商户订单号">
          {{ orderData.order?.merchant_order_no || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">
          {{ orderData.order?.subject }}
        </el-descriptions-item>
        <el-descriptions-item label="支付渠道">
          {{ getChannelLabel(orderData.order?.channel) }}
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span class="amount-text">¥{{ orderData.order?.amount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="手续费">
          ¥{{ orderData.order?.fee_amount }}
        </el-descriptions-item>
        <el-descriptions-item label="渠道流水号">
          {{ orderData.order?.transaction_id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="商户">
          {{ orderData.merchant?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(orderData.order?.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">
          {{ formatDate(orderData.order?.paid_at) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
    
    <el-card v-if="orderData.transactions?.length > 0" class="detail-card">
      <template #header>
        <span>支付流水</span>
      </template>
      
      <el-table :data="orderData.transactions" stripe>
        <el-table-column prop="transaction_no" label="流水号" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="渠道" width="100">
          <template #default="{ row }">
            {{ getChannelLabel(row.channel) }}
          </template>
        </el-table-column>
        <el-table-column prop="channel_transaction_id" label="渠道流水号" min-width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'warning'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card v-if="orderData.refunds?.length > 0" class="detail-card">
      <template #header>
        <span>退款记录</span>
      </template>
      
      <el-table :data="orderData.refunds" stripe>
        <el-table-column prop="refund_no" label="退款单号" min-width="200" />
        <el-table-column prop="refund_amount" label="退款金额" width="120">
          <template #default="{ row }">
            ¥{{ row.refund_amount }}
          </template>
        </el-table-column>
        <el-table-column prop="refund_reason" label="退款原因" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'warning'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card class="detail-card">
      <template #header>
        <span>操作日志</span>
      </template>
      
      <el-timeline>
        <el-timeline-item
          v-for="(log, index) in orderData.audit_trail"
          :key="log.audit_no"
          :timestamp="formatDate(log.created_at)"
          placement="top"
          :type="getTimelineType(index)"
        >
          <el-card>
            <h4>{{ log.description }}</h4>
            <p>
              <el-tag size="small">{{ log.action_type }}</el-tag>
              <span class="operator-info">
                操作人：{{ log.operator_name }} ({{ log.operator_role }})
              </span>
            </p>
            <el-divider v-if="log.old_value || log.new_value" />
            <div v-if="log.old_value" class="log-detail">
              <strong>变更前：</strong>
              <pre>{{ log.old_value }}</pre>
            </div>
            <div v-if="log.new_value" class="log-detail">
              <strong>变更后：</strong>
              <pre>{{ log.new_value }}</pre>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <el-empty v-if="orderData.audit_trail?.length === 0" description="暂无操作日志" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const orderNo = ref(route.params.orderNo)

const orderData = reactive({
  order: null,
  merchant: null,
  transactions: [],
  refunds: [],
  audit_trail: []
})

const channelMap = {
  'alipay': '支付宝',
  'wechat': '微信支付',
  'unionpay': '银联支付',
  'credit_card': '信用卡'
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

function getTimelineType(index) {
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  return types[index % types.length]
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function loadDetail() {
  loading.value = true
  try {
    const response = await api.get(`/v1/payment/trace/${orderNo.value}`)
    
    if (response.success) {
      const data = response.data
      orderData.order = data.order
      orderData.merchant = data.merchant
      orderData.transactions = data.transactions || []
      orderData.refunds = data.refunds || []
      orderData.audit_trail = data.audit_trail || []
    }
  } catch (error) {
    console.error('Load order detail error:', error)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.order-detail-container {
  width: 100%;
}

.detail-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-text {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.operator-info {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.log-detail {
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
}

.log-detail pre {
  margin: 5px 0 0 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
