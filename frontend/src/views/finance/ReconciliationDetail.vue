<template>
  <div class="reconciliation-detail-container">
    <el-button @click="goBack" style="margin-bottom: 20px;">
      <el-icon><ArrowLeft /></el-icon>
      返回对账列表
    </el-button>

    <el-card v-if="reconciliation">
      <template #header>
        <div class="card-header">
          <span>对账详情</span>
          <el-tag :type="getStatusType(reconciliation.status)" size="large">
            {{ getStatusLabel(reconciliation.status) }}
          </el-tag>
        </div>
      </template>

      <el-descriptions :column="4" border>
        <el-descriptions-item label="对账单号">{{ reconciliation.reconciliation_no }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{ getChannelLabel(reconciliation.channel) }}</el-descriptions-item>
        <el-descriptions-item label="对账日期">{{ reconciliation.reconciliation_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(reconciliation.status)">
            {{ getStatusLabel(reconciliation.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="系统笔数">{{ reconciliation.total_system_transactions }}</el-descriptions-item>
        <el-descriptions-item label="系统金额">¥{{ reconciliation.total_system_amount }}</el-descriptions-item>
        <el-descriptions-item label="渠道笔数">{{ reconciliation.total_channel_transactions }}</el-descriptions-item>
        <el-descriptions-item label="渠道金额">¥{{ reconciliation.total_channel_amount }}</el-descriptions-item>
        <el-descriptions-item label="匹配笔数">
          <el-tag type="success">{{ reconciliation.matched_count }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="差异笔数">
          <el-tag v-if="reconciliation.mismatch_count > 0" type="danger">
            {{ reconciliation.mismatch_count }}
          </el-tag>
          <span v-else>0</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(reconciliation.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>对账明细</span>
          <el-radio-group v-model="itemFilter" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="matched">匹配</el-radio-button>
            <el-radio-button label="mismatched">差异</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="filteredItems" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" min-width="180">
          <template #default="{ row }">
            <el-text type="primary" size="small">{{ row.order_no }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="system_amount" label="系统金额" width="120">
          <template #default="{ row }">¥{{ row.system_amount }}</template>
        </el-table-column>
        <el-table-column prop="channel_amount" label="渠道金额" width="120">
          <template #default="{ row }">
            <span v-if="row.channel_amount !== null">¥{{ row.channel_amount }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="difference" label="差异金额" width="120">
          <template #default="{ row }">
            <span v-if="row.difference !== null && row.difference !== 0" class="text-danger">
              ¥{{ row.difference }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'matched' ? 'success' : 'danger'" size="small">
              {{ row.status === 'matched' ? '匹配' : '差异' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mismatch_type" label="差异类型" width="120">
          <template #default="{ row }">
            <span v-if="row.mismatch_type">{{ getMismatchTypeLabel(row.mismatch_type) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="resolution_remark" label="处理备注" min-width="150">
          <template #default="{ row }">
            <span v-if="row.resolution_remark">{{ row.resolution_remark }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'mismatched' && !row.resolution_remark"
              type="primary"
              link
              size="small"
              @click="showResolveDialog(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="resolveDialogVisible"
      title="处理对账差异"
      width="500px"
    >
      <el-descriptions :column="1" border style="margin-bottom: 20px;">
        <el-descriptions-item label="订单号">{{ currentItem?.order_no }}</el-descriptions-item>
        <el-descriptions-item label="系统金额">¥{{ currentItem?.system_amount }}</el-descriptions-item>
        <el-descriptions-item label="渠道金额">
          <span v-if="currentItem?.channel_amount !== null">¥{{ currentItem?.channel_amount }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="差异类型">
          {{ getMismatchTypeLabel(currentItem?.mismatch_type) }}
        </el-descriptions-item>
      </el-descriptions>
      <el-form
        ref="resolveFormRef"
        :model="resolveForm"
        :rules="resolveRules"
        label-width="100px"
      >
        <el-form-item label="处理备注" prop="resolution_remark">
          <el-input
            v-model="resolveForm.resolution_remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resolveLoading" @click="submitResolve">
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const resolveDialogVisible = ref(false)
const resolveLoading = ref(false)
const resolveFormRef = ref(null)

const reconciliation = ref(null)
const items = ref([])
const itemFilter = ref('all')
const currentItem = ref(null)

const resolveForm = reactive({
  resolution_remark: ''
})

const resolveRules = {
  resolution_remark: [
    { required: true, message: '请输入处理备注', trigger: 'blur' }
  ]
}

const filteredItems = computed(() => {
  if (itemFilter.value === 'all') {
    return items.value
  }
  return items.value.filter(item => item.status === itemFilter.value)
})

const channelMap = {
  wechat: '微信支付',
  alipay: '支付宝'
}

const statusMap = {
  matched: { label: '匹配成功', type: 'success' },
  mismatched: { label: '存在差异', type: 'danger' },
  pending: { label: '待处理', type: 'warning' }
}

const mismatchTypeMap = {
  amount_mismatch: '金额差异',
  order_not_found: '订单不存在',
  transaction_not_found: '交易不存在',
  status_mismatch: '状态差异'
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

function getMismatchTypeLabel(type) {
  return mismatchTypeMap[type] || type
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadDetail() {
  const reconciliationNo = route.params.reconciliationNo
  if (!reconciliationNo) return
  
  loading.value = true
  try {
    const response = await api.get(`/v1/finance/reconciliation/${reconciliationNo}`)
    if (response.success) {
      reconciliation.value = response.data
      items.value = response.data.items || []
    }
  } catch (error) {
    console.error('Load reconciliation detail error:', error)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'FinanceReconciliation' })
}

function showResolveDialog(item) {
  currentItem.value = item
  resolveForm.resolution_remark = ''
  resolveDialogVisible.value = true
}

async function submitResolve() {
  if (!resolveFormRef.value || !currentItem.value) return
  
  await resolveFormRef.value.validate(async (valid) => {
    if (valid) {
      resolveLoading.value = true
      try {
        await ElMessageBox.confirm(
          '确认处理此对账差异？',
          '处理确认',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await api.post('/v1/finance/adjustment-pool/resolve', {
          item_id: currentItem.value.id,
          resolution_remark: resolveForm.resolution_remark
        })
        
        if (response.success) {
          ElMessage.success('处理成功')
          resolveDialogVisible.value = false
          loadDetail()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Resolve error:', error)
        }
      } finally {
        resolveLoading.value = false
      }
    }
  })
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.reconciliation-detail-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-muted {
  color: #909399;
}

.text-danger {
  color: #f56c6c;
}
</style>
