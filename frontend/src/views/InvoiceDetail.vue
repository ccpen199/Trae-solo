<template>
  <div class="invoice-detail" v-loading="loading">
    <div class="page-header">
      <el-button type="primary" link @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <h2>发票详情</h2>
    </div>

    <el-row :gutter="24">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <span :class="`status-tag status-${invoice?.status}`">
                {{ invoice?.status_name }}
              </span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="发票号码">
              <span v-if="invoice?.invoice_no" class="invoice-no">
                {{ invoice.invoice_no }}
              </span>
              <span v-else class="text-muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="发票代码">
              <span v-if="invoice?.invoice_code">{{ invoice.invoice_code }}</span>
              <span v-else class="text-muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="关联订单">{{ invoice?.order_no }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ invoice?.customer_name }}</el-descriptions-item>
            <el-descriptions-item label="发票抬头" :span="2">{{ invoice?.invoice_title }}</el-descriptions-item>
            <el-descriptions-item label="纳税人识别号" :span="2">{{ invoice?.tax_no }}</el-descriptions-item>
            <el-descriptions-item label="开户银行">{{ invoice?.bank_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="银行账号">{{ invoice?.bank_account || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业地址">{{ invoice?.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ invoice?.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开票金额">
              <span class="amount">¥{{ formatAmount(invoice?.amount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDateTime(invoice?.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="交付时间">
              {{ invoice?.delivered_at ? formatDateTime(invoice.delivered_at) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="结票时间">
              {{ invoice?.settled_at ? formatDateTime(invoice.settled_at) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="mt-24">
          <template #header>
            <div class="card-header">
              <span>开票项目</span>
            </div>
          </template>

          <el-table :data="items" border>
            <el-table-column prop="name" label="项目名称" min-width="200" />
            <el-table-column prop="spec" label="规格型号" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="price" label="单价" width="120">
              <template #default="{ row }">
                ¥{{ formatAmount(row.price) }}
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="{ row }">
                <span class="amount">¥{{ formatAmount(row.quantity * row.price) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="mt-24">
          <template #header>
            <div class="card-header">
              <span>操作记录（审计日志）</span>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in auditLogs"
              :key="log.id"
              :timestamp="formatDateTime(log.created_at)"
              placement="top"
            >
              <el-card shadow="hover">
                <h4>{{ log.action }}</h4>
                <p>
                  <el-tag size="small">{{ log.operator_name }}</el-tag>
                  <span class="text-muted">{{ log.operator_role }}</span>
                </p>
                <p v-if="log.from_status || log.to_status" class="status-flow">
                  <span v-if="log.from_status">{{ log.from_status }}</span>
                  <el-icon v-if="log.from_status && log.to_status"><ArrowRight /></el-icon>
                  <span v-if="log.to_status" class="text-primary">{{ log.to_status }}</span>
                </p>
                <div v-if="log.details" class="details">
                  <el-tag type="info">详情</el-tag>
                  <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <el-empty v-if="auditLogs.length === 0" description="暂无操作记录" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>

          <div class="action-buttons">
            <el-button 
              v-if="userStore.isFinance && invoice?.status === 'pending'"
              type="primary" 
              size="large"
              style="width: 100%"
              @click="handleIssue"
            >
              <el-icon><Ticket /></el-icon>
              一键开票
            </el-button>

            <el-button 
              v-if="(userStore.isFinance || userStore.isTax) && 
                   ['issued', 'delivered', 'settled'].includes(invoice?.status)"
              type="danger" 
              size="large"
              style="width: 100%"
              @click="handleRedCredit"
            >
              <el-icon><Warning /></el-icon>
              红冲发票
            </el-button>
          </div>
        </el-card>

        <el-card class="mt-24" v-if="deliveryHistory.length > 0">
          <template #header>
            <div class="card-header">
              <span>交付记录</span>
            </div>
          </template>

          <div class="delivery-list">
            <div v-for="record in deliveryHistory" :key="record.id" class="delivery-item">
              <div class="delivery-channel">
                <el-tag :type="record.channel === 'system' ? 'primary' : 'success'">
                  {{ record.channel === 'system' ? '系统推送' : record.channel }}
                </el-tag>
              </div>
              <div class="delivery-info">
                <span>收件人: {{ record.recipient }}</span>
                <span class="text-muted">{{ formatDateTime(record.sent_at) }}</span>
              </div>
              <div class="delivery-status">
                <el-tag :type="getDeliveryStatusType(record.status)" size="small">
                  {{ getDeliveryStatusName(record.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="mt-24" v-if="redCreditHistory.length > 0">
          <template #header>
            <div class="card-header">
              <span>红冲记录</span>
            </div>
          </template>

          <div class="red-credit-list">
            <div v-for="record in redCreditHistory" :key="record.id" class="red-credit-item">
              <div class="red-credit-header">
                <span class="text-danger">红冲发票</span>
                <el-tag type="danger" size="small">{{ record.status }}</el-tag>
              </div>
              <div class="red-credit-info">
                <p>原发票号: {{ record.original_invoice_no }}</p>
                <p>红冲金额: <span class="text-danger">¥{{ formatAmount(record.amount) }}</span></p>
                <p>红冲原因: {{ record.reason }}</p>
                <p class="text-muted">{{ formatDateTime(record.created_at) }}</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="redCreditDialogVisible"
      title="红冲申请"
      width="500px"
    >
      <el-form :model="redCreditForm" label-width="80px">
        <el-form-item label="红冲原因" required>
          <el-input
            v-model="redCreditForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入红冲原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="redCreditDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="redCreditLoading" @click="submitRedCredit">
          确认红冲
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const invoice = ref(null)
const items = ref([])
const auditLogs = ref([])
const deliveryHistory = ref([])
const redCreditHistory = ref([])
const redCreditDialogVisible = ref(false)
const redCreditLoading = ref(false)

const redCreditForm = reactive({
  reason: ''
})

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('zh-CN')
}

const getDeliveryStatusName = (status) => {
  const map = {
    'pending': '待发送',
    'sent': '已发送',
    'delivered': '已送达',
    'read': '已阅读'
  }
  return map[status] || status
}

const getDeliveryStatusType = (status) => {
  const map = {
    'pending': 'info',
    'sent': 'warning',
    'delivered': 'success',
    'read': 'success'
  }
  return map[status] || 'info'
}

const loadDetail = async () => {
  loading.value = true
  try {
    const data = await api.get(`/invoices/${route.params.id}`)
    invoice.value = data.invoice
    items.value = JSON.parse(data.invoice.items || '[]')
    auditLogs.value = data.audit_logs || []
    deliveryHistory.value = data.delivery_history || []
    redCreditHistory.value = data.red_credit_history || []
  } catch (e) {
    console.error('Failed to load detail:', e)
    ElMessage.error('加载发票详情失败')
    router.push('/invoices')
  } finally {
    loading.value = false
  }
}

const handleIssue = async () => {
  try {
    await ElMessageBox.confirm(
      `确认对订单 ${invoice.value.order_no} 开票？开票后将生成电子发票并自动交付。`,
      '确认开票',
      {
        confirmButtonText: '确认开票',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await api.post(`/invoices/${route.params.id}/issue`)
    ElMessage.success('开票成功！发票号码: ' + result.invoice.invoice_no)
    loadDetail()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Issue invoice failed:', e)
    }
  }
}

const handleRedCredit = () => {
  redCreditForm.reason = ''
  redCreditDialogVisible.value = true
}

const submitRedCredit = async () => {
  if (!redCreditForm.reason.trim()) {
    ElMessage.warning('请输入红冲原因')
    return
  }

  redCreditLoading.value = true
  try {
    const result = await api.post(`/invoices/${route.params.id}/red-credit`, {
      reason: redCreditForm.reason
    })
    ElMessage.success('红冲成功！红冲发票号码: ' + result.red_credit.red_invoice_no)
    redCreditDialogVisible.value = false
    loadDetail()
  } catch (e) {
    console.error('Red credit failed:', e)
  } finally {
    redCreditLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.invoice-detail {
  height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.mt-24 {
  margin-top: 24px;
}

.invoice-no {
  font-family: 'Monaco', monospace;
  color: #409eff;
  font-weight: 500;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
  font-size: 16px;
}

.text-muted {
  color: #909399;
}

.text-primary {
  color: #409eff;
}

.text-danger {
  color: #f56c6c;
}

.status-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.details {
  margin-top: 8px;
}

.details pre {
  margin: 8px 0 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.delivery-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
}

.delivery-channel {
  margin-bottom: 8px;
}

.delivery-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.delivery-status {
  margin-top: 8px;
}

.red-credit-item {
  padding: 12px;
  background: #fff2f0;
  border-radius: 4px;
  margin-bottom: 12px;
  border: 1px solid #ffccc7;
}

.red-credit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.red-credit-info {
  font-size: 13px;
  color: #606266;
}

.red-credit-info p {
  margin: 4px 0;
}
</style>
