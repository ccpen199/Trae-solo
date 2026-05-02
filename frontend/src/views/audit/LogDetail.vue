<template>
  <div class="log-detail-container">
    <el-button @click="goBack" style="margin-bottom: 20px;">
      <el-icon><ArrowLeft /></el-icon>
      返回审计日志
    </el-button>

    <el-card v-if="logData">
      <template #header>
        <div class="card-header">
          <span>审计日志详情</span>
          <el-tag :type="getActionTagType(logData.action_type)" size="large">
            {{ getActionTypeLabel(logData.action_type) }}
          </el-tag>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="审计编号">{{ logData.audit_no }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ getActionTypeLabel(logData.action_type) }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDate(logData.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ logData.operator_name }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag size="small">{{ getRoleLabel(logData.operator_role) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ logData.ip_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资源类型" :span="2">{{ logData.resource_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资源ID">{{ logData.resource_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联订单" :span="3">
          <span v-if="logData.order_no">{{ logData.order_no }}</span>
          <span v-else class="text-muted">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="3">{{ logData.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="sub-header">变更前值</div>
            </template>
            <div v-if="logData.old_value" class="json-content">
              <pre>{{ formatJson(logData.old_value) }}</pre>
            </div>
            <div v-else class="no-content">
              <el-text type="info">无变更前数据</el-text>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="sub-header">变更后值</div>
            </template>
            <div v-if="logData.new_value" class="json-content">
              <pre>{{ formatJson(logData.new_value) }}</pre>
            </div>
            <div v-else class="no-content">
              <el-text type="info">无变更后数据</el-text>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card v-if="relatedData" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>关联数据</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane v-if="relatedData.order" label="订单信息" name="order">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="订单号">{{ relatedData.order.order_no }}</el-descriptions-item>
            <el-descriptions-item label="订单金额">¥{{ relatedData.order.amount }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getOrderStatusType(relatedData.order.status)">
                {{ getOrderStatusLabel(relatedData.order.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(relatedData.order.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane v-if="relatedData.transactions && relatedData.transactions.length > 0" label="交易记录" name="transactions">
          <el-table :data="relatedData.transactions" stripe>
            <el-table-column prop="transaction_no" label="交易编号" min-width="200" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'payment' ? 'success' : 'warning'" size="small">
                  {{ row.type === 'payment' ? '支付' : '退款' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'warning'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="channel_transaction_id" label="渠道交易号" min-width="200" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane v-if="relatedData.refunds && relatedData.refunds.length > 0" label="退款记录" name="refunds">
          <el-table :data="relatedData.refunds" stripe>
            <el-table-column prop="refund_no" label="退款编号" min-width="200" />
            <el-table-column prop="refund_amount" label="退款金额" width="120">
              <template #default="{ row }">¥{{ row.refund_amount }}</template>
            </el-table-column>
            <el-table-column prop="refund_reason" label="退款原因" min-width="200" />
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
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const logData = ref(null)
const relatedData = ref(null)
const activeTab = ref('order')

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
  user_logout: '用户登出',
  merchant_update: '更新商户',
  channel_update: '更新渠道',
  audit_query: '审计查询'
}

const roleMap = {
  customer: 'C端用户',
  merchant_operator: '商户运营',
  merchant_admin: '商户管理员',
  finance: '财务人员',
  channel_operator: '渠道商',
  admin: '系统管理员'
}

const orderStatusMap = {
  pending: { label: '待支付', type: 'info' },
  paying: { label: '支付中', type: 'warning' },
  paid: { label: '已支付', type: 'success' },
  failed: { label: '支付失败', type: 'danger' },
  refunding: { label: '退款中', type: 'warning' },
  refunded: { label: '已退款', type: 'info' },
  closed: { label: '已关闭', type: 'info' }
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

function getRoleLabel(role) {
  return roleMap[role] || role
}

function getOrderStatusLabel(status) {
  return orderStatusMap[status]?.label || status
}

function getOrderStatusType(status) {
  return orderStatusMap[status]?.type || 'info'
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

async function loadDetail() {
  const auditNo = route.params.auditNo
  if (!auditNo) return
  
  loading.value = true
  try {
    const response = await api.get(`/v1/audit/log/${auditNo}`)
    if (response.success) {
      logData.value = response.data.log
      relatedData.value = response.data.related_data
    }
  } catch (error) {
    console.error('Load log detail error:', error)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'AuditLogs' })
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.log-detail-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-header {
  font-weight: bold;
  color: #303133;
}

.json-content {
  max-height: 400px;
  overflow-y: auto;
}

.json-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.no-content {
  text-align: center;
  padding: 40px;
}

.text-muted {
  color: #909399;
}
</style>
