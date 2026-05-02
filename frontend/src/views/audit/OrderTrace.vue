<template>
  <div class="order-trace-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单追溯</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入订单号" style="width: 300px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTrace" :loading="loading">
            <el-icon><Search /></el-icon>
            追溯查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <template v-if="traceData">
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>订单基本信息</span>
            <el-tag :type="getOrderStatusType(traceData.order.status)" size="large">
              {{ getOrderStatusLabel(traceData.order.status) }}
            </el-tag>
          </div>
        </template>

        <el-descriptions :column="4" border>
          <el-descriptions-item label="订单号">{{ traceData.order.order_no }}</el-descriptions-item>
          <el-descriptions-item label="商户订单号">{{ traceData.order.merchant_order_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ traceData.order.amount }}</el-descriptions-item>
          <el-descriptions-item label="支付渠道">
            <el-tag size="small">{{ getChannelLabel(traceData.order.channel) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预支付ID">{{ traceData.order.prepay_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="交易ID">{{ traceData.order.transaction_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(traceData.order.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">
            <span v-if="traceData.order.paid_at">{{ formatDate(traceData.order.paid_at) }}</span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>交易流水 ({{ traceData.transactions.length }})</span>
          </div>
        </template>

        <el-table :data="traceData.transactions" stripe v-if="traceData.transactions.length > 0">
          <el-table-column prop="transaction_no" label="交易流水号" min-width="200" />
          <el-table-column prop="type" label="交易类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'payment' ? 'success' : 'warning'" size="small">
                {{ row.type === 'payment' ? '支付' : '退款' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="交易金额" width="120">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
          <el-table-column prop="fee_amount" label="手续费" width="100">
            <template #default="{ row }">
              <span v-if="row.fee_amount">¥{{ row.fee_amount }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="channel" label="渠道" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getChannelLabel(row.channel) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="channel_transaction_id" label="渠道交易号" min-width="200" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'warning'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无交易流水" />
      </el-card>

      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>退款记录 ({{ traceData.refunds.length }})</span>
          </div>
        </template>

        <el-table :data="traceData.refunds" stripe v-if="traceData.refunds.length > 0">
          <el-table-column prop="refund_no" label="退款单号" min-width="200" />
          <el-table-column prop="refund_amount" label="退款金额" width="120">
            <template #default="{ row }">¥{{ row.refund_amount }}</template>
          </el-table-column>
          <el-table-column prop="refund_reason" label="退款原因" min-width="200" />
          <el-table-column prop="channel_refund_id" label="渠道退款号" min-width="200" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
                {{ getRefundStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="failure_reason" label="失败原因" min-width="150">
            <template #default="{ row }">
              <span v-if="row.failure_reason">{{ row.failure_reason }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无退款记录" />
      </el-card>

      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>审计轨迹 ({{ traceData.audit_trail.length }})</span>
          </div>
        </template>

        <el-timeline v-if="traceData.audit_trail.length > 0">
          <el-timeline-item
            v-for="(item, index) in traceData.audit_trail"
            :key="item.audit_no"
            :type="getTimelineType(item.action_type)"
            :timestamp="formatDate(item.created_at)"
            placement="top"
          >
            <el-card shadow="hover">
              <div class="timeline-header">
                <el-tag :type="getActionTagType(item.action_type)" size="small">
                  {{ getActionTypeLabel(item.action_type) }}
                </el-tag>
                <span class="operator-info">
                  操作人: {{ item.operator_name }}
                  <el-tag size="small" style="margin-left: 8px;">{{ getRoleLabel(item.operator_role) }}</el-tag>
                </span>
              </div>
              <div class="timeline-description">
                {{ item.description }}
              </div>
              <div v-if="item.old_value || item.new_value" class="timeline-changes">
                <el-row :gutter="20">
                  <el-col :span="12" v-if="item.old_value">
                    <div class="change-header">变更前:</div>
                    <div class="change-content">{{ formatJson(item.old_value) }}</div>
                  </el-col>
                  <el-col :span="12" v-if="item.new_value">
                    <div class="change-header">变更后:</div>
                    <div class="change-content">{{ formatJson(item.new_value) }}</div>
                  </el-col>
                </el-row>
              </div>
              <div class="timeline-footer">
                IP地址: {{ item.ip_address || '-' }}
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无审计轨迹" />
      </el-card>
    </template>

    <el-card v-else-if="!loading && searchForm.order_no" style="margin-top: 20px;">
      <el-empty description="未找到该订单，请检查订单号是否正确" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Search } from '@element-plus/icons-vue'
import api from '@/utils/api'

const loading = ref(false)

const searchForm = reactive({
  order_no: ''
})

const traceData = ref(null)

const orderStatusMap = {
  pending: { label: '待支付', type: 'info' },
  paying: { label: '支付中', type: 'warning' },
  paid: { label: '已支付', type: 'success' },
  failed: { label: '支付失败', type: 'danger' },
  refunding: { label: '退款中', type: 'warning' },
  refunded: { label: '已退款', type: 'info' },
  closed: { label: '已关闭', type: 'info' }
}

const channelMap = {
  wechat: '微信支付',
  alipay: '支付宝'
}

const actionTypeMap = {
  order_create: '创建订单',
  order_pay: '订单支付',
  order_cancel: '取消订单',
  order_close: '关闭订单',
  refund_create: '创建退款',
  refund_process: '处理退款',
  refund_success: '退款成功',
  refund_fail: '退款失败',
  reconciliation_run: '执行对账',
  reconciliation_resolve: '处理对账差异',
  payout_create: '创建打款',
  payout_process: '处理打款',
  payout_success: '打款成功',
  payout_fail: '打款失败',
  profit_sharing_create: '创建分润',
  profit_sharing_process: '处理分润',
  user_login: '用户登录',
  user_logout: '用户登出'
}

const roleMap = {
  customer: 'C端用户',
  merchant_operator: '商户运营',
  merchant_admin: '商户管理员',
  finance: '财务人员',
  channel_operator: '渠道商',
  admin: '系统管理员'
}

function getOrderStatusLabel(status) {
  return orderStatusMap[status]?.label || status
}

function getOrderStatusType(status) {
  return orderStatusMap[status]?.type || 'info'
}

function getChannelLabel(channel) {
  return channelMap[channel] || channel
}

function getRefundStatusLabel(status) {
  const map = {
    pending: '待处理',
    processing: '处理中',
    success: '成功',
    failed: '失败'
  }
  return map[status] || status
}

function getActionTypeLabel(type) {
  return actionTypeMap[type] || type
}

function getActionTagType(type) {
  const dangerTypes = ['order_close', 'refund_fail', 'payout_fail', 'reconciliation_resolve']
  const warningTypes = ['order_cancel', 'refund_create', 'refund_process']
  const successTypes = ['order_pay', 'refund_success', 'payout_success', 'profit_sharing_process']
  
  if (dangerTypes.includes(type)) return 'danger'
  if (warningTypes.includes(type)) return 'warning'
  if (successTypes.includes(type)) return 'success'
  return 'info'
}

function getTimelineType(actionType) {
  const dangerTypes = ['order_close', 'refund_fail', 'payout_fail']
  const warningTypes = ['order_cancel', 'refund_create', 'refund_process']
  const successTypes = ['order_pay', 'refund_success', 'payout_success']
  
  if (dangerTypes.includes(actionType)) return 'danger'
  if (warningTypes.includes(actionType)) return 'warning'
  if (successTypes.includes(actionType)) return 'success'
  return 'primary'
}

function getRoleLabel(role) {
  return roleMap[role] || role
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

function formatJson(value) {
  try {
    const obj = typeof value === 'string' ? JSON.parse(value) : value
    return JSON.stringify(obj, null, 2)
  } catch {
    return value
  }
}

async function loadTrace() {
  if (!searchForm.order_no) {
    return
  }
  
  loading.value = true
  traceData.value = null
  try {
    const response = await api.get(`/v1/audit/order-trace/${searchForm.order_no}`)
    if (response.success) {
      traceData.value = response.data
    }
  } catch (error) {
    console.error('Load order trace error:', error)
    traceData.value = null
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.order-trace-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.operator-info {
  font-size: 12px;
  color: #606266;
}

.timeline-description {
  font-size: 14px;
  color: #303133;
  margin-bottom: 10px;
}

.timeline-changes {
  margin: 10px 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.change-header {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.change-content {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #303133;
}

.timeline-footer {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.text-muted {
  color: #909399;
}
</style>
