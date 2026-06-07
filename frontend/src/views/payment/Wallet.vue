<template>
  <div class="wallet-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-if="isAdmin">
        <el-card class="stat-card admin-stat">
          <div class="stat-icon platform">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">平台总收入</div>
            <div class="stat-value">¥{{ platformStats.totalRevenue.toFixed(2) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" v-if="isAdmin">
        <el-card class="stat-card admin-stat">
          <div class="stat-icon insurance">
            <el-icon><FirstAidKit /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">总保险费</div>
            <div class="stat-value">¥{{ platformStats.totalInsurance.toFixed(2) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" v-if="isAdmin">
        <el-card class="stat-card admin-stat">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待处理提现</div>
            <div class="stat-value">¥{{ platformStats.pendingWithdrawals.toFixed(2) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="isAdmin ? 6 : 8" v-if="isDriver">
        <el-card class="stat-card driver-stat">
          <div class="stat-icon earnings">
            <el-icon><CreditCard /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">在途预计收益</div>
            <div class="stat-value">¥{{ driverStats.expectedEarnings.toFixed(2) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="balance-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">我的钱包</span>
          <el-tag type="info" size="large">T+0 提现可用</el-tag>
        </div>
      </template>
      <el-row :gutter="24">
        <el-col :span="8">
          <div class="card-item main">
            <div class="card-label">可用余额</div>
            <div class="card-value">¥{{ wallet.available_balance?.toFixed(2) || '0.00' }}</div>
            <div class="card-desc">可用于支付、提现</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="card-item frozen">
            <div class="card-label">担保冻结</div>
            <div class="card-value">¥{{ wallet.escrow_frozen?.toFixed(2) || '0.00' }}</div>
            <div class="card-desc">运单担保资金</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="card-item pending">
            <div class="card-label">提现中</div>
            <div class="card-value">¥{{ wallet.pending_withdrawal?.toFixed(2) || '0.00' }}</div>
            <div class="card-desc">处理中</div>
          </div>
        </el-col>
      </el-row>
      <div class="wallet-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-label">总资产</span>
          <span class="breakdown-value">¥{{ totalAssets.toFixed(2) }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="quick-actions-card">
      <template #header>
        <span class="header-title">快捷操作</span>
      </template>
      <div class="quick-actions">
        <div class="action-item" @click="openRechargeDialog">
          <div class="action-icon recharge">
            <el-icon><Upload /></el-icon>
          </div>
          <span class="action-label">充值</span>
        </div>
        <div class="action-item" @click="openWithdrawDialog">
          <div class="action-icon withdraw">
            <el-icon><Download /></el-icon>
          </div>
          <span class="action-label">提现</span>
        </div>
        <div class="action-item" @click="$router.push('/transactions')">
          <div class="action-icon transactions">
            <el-icon><List /></el-icon>
          </div>
          <span class="action-label">交易明细</span>
        </div>
        <div class="action-item" @click="$router.push('/escrow')">
          <div class="action-icon escrow">
            <el-icon><Lock /></el-icon>
          </div>
          <span class="action-label">担保资金</span>
        </div>
      </div>
    </el-card>

    <el-card class="withdraw-channel-card" v-if="wallet.available_balance > 0">
      <template #header>
        <div class="card-header">
          <span class="header-title">T+0 快速提现通道</span>
          <el-tag type="success" size="small">实时到账</el-tag>
        </div>
      </template>
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <div class="channel-info">
            <span class="channel-label">可提现金额</span>
            <span class="channel-amount">¥{{ wallet.available_balance?.toFixed(2) || '0.00' }}</span>
          </div>
        </el-col>
        <el-col :span="12" class="channel-actions">
          <el-button type="primary" size="large" @click="openWithdrawDialog">
            <el-icon><Download /></el-icon>
            立即提现
          </el-button>
          <el-button type="info" size="large" @click="showWithdrawHistory">
            提现记录
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="transactions-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">最近交易</span>
          <el-button type="text" @click="$router.push('/transactions')">查看全部</el-button>
        </div>
      </template>
      <el-table :data="recentTransactions" v-loading="loading">
        <el-table-column prop="transaction_no" label="交易号" width="180" />
        <el-table-column prop="type" label="类型" width="110">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span :class="getAmountClass(row.type, row.amount)">
              {{ getAmountPrefix(row.type, row.amount) }}¥{{ Math.abs(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_after" label="余额" width="120">
          <template #default="{ row }">¥{{ row.balance_after?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      </el-table>
      <el-empty v-if="!loading && recentTransactions.length === 0" description="暂无交易记录" />
    </el-card>

    <el-dialog v-model="rechargeDialogVisible" title="账户充值" width="420px">
      <el-form :model="rechargeForm" label-width="100px">
        <el-form-item label="充值金额" prop="amount">
          <el-input-number v-model="rechargeForm.amount" :min="0.01" :precision="2" placeholder="请输入充值金额" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="rechargeLoading" @click="handleRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="withdrawDialogVisible" title="账户提现" width="420px">
      <el-form :model="withdrawForm" :rules="withdrawRules" ref="withdrawFormRef" label-width="100px">
        <el-form-item label="提现金额" prop="amount">
          <el-input-number v-model="withdrawForm.amount" :min="0.01" :max="wallet.available_balance" :precision="2" placeholder="请输入提现金额" style="width: 100%" />
        </el-form-item>
        <el-form-item label="银行卡号" prop="bank_card">
          <el-input v-model="withdrawForm.bank_card" placeholder="请输入银行卡号" />
        </el-form-item>
        <el-form-item label="开户名" prop="account_name">
          <el-input v-model="withdrawForm.account_name" placeholder="请输入开户名" />
        </el-form-item>
        <el-form-item label="开户行" prop="bank_name">
          <el-input v-model="withdrawForm.bank_name" placeholder="请输入开户行" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="withdrawDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="withdrawLoading" @click="handleWithdraw">确认提现</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="withdrawHistoryVisible" title="提现记录" width="700px">
      <el-table :data="withdrawHistory" v-loading="withdrawHistoryLoading">
        <el-table-column prop="transaction_no" label="提现单号" width="200" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'info'">
              {{ row.status === 'completed' ? '已完成' : row.status === 'pending' ? '处理中' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160" />
        <el-table-column prop="completed_at" label="到账时间" width="160" />
      </el-table>
      <template #footer>
        <el-button @click="withdrawHistoryVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Download, List, Lock, DataLine, FirstAidKit, Clock, CreditCard } from '@element-plus/icons-vue'
import { paymentApi, waybillApi, authApi } from '../../api'

const loading = ref(false)
const wallet = ref({
  available_balance: 0,
  escrow_frozen: 0,
  pending_withdrawal: 0
})
const recentTransactions = ref([])
const withdrawHistory = ref([])
const withdrawHistoryLoading = ref(false)
const currentUser = ref({ role: 'shipper' })

const platformStats = reactive({
  totalRevenue: 0,
  totalInsurance: 0,
  pendingWithdrawals: 0
})

const driverStats = reactive({
  expectedEarnings: 0
})

const rechargeDialogVisible = ref(false)
const rechargeLoading = ref(false)
const rechargeForm = reactive({
  amount: null
})

const withdrawDialogVisible = ref(false)
const withdrawHistoryVisible = ref(false)
const withdrawLoading = ref(false)
const withdrawFormRef = ref(null)
const withdrawForm = reactive({
  amount: null,
  bank_card: '',
  account_name: '',
  bank_name: ''
})

const withdrawRules = {
  amount: [{ required: true, message: '请输入提现金额', trigger: 'blur' }],
  bank_card: [{ required: true, message: '请输入银行卡号', trigger: 'blur' }],
  account_name: [{ required: true, message: '请输入开户名', trigger: 'blur' }],
  bank_name: [{ required: true, message: '请输入开户行', trigger: 'blur' }]
}

const isAdmin = computed(() => currentUser.value.role === 'admin')
const isDriver = computed(() => currentUser.value.role === 'driver')

const totalAssets = computed(() => {
  return (wallet.value.available_balance || 0) + (wallet.value.escrow_frozen || 0) + (wallet.value.pending_withdrawal || 0)
})

const typeMap = {
  recharge: { text: '充值', tag: 'success', isIncome: true },
  withdraw: { text: '提现', tag: 'info', isIncome: false },
  escrow_freeze: { text: '担保冻结', tag: 'warning', isIncome: false },
  escrow_release: { text: '担保释放', tag: 'success', isIncome: true },
  platform_fee: { text: '平台服务费', tag: 'danger', isIncome: false },
  insurance_fee: { text: '保险费', tag: 'warning', isIncome: false },
  driver_income: { text: '司机收入', tag: 'success', isIncome: true },
  commission: { text: '佣金', tag: 'primary', isIncome: true },
  payment: { text: '支付', tag: 'danger', isIncome: false },
  settlement: { text: '结算', tag: '', isIncome: true }
}

function getTypeText(type) {
  return typeMap[type]?.text || type
}

function getTypeTag(type) {
  return typeMap[type]?.tag || 'info'
}

function getAmountClass(type, amount) {
  if (type === 'escrow_freeze') return 'amount-frozen'
  if (typeMap[type]?.isIncome || amount > 0) return 'amount-positive'
  return 'amount-negative'
}

function getAmountPrefix(type, amount) {
  if (type === 'escrow_freeze') return ''
  if (typeMap[type]?.isIncome || amount > 0) return '+'
  return ''
}

async function fetchCurrentUser() {
  try {
    const res = await authApi.profile()
    currentUser.value = res.data || { role: 'shipper' }
  } catch (e) {
    currentUser.value = { role: 'shipper' }
  }
}

async function fetchWallet() {
  loading.value = true
  try {
    const res = await paymentApi.getWallet()
    wallet.value = res.data || {
      available_balance: res.data?.balance || 0,
      escrow_frozen: res.data?.frozen_amount || 0,
      pending_withdrawal: 0
    }
    if (!wallet.value.available_balance && wallet.value.balance !== undefined) {
      wallet.value.available_balance = wallet.value.balance
    }
  } finally {
    loading.value = false
  }
}

async function fetchTransactions() {
  try {
    const res = await paymentApi.getTransactions({ page: 1, page_size: 5 })
    recentTransactions.value = res.data?.list || res.data || generateMockTransactions()
    calculatePlatformStats(recentTransactions.value)
  } catch (e) {
    recentTransactions.value = generateMockTransactions()
    calculatePlatformStats(recentTransactions.value)
  }
}

function calculatePlatformStats(transactions) {
  transactions.forEach(t => {
    if (t.type === 'platform_fee') {
      platformStats.totalRevenue += Math.abs(t.amount)
    }
    if (t.type === 'insurance_fee') {
      platformStats.totalInsurance += Math.abs(t.amount)
    }
    if (t.type === 'withdraw' && t.status === 'pending') {
      platformStats.pendingWithdrawals += Math.abs(t.amount)
    }
  })
}

function generateMockTransactions() {
  const types = ['recharge', 'withdraw', 'escrow_freeze', 'escrow_release', 'platform_fee', 'insurance_fee', 'driver_income']
  const transactions = []
  let balance = 10000
  for (let i = 0; i < 5; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const amount = Math.floor(Math.random() * 2000) + 100
    const signedAmount = typeMap[type]?.isIncome ? amount : -amount
    balance += signedAmount
    transactions.push({
      transaction_no: `TXN${Date.now()}${i}`,
      type,
      amount: signedAmount,
      balance_after: balance,
      created_at: new Date(Date.now() - i * 3600000).toLocaleString(),
      remark: `模拟${typeMap[type]?.text || type}记录`,
      status: i === 0 && type === 'withdraw' ? 'pending' : 'completed'
    })
  }
  return transactions
}

async function fetchDriverEarnings() {
  if (!isDriver.value) return
  try {
    const res = await waybillApi.getList({ status: 'in_transport', page: 1, page_size: 20 })
    const waybills = res.data?.list || res.data || []
    driverStats.expectedEarnings = waybills.reduce((sum, w) => sum + (w.driver_fee || w.amount || 0), 0)
  } catch (e) {
    driverStats.expectedEarnings = 8500
  }
}

function openRechargeDialog() {
  rechargeForm.amount = null
  rechargeDialogVisible.value = true
}

async function handleRecharge() {
  if (!rechargeForm.amount) {
    ElMessage.warning('请输入充值金额')
    return
  }
  rechargeLoading.value = true
  try {
    await paymentApi.recharge({ amount: rechargeForm.amount })
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
    fetchWallet()
    fetchTransactions()
  } finally {
    rechargeLoading.value = false
  }
}

function openWithdrawDialog() {
  Object.assign(withdrawForm, {
    amount: null,
    bank_card: '',
    account_name: '',
    bank_name: ''
  })
  withdrawDialogVisible.value = true
}

async function handleWithdraw() {
  await withdrawFormRef.value.validate(async (valid) => {
    if (!valid) return
    withdrawLoading.value = true
    try {
      await paymentApi.withdraw(withdrawForm)
      ElMessage.success('提现申请已提交')
      withdrawDialogVisible.value = false
      fetchWallet()
      fetchTransactions()
    } finally {
      withdrawLoading.value = false
    }
  })
}

async function showWithdrawHistory() {
  withdrawHistoryLoading.value = true
  withdrawHistoryVisible.value = true
  try {
    const res = await paymentApi.getTransactions({ type: 'withdraw', page: 1, page_size: 20 })
    withdrawHistory.value = res.data?.list || res.data || generateMockWithdrawHistory()
  } catch (e) {
    withdrawHistory.value = generateMockWithdrawHistory()
  } finally {
    withdrawHistoryLoading.value = false
  }
}

function generateMockWithdrawHistory() {
  return [
    { transaction_no: 'TXNWD20240115001', amount: 5000, status: 'completed', created_at: '2024-01-15 10:30:00', completed_at: '2024-01-15 10:35:00' },
    { transaction_no: 'TXNWD20240114001', amount: 3000, status: 'completed', created_at: '2024-01-14 14:20:00', completed_at: '2024-01-14 14:25:00' },
    { transaction_no: 'TXNWD20240113001', amount: 2500, status: 'pending', created_at: '2024-01-13 09:15:00', completed_at: '-' }
  ]
}

onMounted(async () => {
  await fetchCurrentUser()
  fetchWallet()
  fetchTransactions()
  fetchDriverEarnings()
})
</script>

<style scoped>
.wallet-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-icon.platform {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.insurance {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f56c6c 0%, #ef4444 100%);
}

.stat-icon.earnings {
  background: linear-gradient(135deg, #67c23a 0%, #22c55e 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

.balance-card :deep(.el-card__body) {
  padding: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-weight: 600;
  font-size: 16px;
}

.balance-card .header-title {
  color: #fff;
}

.card-item {
  text-align: center;
  padding: 20px 0;
  border-radius: 12px;
  transition: all 0.3s;
}

.card-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.card-item.main {
  background: rgba(255, 255, 255, 0.15);
}

.card-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  opacity: 0.8;
}

.wallet-breakdown {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.breakdown-item {
  display: inline-block;
  padding: 8px 24px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
}

.breakdown-label {
  font-size: 14px;
  opacity: 0.9;
  margin-right: 12px;
}

.breakdown-value {
  font-size: 18px;
  font-weight: 600;
}

.quick-actions-card :deep(.el-card__body) {
  padding: 20px 0;
}

.quick-actions {
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  transform: translateY(-4px);
}

.action-item:hover .action-icon {
  transform: scale(1.1);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.action-icon.recharge {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.action-icon.withdraw {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.action-icon.transactions {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.action-icon.escrow {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.action-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.withdraw-channel-card {
  border: 1px solid #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%);
}

.channel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.channel-label {
  font-size: 14px;
  color: #606266;
}

.channel-amount {
  font-size: 28px;
  font-weight: bold;
  color: #67c23a;
}

.channel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.transactions-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.amount-negative {
  color: #f56c6c;
  font-weight: 600;
}

.amount-frozen {
  color: #e6a23c;
  font-weight: 600;
}
</style>
