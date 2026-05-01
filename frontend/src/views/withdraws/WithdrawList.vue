<template>
  <div class="withdraws-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>提现记录</span>
          <el-button type="primary" @click="showCreateDialog = true">发起提现</el-button>
        </div>
      </template>

      <el-table :data="withdraws" style="width: 100%">
        <el-table-column prop="withdrawNo" label="提现单号" width="200" />
        <el-table-column prop="amount" label="提现金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ (row.amount / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="手续费" width="100">
          <template #default="{ row }">
            ¥{{ (row.fee / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实发金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ (row.actualAmount / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收款信息">
          <template #default="{ row }">
            <div v-if="row.alipayAccount">
              支付宝: {{ row.alipayAccount }}
            </div>
            <div v-else-if="row.bankAccount">
              {{ row.bankName }} ({{ row.bankAccount }})
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="showCreateDialog" title="发起提现" width="500px">
      <el-form :model="withdrawForm" label-width="100px">
        <el-form-item label="可提现余额">
          <span class="available-balance">{{ formatAmount(availableBalance) }}</span>
        </el-form-item>
        <el-form-item label="提现金额" required>
          <el-input-number
            v-model="withdrawForm.amount"
            :precision="2"
            :min="1"
            :max="availableBalance / 100"
            :controls="false"
            style="width: 100%"
          />
          <div class="tip-text">最低提现1元，最高{{ formatAmount(availableBalance) }}</div>
        </el-form-item>
        <el-form-item label="提现方式" required>
          <el-select v-model="withdrawForm.method" style="width: 100%">
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="bank" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款账号" v-if="withdrawForm.method === 'alipay'" required>
          <el-input v-model="withdrawForm.alipayAccount" placeholder="请输入支付宝账号" />
        </el-form-item>
        <template v-if="withdrawForm.method === 'bank'">
          <el-form-item label="开户银行" required>
            <el-input v-model="withdrawForm.bankName" placeholder="请输入开户银行" />
          </el-form-item>
          <el-form-item label="银行卡号" required>
            <el-input v-model="withdrawForm.bankAccount" placeholder="请输入银行卡号" />
          </el-form-item>
          <el-form-item label="开户人姓名" required>
            <el-input v-model="withdrawForm.bankAccountName" placeholder="请输入开户人姓名" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitWithdraw">确认提现</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const withdraws = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showCreateDialog = ref(false)
const submitLoading = ref(false)
const availableBalance = ref(0)

const withdrawForm = reactive({
  amount: 0,
  method: 'alipay',
  alipayAccount: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
})

function formatAmount(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`
}

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    PENDING_REVIEW: 'warning',
    APPROVED: 'primary',
    REJECTED: 'danger',
    PENDING_PAYMENT: 'info',
    PAID: 'success',
    FAILED: 'danger',
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    PENDING_REVIEW: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    PENDING_PAYMENT: '待打款',
    PAID: '已到账',
    FAILED: '打款失败',
  }
  return map[status] || status
}

async function fetchStats() {
  try {
    const result = await api.get('/commissions/stats')
    if (result.success) {
      availableBalance.value = result.data.availableBalance
    }
  } catch (e) {
    console.error('获取余额失败', e)
  }
}

async function fetchWithdraws() {
  try {
    const result = await api.get('/withdraws')
    if (result.success) {
      withdraws.value = result.data || []
      total.value = result.total || 0
    }
  } catch (e) {
    console.error('获取提现记录失败', e)
  }
}

function viewDetail(row: any) {
  ElMessage.info(`查看提现详情: ${row.withdrawNo}`)
}

async function submitWithdraw() {
  if (withdrawForm.amount <= 0) {
    ElMessage.warning('请输入提现金额')
    return
  }

  const params: any = {
    amount: Math.floor(withdrawForm.amount * 100),
    withdrawMethod: withdrawForm.method,
  }

  if (withdrawForm.method === 'alipay') {
    if (!withdrawForm.alipayAccount) {
      ElMessage.warning('请输入支付宝账号')
      return
    }
    params.alipayInfo = { account: withdrawForm.alipayAccount }
  } else {
    if (!withdrawForm.bankName || !withdrawForm.bankAccount || !withdrawForm.bankAccountName) {
      ElMessage.warning('请填写完整的银行卡信息')
      return
    }
    params.bankInfo = {
      bankName: withdrawForm.bankName,
      bankAccount: withdrawForm.bankAccount,
      bankAccountName: withdrawForm.bankAccountName,
    }
  }

  submitLoading.value = true
  try {
    const result = await api.post('/withdraws', params)
    if (result.success) {
      ElMessage.success(result.message || '提现申请提交成功')
      showCreateDialog.value = false
      fetchStats()
      fetchWithdraws()
      withdrawForm.amount = 0
      withdrawForm.alipayAccount = ''
      withdrawForm.bankName = ''
      withdrawForm.bankAccount = ''
      withdrawForm.bankAccountName = ''
    }
  } catch (e) {
    console.error('提现失败', e)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchStats()
  fetchWithdraws()
})
</script>

<style scoped>
.withdraws-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}

.available-balance {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
