<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-button type="text" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">客户详情 - {{ customer?.name || '' }}</h2>
      </div>
      <div>
        <el-button type="primary" @click="openAssessDialog">
          <el-icon><Warning /></el-icon>
          风险评估
        </el-button>
        <el-button type="primary" @click="openTaskDialog">
          <el-icon><Plus /></el-icon>
          创建挽回任务
        </el-button>
      </div>
    </div>

    <el-descriptions :column="4" border class="card-wrapper" v-loading="loading">
      <el-descriptions-item label="客户编号">{{ customer?.customer_no }}</el-descriptions-item>
      <el-descriptions-item label="客户名称">{{ customer?.name }}</el-descriptions-item>
      <el-descriptions-item label="公司名称">{{ customer?.company }}</el-descriptions-item>
      <el-descriptions-item label="行业">{{ customer?.industry }}</el-descriptions-item>
      <el-descriptions-item label="客户等级">
        <el-tag :type="getLevelType(customer?.level)" size="small">{{ customer?.level }}级</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="联系人">{{ customer?.contact_name }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ customer?.contact_phone }}</el-descriptions-item>
      <el-descriptions-item label="联系邮箱">{{ customer?.contact_email }}</el-descriptions-item>
      <el-descriptions-item label="区域">{{ customer?.region }}</el-descriptions-item>
      <el-descriptions-item label="累计消费">¥{{ (customer?.total_amount || 0).toLocaleString() }}</el-descriptions-item>
      <el-descriptions-item label="最后付款日期">{{ customer?.last_payment_date }}</el-descriptions-item>
      <el-descriptions-item label="到期日期">{{ customer?.expiration_date }}</el-descriptions-item>
      <el-descriptions-item label="状态" :span="2">
        <el-tag :type="customer?.status === 1 ? 'success' : 'danger'">
          {{ customer?.status === 1 ? '正常' : '停用' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间" :span="2">{{ customer?.created_at }}</el-descriptions-item>
    </el-descriptions>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="风险评估记录" name="assessments">
        <div class="card-wrapper">
          <el-table :data="assessments" border>
            <el-table-column prop="assessment_no" label="评估编号" width="140" />
            <el-table-column prop="risk_score" label="风险分" width="100" align="center">
              <template #default="{ row }">
                <span :class="['risk-badge', `risk-${row.risk_level}`]">{{ row.risk_score }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="risk_level" label="风险等级" width="100" align="center">
              <template #default="{ row }">{{ getRiskLevelText(row.risk_level) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getAssessmentStatusType(row.status)">{{ getAssessmentStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="creator_name" label="创建人" width="100" />
            <el-table-column prop="assessment_time" label="评估时间" width="180" />
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="$router.push(`/assessments/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="挽回任务" name="tasks">
        <div class="card-wrapper">
          <el-table :data="tasks" border>
            <el-table-column prop="task_no" label="任务编号" width="140" />
            <el-table-column prop="task_title" label="任务标题" />
            <el-table-column prop="task_type" label="任务类型" width="100" />
            <el-table-column prop="priority" label="优先级" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)" size="small">{{ getPriorityText(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee_name" label="负责人" width="100" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="['status-badge', `status-${row.status}`]">{{ getTaskStatusText(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="$router.push(`/tasks/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="行为记录" name="behaviors">
        <div class="card-wrapper">
          <el-table :data="behaviors" border>
            <el-table-column prop="behavior_type" label="行为类型" width="150" />
            <el-table-column prop="behavior_detail" label="行为详情" />
            <el-table-column prop="ip_address" label="IP地址" width="130" />
            <el-table-column prop="device_info" label="设备信息" width="200" />
            <el-table-column prop="behavior_time" label="行为时间" width="180" />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="支付记录" name="payments">
        <div class="card-wrapper">
          <el-table :data="payments" border>
            <el-table-column prop="order_no" label="订单编号" width="180" />
            <el-table-column prop="product_name" label="产品名称" />
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="payment_type" label="支付方式" width="100" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPaymentStatusType(row.status)" size="small">{{ getPaymentStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_date" label="开始日期" width="120" />
            <el-table-column prop="end_date" label="结束日期" width="120" />
            <el-table-column prop="payment_time" label="支付时间" width="180" />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Warning, Plus } from '@element-plus/icons-vue'
import api from '../../api'

const route = useRoute()
const router = useRouter()
const customerId = route.params.id
const loading = ref(false)
const activeTab = ref('assessments')
const customer = ref({})
const assessments = ref([])
const tasks = ref([])
const behaviors = ref([])
const payments = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get(`/customers/${customerId}`)
    customer.value = res.data.customer
    assessments.value = res.data.assessments
    tasks.value = res.data.tasks
    behaviors.value = res.data.behaviors
    payments.value = res.data.payments
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openAssessDialog = () => {
  ElMessageBox.confirm(`确定要对客户"${customer.value.name}"进行风险评估吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await api.post('/assessments', { customer_id: customerId })
      ElMessage.success('评估创建成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const openTaskDialog = () => {
  router.push({ path: '/tasks', query: { customerId, create: '1' } })
}

const getLevelType = (level) => {
  const types = { A: 'success', B: 'primary', C: 'warning', D: 'danger' }
  return types[level] || 'info'
}

const getRiskLevelText = (level) => {
  const texts = { low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险' }
  return texts[level] || level
}

const getAssessmentStatusType = (status) => {
  const types = {
    pending: 'warning',
    auto_blocked: 'danger',
    manual_review: 'primary',
    watching: 'info',
    closed: 'success'
  }
  return types[status] || 'info'
}

const getAssessmentStatusText = (status) => {
  const texts = {
    pending: '待处理',
    auto_blocked: '自动拦截',
    manual_review: '人工复核',
    watching: '继续观察',
    closed: '已关闭'
  }
  return texts[status] || status
}

const getPriorityType = (priority) => {
  const types = { low: 'info', medium: 'warning', high: 'danger', urgent: 'danger' }
  return types[priority] || 'info'
}

const getPriorityText = (priority) => {
  const texts = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return texts[priority] || priority
}

const getTaskStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getPaymentStatusType = (status) => {
  const types = { pending: 'warning', success: 'success', failed: 'danger', refunded: 'info' }
  return types[status] || 'info'
}

const getPaymentStatusText = (status) => {
  const texts = { pending: '待支付', success: '成功', failed: '失败', refunded: '已退款' }
  return texts[status] || status
}

onMounted(() => {
  loadData()
})
</script>
