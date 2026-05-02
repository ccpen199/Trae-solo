<template>
  <div class="voucher-detail-page">
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="page-header">
          <span class="page-title">凭证详情</span>
          <div>
            <el-button @click="goBack">返回列表</el-button>
            <el-button
              v-for="action in availableActions"
              :key="action.action"
              :type="getActionType(action.color)"
              @click="executeAction(action.action)"
            >
              {{ action.label }}
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="4" border>
        <el-descriptions-item label="凭证编号">
          {{ voucher.voucher_no }}
        </el-descriptions-item>
        <el-descriptions-item label="凭证类型">
          {{ voucher.voucher_type }}
        </el-descriptions-item>
        <el-descriptions-item label="凭证日期">
          {{ voucher.voucher_date }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="['status-tag', `status-${voucher.status}`]">
            {{ voucher.statusLabel }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="会计期间">
          {{ voucher.period }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ voucher.creator_name }}
        </el-descriptions-item>
        <el-descriptions-item label="责任人">
          {{ voucher.responsible_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="期望完成时间">
          {{ voucher.expected_completion_time || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider>凭证明细</el-divider>

      <el-table :data="voucher.details" border style="width: 100%;">
        <el-table-column label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="科目代码" width="120">
          <template #default="{ row }">
            {{ row.subject_code }}
          </template>
        </el-table-column>
        <el-table-column label="科目名称" min-width="150">
          <template #default="{ row }">
            {{ row.subject_name }}
          </template>
        </el-table-column>
        <el-table-column label="摘要" min-width="200">
          <template #default="{ row }">
            {{ row.summary || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="借方金额" width="150" align="right">
          <template #default="{ row }">
            {{ row.debit_amount > 0 ? row.debit_amount.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="贷方金额" width="150" align="right">
          <template #default="{ row }">
            {{ row.credit_amount > 0 ? row.credit_amount.toFixed(2) : '-' }}
          </template>
        </el-table-column>
      </el-table>

      <el-row style="margin-top: 20px;">
        <el-col :span="24">
          <el-card shadow="never" style="background: #f5f7fa;">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="total-info">
                  <span class="total-label">借方合计：</span>
                  <span class="total-value">
                    ¥{{ voucher.total_debit?.toFixed(2) || '0.00' }}
                  </span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="total-info">
                  <span class="total-label">贷方合计：</span>
                  <span class="total-value">
                    ¥{{ voucher.total_credit?.toFixed(2) || '0.00' }}
                  </span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="total-info">
                  <span class="total-label">借贷平衡：</span>
                  <el-tag :type="isBalance ? 'success' : 'danger'">
                    {{ isBalance ? '平衡' : '不平衡' }}
                  </el-tag>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>

      <el-divider v-if="voucher.statusFlows?.length > 0">状态流转时间轴</el-divider>

      <el-timeline v-if="voucher.statusFlows?.length > 0">
        <el-timeline-item
          v-for="(flow, index) in voucher.statusFlows"
          :key="flow.id"
          :timestamp="flow.created_at"
          placement="top"
        >
          <el-card>
            <h4>{{ getOperationText(flow.operation) }}</h4>
            <p>操作人：{{ flow.operator_name }}</p>
            <p v-if="flow.comment">备注：{{ flow.comment }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="actionForm" label-width="80px">
        <el-form-item label="审批意见">
          <el-input
            v-model="actionForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入意见（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAction" :loading="actionLoading">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const voucher = ref({})
const availableActions = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const actionLoading = ref(false)
const currentAction = ref('')

const actionForm = reactive({
  comment: ''
})

const isBalance = computed(() => {
  return Math.abs((voucher.value.total_debit || 0) - (voucher.value.total_credit || 0)) < 0.01
})

function getActionType(color) {
  const types = {
    primary: 'primary',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info'
  }
  return types[color] || 'default'
}

function getOperationText(operation) {
  const texts = {
    create_voucher: '创建凭证',
    update_voucher: '更新凭证',
    submit: '提交审核',
    lock: '锁定审核',
    unlock: '解锁凭证',
    pass: '审核通过',
    reject: '审核驳回',
    supplement: '要求补充资料',
    transfer: '转派审核',
    generate_ledger: '生成账簿',
    generate_report: '生成报表',
    close: '月末结账',
    unclose: '反结账',
    cancel: '取消凭证',
    ledger: '进入待生成账簿',
    report: '进入待出报表',
    closure: '进入待月末结账'
  }
  return texts[operation] || operation
}

async function loadVoucher() {
  if (!route.params.id) return
  loading.value = true
  try {
    const result = await api.getVoucher(route.params.id)
    if (result.success && result.data) {
      voucher.value = result.data
      availableActions.value = result.data.availableActions || []
    }
  } catch (error) {
    console.error('加载凭证失败:', error)
    ElMessage.error('加载凭证失败')
  } finally {
    loading.value = false
  }
}

function executeAction(action) {
  const needConfirmActions = ['cancel', 'reject', 'unclose']
  const needCommentActions = ['pass', 'reject', 'supplement']

  if (needConfirmActions.includes(action)) {
    ElMessageBox.confirm(
      `确认要${getOperationText(action)}吗？`,
      '确认操作',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      if (needCommentActions.includes(action)) {
        currentAction.value = action
        dialogTitle.value = `确认${getOperationText(action)}`
        dialogVisible.value = true
      } else {
        doAction(action, '')
      }
    }).catch(() => {})
  } else if (needCommentActions.includes(action)) {
    currentAction.value = action
    dialogTitle.value = `确认${getOperationText(action)}`
    dialogVisible.value = true
  } else {
    doAction(action, '')
  }
}

async function confirmAction() {
  actionLoading.value = true
  try {
    await doAction(currentAction.value, actionForm.comment)
    dialogVisible.value = false
    actionForm.comment = ''
  } finally {
    actionLoading.value = false
  }
}

async function doAction(action, comment) {
  actionLoading.value = true
  try {
    let result
    switch (action) {
      case 'edit':
        router.push(`/vouchers/${route.params.id}/edit`)
        return
      case 'submit':
        result = await api.submitVoucher(route.params.id)
        break
      case 'cancel':
        result = await api.cancelVoucher(route.params.id, { reason: comment })
        break
      case 'lock':
        result = await api.lockVoucher(route.params.id)
        break
      case 'unlock':
        result = await api.unlockVoucher(route.params.id)
        break
      case 'pass':
        result = await api.passReview(route.params.id, { comment })
        break
      case 'reject':
        result = await api.rejectReview(route.params.id, { comment })
        break
      case 'supplement':
        result = await api.supplementReview(route.params.id, { comment })
        break
      case 'generate_ledger':
        result = await api.generateLedger(route.params.id)
        break
      case 'generate_report':
        result = await api.generateReport(route.params.id)
        break
      case 'close':
        result = await api.closeVoucher(route.params.id)
        break
      case 'unclose':
        result = await api.uncloseVoucher(route.params.id)
        break
      default:
        ElMessage.warning('未知操作')
        return
    }

    if (result.success) {
      ElMessage.success('操作成功')
      loadVoucher()
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadVoucher()
})
</script>

<style scoped>
.total-info {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.total-label {
  color: #606266;
  margin-right: 8px;
}

.total-value {
  font-weight: bold;
  color: #303133;
}
</style>
