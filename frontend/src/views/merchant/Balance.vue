<template>
  <div class="balance-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="balance-card available">
          <div class="balance-header">可用余额</div>
          <div class="balance-value">¥{{ balanceData.available || 0 }}</div>
          <el-button type="primary" plain @click="showPayoutDialog" :disabled="balanceData.available <= 0">
            申请打款
          </el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="balance-card frozen">
          <div class="balance-header">冻结金额</div>
          <div class="balance-value">¥{{ balanceData.frozen || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="balance-card pending">
          <div class="balance-header">待结算金额</div>
          <div class="balance-value">¥{{ balanceData.pending || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>最近分润记录</span>
        </div>
      </template>
      <el-table :data="profitSharings" v-loading="loading" stripe>
        <el-table-column prop="sharing_no" label="分润单号" min-width="200" />
        <el-table-column prop="order_no" label="订单号" min-width="200" />
        <el-table-column prop="total_amount" label="订单金额" width="120">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="merchant_amount" label="商户得款" width="120">
          <template #default="{ row }">
            <span class="highlight">¥{{ row.merchant_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="platform_fee" label="平台手续费" width="120">
          <template #default="{ row }">¥{{ row.platform_fee }}</template>
        </el-table-column>
        <el-table-column prop="channel_fee" label="渠道手续费" width="120">
          <template #default="{ row }">¥{{ row.channel_fee }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="payoutDialogVisible"
      title="申请打款"
      width="500px"
    >
      <el-form
        ref="payoutFormRef"
        :model="payoutForm"
        :rules="payoutRules"
        label-width="100px"
      >
        <el-form-item label="可用余额">
          <el-input :value="`¥${balanceData.available}`" disabled />
        </el-form-item>
        <el-form-item label="打款金额" prop="amount">
          <el-input-number
            v-model="payoutForm.amount"
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
        <el-button @click="payoutDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="payoutLoading" @click="submitPayout">
          确认打款
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const loading = ref(false)
const payoutDialogVisible = ref(false)
const payoutLoading = ref(false)
const payoutFormRef = ref(null)

const balanceData = reactive({
  available: 0,
  frozen: 0,
  pending: 0
})

const merchantInfo = reactive({
  settlement_account: '',
  settlement_bank: ''
})

const profitSharings = ref([])

const payoutForm = reactive({
  amount: 0
})

const payoutRules = {
  amount: [
    { required: true, message: '请输入打款金额', trigger: 'blur' }
  ]
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadBalance() {
  loading.value = true
  try {
    const response = await api.get('/v1/merchant/balance')
    if (response.success) {
      const data = response.data
      if (data.merchant) {
        balanceData.available = data.merchant.available_balance || 0
        balanceData.frozen = data.merchant.frozen_balance || 0
        balanceData.pending = data.merchant.pending_settlement || 0
        merchantInfo.settlement_account = data.merchant.settlement_account || ''
        merchantInfo.settlement_bank = data.merchant.settlement_bank || ''
      }
      profitSharings.value = data.recent_profit_sharings || []
    }
  } catch (error) {
    console.error('Load balance error:', error)
  } finally {
    loading.value = false
  }
}

function showPayoutDialog() {
  payoutForm.amount = balanceData.available
  payoutDialogVisible.value = true
}

async function submitPayout() {
  if (!payoutFormRef.value) return
  
  await payoutFormRef.value.validate(async (valid) => {
    if (valid) {
      payoutLoading.value = true
      try {
        await ElMessageBox.confirm(
          `确认打款 ¥${payoutForm.amount} 元？`,
          '打款确认',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await api.post('/v1/merchant/payout', {
          amount: payoutForm.amount
        })
        
        if (response.success) {
          ElMessage.success('打款申请已提交')
          payoutDialogVisible.value = false
          loadBalance()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Payout error:', error)
        }
      } finally {
        payoutLoading.value = false
      }
    }
  })
}

onMounted(() => {
  loadBalance()
})
</script>

<style scoped>
.balance-container {
  width: 100%;
}

.balance-card {
  text-align: center;
  padding: 20px;
}

.balance-card.available {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.balance-card.frozen {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.balance-card.pending {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.balance-header {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 10px;
}

.balance-value {
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.highlight {
  color: #67c23a;
  font-weight: bold;
}
</style>
