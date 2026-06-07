<template>
  <div class="transactions-page">
    <el-card class="reconciliation-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">资金对账概览</span>
          <el-radio-group v-model="reconciliationPeriod" size="small" @change="calculateReconciliation">
            <el-radio-button value="today">今日</el-radio-button>
            <el-radio-button value="week">本周</el-radio-button>
            <el-radio-button value="month">本月</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="reconciliation-item">
            <div class="reconciliation-label">总收入</div>
            <div class="reconciliation-value income">¥{{ reconciliationSummary.totalIn.toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="reconciliation-item">
            <div class="reconciliation-label">总支出</div>
            <div class="reconciliation-value expense">¥{{ reconciliationSummary.totalOut.toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="reconciliation-item">
            <div class="reconciliation-label">净流量</div>
            <div class="reconciliation-value" :class="reconciliationSummary.netFlow >= 0 ? 'income' : 'expense'">
              {{ reconciliationSummary.netFlow >= 0 ? '+' : '' }}¥{{ reconciliationSummary.netFlow.toFixed(2) }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="reconciliation-item">
            <div class="reconciliation-label">交易笔数</div>
            <div class="reconciliation-value">{{ reconciliationSummary.count }} 笔</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span class="header-title">交易流水</span>
          <el-button type="primary" size="small" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="交易类型">
          <el-select v-model="queryForm.type" placeholder="全部" clearable style="width: 160px">
            <el-option label="全部" value="" />
            <el-option label="充值" value="recharge" />
            <el-option label="提现" value="withdraw" />
            <el-option label="担保冻结" value="escrow_freeze" />
            <el-option label="担保释放" value="escrow_release" />
            <el-option label="平台服务费" value="platform_fee" />
            <el-option label="保险费" value="insurance_fee" />
            <el-option label="司机收入" value="driver_income" />
            <el-option label="佣金" value="commission" />
            <el-option label="支付" value="payment" />
            <el-option label="结算" value="settlement" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchTransactions">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table 
        :data="transactions" 
        v-loading="loading" 
        border 
        class="transactions-table"
        @row-click="showTransactionDetail"
        style="cursor: pointer"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="transaction_no" label="交易号" width="200" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="130">
          <template #default="{ row }">
            <span :class="getAmountClass(row.type, row.amount)">
              {{ getAmountPrefix(row.type, row.amount) }}¥{{ Math.abs(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_before" label="变动前余额" width="140">
          <template #default="{ row }">¥{{ row.balance_before?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="balance_after" label="变动后余额" width="140">
          <template #default="{ row }">¥{{ row.balance_after?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="running_balance" label="累计余额" width="130">
          <template #default="{ row }">¥{{ row.running_balance?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="showTransactionDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchTransactions"
        @current-change="fetchTransactions"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="交易详情" width="560px">
      <el-descriptions :column="2" border v-if="selectedTransaction">
        <el-descriptions-item label="交易号" :span="2">
          {{ selectedTransaction.transaction_no }}
        </el-descriptions-item>
        <el-descriptions-item label="交易类型">
          <el-tag :type="getTypeTag(selectedTransaction.type)" size="small">
            {{ getTypeText(selectedTransaction.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="交易状态">
          <el-tag :type="getStatusTag(selectedTransaction.status)" size="small">
            {{ getStatusText(selectedTransaction.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="交易金额">
          <span :class="getAmountClass(selectedTransaction.type, selectedTransaction.amount)" style="font-size: 18px; font-weight: 600">
            {{ getAmountPrefix(selectedTransaction.type, selectedTransaction.amount) }}¥{{ Math.abs(selectedTransaction.amount).toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="变动前余额">
          ¥{{ selectedTransaction.balance_before?.toFixed(2) || '0.00' }}
        </el-descriptions-item>
        <el-descriptions-item label="变动后余额">
          ¥{{ selectedTransaction.balance_after?.toFixed(2) || '0.00' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ selectedTransaction.created_at }}
        </el-descriptions-item>
        <el-descriptions-item label="关联单号" v-if="selectedTransaction.related_no" :span="2">
          {{ selectedTransaction.related_no }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ selectedTransaction.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { paymentApi } from '../../api'

const loading = ref(false)
const transactions = ref([])
const total = ref(0)
const detailDialogVisible = ref(false)
const selectedTransaction = ref(null)
const reconciliationPeriod = ref('today')

const queryForm = reactive({
  type: '',
  dateRange: null,
  page: 1,
  page_size: 20
})

const reconciliationSummary = reactive({
  totalIn: 0,
  totalOut: 0,
  netFlow: 0,
  count: 0
})

const typeMap = {
  recharge: { text: '充值', tag: 'success', isIncome: true },
  withdraw: { text: '提现', tag: 'info', isIncome: false },
  escrow_freeze: { text: '担保冻结', tag: 'warning', isIncome: false, isFrozen: true },
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
  if (typeMap[type]?.isFrozen) return 'amount-frozen'
  if (typeMap[type]?.isIncome || amount > 0) return 'amount-positive'
  return 'amount-negative'
}

function getAmountPrefix(type, amount) {
  if (typeMap[type]?.isFrozen) return ''
  if (typeMap[type]?.isIncome || amount > 0) return '+'
  return ''
}

function getStatusTag(status) {
  const map = {
    completed: 'success',
    pending: 'warning',
    failed: 'danger',
    processing: 'info'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    completed: '已完成',
    pending: '处理中',
    failed: '失败',
    processing: '处理中'
  }
  return map[status] || status
}

function calculateReconciliation() {
  const filteredTransactions = filterByPeriod(transactions.value)
  reconciliationSummary.count = filteredTransactions.length
  reconciliationSummary.totalIn = filteredTransactions
    .filter(t => typeMap[t.type]?.isIncome || t.amount > 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  reconciliationSummary.totalOut = filteredTransactions
    .filter(t => !typeMap[t.type]?.isIncome && t.amount <= 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  reconciliationSummary.netFlow = reconciliationSummary.totalIn - reconciliationSummary.totalOut
}

function filterByPeriod(transList) {
  const now = new Date()
  let startDate
  
  switch (reconciliationPeriod.value) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    default:
      return transList
  }
  
  return transList.filter(t => {
    const transDate = new Date(t.created_at)
    return transDate >= startDate && transDate <= now
  })
}

function calculateRunningBalance(transList) {
  let balance = 0
  return [...transList].reverse().map(t => {
    balance += t.amount
    return { ...t, running_balance: balance }
  }).reverse()
}

async function fetchTransactions() {
  loading.value = true
  try {
    const params = { ...queryForm }
    if (!params.type) delete params.type
    if (params.dateRange) {
      params.start_date = params.dateRange[0]
      params.end_date = params.dateRange[1]
      delete params.dateRange
    }
    const res = await paymentApi.getTransactions(params)
    if (res.data?.list) {
      transactions.value = calculateRunningBalance(res.data.list)
      total.value = res.data.total || 0
    } else {
      const mockData = generateMockTransactions()
      transactions.value = calculateRunningBalance(mockData)
      total.value = mockData.length
    }
    calculateReconciliation()
  } catch (e) {
    const mockData = generateMockTransactions()
    transactions.value = calculateRunningBalance(mockData)
    total.value = mockData.length
    calculateReconciliation()
  } finally {
    loading.value = false
  }
}

function generateMockTransactions() {
  const types = Object.keys(typeMap)
  const transactions = []
  let balance = 50000
  
  for (let i = 0; i < 30; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const amount = Math.floor(Math.random() * 3000) + 100
    const signedAmount = typeMap[type]?.isIncome ? amount : -amount
    const balanceBefore = balance
    balance += signedAmount
    
    transactions.push({
      transaction_no: `TXN${Date.now()}${i}`,
      type,
      amount: signedAmount,
      balance_before: balanceBefore,
      balance_after: balance,
      status: i < 2 ? 'pending' : 'completed',
      created_at: new Date(Date.now() - i * 3600000 * Math.random() * 24).toLocaleString(),
      remark: `${typeMap[type]?.text || type}交易`,
      related_no: `WB${Math.floor(Math.random() * 100000)}`
    })
  }
  return transactions
}

function resetQuery() {
  queryForm.type = ''
  queryForm.dateRange = null
  queryForm.page = 1
  fetchTransactions()
}

function showTransactionDetail(row) {
  selectedTransaction.value = row
  detailDialogVisible.value = true
}

function handleExport() {
  ElMessage.success('导出功能演示 - 数据已准备好')
  console.log('Exporting transactions:', transactions.value)
}

onMounted(() => {
  fetchTransactions()
})
</script>

<style scoped>
.transactions-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reconciliation-card {
  border: none;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.reconciliation-card .header-title {
  font-weight: 600;
  font-size: 16px;
}

.reconciliation-item {
  text-align: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.reconciliation-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.reconciliation-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.reconciliation-value.income {
  color: #67c23a;
}

.reconciliation-value.expense {
  color: #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.query-form {
  margin-bottom: 20px;
}

.transactions-table :deep(.el-table__row:hover) {
  background-color: #ecf5ff !important;
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

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
  display: flex;
}
</style>
