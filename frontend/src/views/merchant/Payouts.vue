<template>
  <div class="payouts-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>打款管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            申请打款
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadPayouts">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="payouts" v-loading="loading" stripe>
        <el-table-column prop="payout_no" label="打款单号" min-width="200">
          <template #default="{ row }">
            <el-text type="primary" size="small">{{ row.payout_no }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="打款金额" width="120">
          <template #default="{ row }">
            <span class="highlight">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="bank_account" label="收款账户" min-width="180">
          <template #default="{ row }">
            {{ row.bank_account }}
          </template>
        </el-table-column>
        <el-table-column prop="bank_name" label="开户行" width="150" />
        <el-table-column prop="channel_payout_id" label="渠道打款ID" min-width="180">
          <template #default="{ row }">
            <span v-if="row.channel_payout_id">{{ row.channel_payout_id }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="failure_reason" label="失败原因" min-width="150">
          <template #default="{ row }">
            <span v-if="row.failure_reason">{{ row.failure_reason }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="processed_at" label="处理时间" width="180">
          <template #default="{ row }">
            <span v-if="row.processed_at">{{ formatDate(row.processed_at) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadPayouts"
        @current-change="loadPayouts"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <el-dialog
      v-model="createDialogVisible"
      title="申请打款"
      width="500px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="可用余额">
          <el-input :value="`¥${balanceData.available}`" disabled />
        </el-form-item>
        <el-form-item label="打款金额" prop="amount">
          <el-input-number
            v-model="createForm.amount"
            :precision="2"
            :min="1"
            :max="balanceData.available"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="收款账户">
          <el-input :value="merchantInfo.settlement_account" disabled />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input :value="merchantInfo.settlement_bank" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreate">
          确认打款
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/utils/api'

const loading = ref(false)
const createDialogVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref(null)

const searchForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const payouts = ref([])

const balanceData = reactive({
  available: 0
})

const merchantInfo = reactive({
  settlement_account: '',
  settlement_bank: ''
})

const createForm = reactive({
  amount: 0
})

const createRules = {
  amount: [
    { required: true, message: '请输入打款金额', trigger: 'blur' }
  ]
}

const statusMap = {
  pending: { label: '待处理', type: 'info' },
  processing: { label: '处理中', type: 'warning' },
  success: { label: '成功', type: 'success' },
  failed: { label: '失败', type: 'danger' }
}

function getStatusLabel(status) {
  return statusMap[status]?.label || status
}

function getStatusType(status) {
  return statusMap[status]?.type || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadPayouts() {
  loading.value = true
  try {
    const params = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const response = await api.get('/v1/merchant/payouts', { params })
    if (response.success) {
      pagination.total = response.data.total
      payouts.value = response.data.payouts
    }
  } catch (error) {
    console.error('Load payouts error:', error)
  } finally {
    loading.value = false
  }
}

async function loadBalance() {
  try {
    const response = await api.get('/v1/merchant/balance')
    if (response.success) {
      const data = response.data
      if (data.merchant) {
        balanceData.available = data.merchant.available_balance || 0
        merchantInfo.settlement_account = data.merchant.settlement_account || ''
        merchantInfo.settlement_bank = data.merchant.settlement_bank || ''
      }
    }
  } catch (error) {
    console.error('Load balance error:', error)
  }
}

function resetSearch() {
  searchForm.status = ''
  pagination.page = 1
  loadPayouts()
}

function showCreateDialog() {
  createForm.amount = balanceData.available
  createDialogVisible.value = true
}

async function submitCreate() {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      createLoading.value = true
      try {
        await ElMessageBox.confirm(
          `确认打款 ¥${createForm.amount} 元？`,
          '打款确认',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const response = await api.post('/v1/merchant/payout', {
          amount: createForm.amount
        })

        if (response.success) {
          ElMessage.success('打款申请已提交')
          createDialogVisible.value = false
          loadPayouts()
          loadBalance()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Payout error:', error)
        }
      } finally {
        createLoading.value = false
      }
    }
  })
}

onMounted(() => {
  loadPayouts()
  loadBalance()
})
</script>

<style scoped>
.payouts-container {
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

.highlight {
  color: #67c23a;
  font-weight: bold;
}

.text-muted {
  color: #909399;
}
</style>
