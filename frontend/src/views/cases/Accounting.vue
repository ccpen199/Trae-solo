<template>
  <div class="accounting-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <el-button type="info" size="small" @click="router.back()" style="margin-right: 12px;">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="page-title">账务管理</span>
          </div>
          <el-button type="primary" @click="showCreate = true">
            <el-icon><Plus /></el-icon>
            新增交易
          </el-button>
        </div>
      </template>
      
      <el-row :gutter="24" style="margin-bottom: 24px;">
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card income">
            <div class="stat-icon">
              <el-icon size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">已确认收入</div>
              <div class="stat-value">{{ formatMoney(profitData.totalIncome) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card expense">
            <div class="stat-icon">
              <el-icon size="32"><Wallet /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">已确认支出</div>
              <div class="stat-value">{{ formatMoney(profitData.totalExpense) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card profit">
            <div class="stat-icon">
              <el-icon size="32"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">当前利润</div>
              <div class="stat-value" :class="{ 'negative': profitData.profit < 0 }">
                {{ formatMoney(profitData.profit) }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部交易" name="all">
          <transaction-table 
            :transactions="transactions" 
            :loading="loading"
            @confirm="confirmTransaction"
            @refresh="loadData"
          />
        </el-tab-pane>
        <el-tab-pane label="收入" name="income">
          <transaction-table 
            :transactions="incomeTransactions" 
            :loading="loading"
            @confirm="confirmTransaction"
            @refresh="loadData"
          />
        </el-tab-pane>
        <el-tab-pane label="支出" name="expense">
          <transaction-table 
            :transactions="expenseTransactions" 
            :loading="loading"
            @confirm="confirmTransaction"
            @refresh="loadData"
          />
        </el-tab-pane>
      </el-tabs>
      
      <div class="action-buttons" v-if="userStore.isLeadLawyer">
        <el-button type="warning" @click="calculateProfit">
          <el-icon><Calculator /></el-icon>
          重新计算利润
        </el-button>
        <el-button type="danger" @click="closeCase">
          <el-icon><Check /></el-icon>
          结案
        </el-button>
      </div>
    </el-card>
    
    <el-dialog v-model="showCreate" title="新增交易记录" width="500px">
      <el-form :model="transactionForm" label-width="100px">
        <el-form-item label="交易类型">
          <el-radio-group v-model="transactionForm.type">
            <el-radio value="income">收入</el-radio>
            <el-radio value="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number 
            v-model="transactionForm.amount" 
            :min="0" 
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="transactionForm.category" placeholder="请选择类别" style="width: 100%">
            <el-option label="律师费" value="lawyer_fee" v-if="transactionForm.type === 'income'" />
            <el-option label="代理费" value="agency_fee" v-if="transactionForm.type === 'income'" />
            <el-option label="其他收入" value="other_income" v-if="transactionForm.type === 'income'" />
            <el-option label="诉讼费" value="court_fee" v-if="transactionForm.type === 'expense'" />
            <el-option label="差旅费" value="travel_fee" v-if="transactionForm.type === 'expense'" />
            <el-option label="办公费" value="office_fee" v-if="transactionForm.type === 'expense'" />
            <el-option label="其他支出" value="other_expense" v-if="transactionForm.type === 'expense'" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="transactionForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入交易描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createTransaction">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElTag, ElButton } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { accountingApi } from '../../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const caseId = computed(() => route.params.id)
const loading = ref(false)
const creating = ref(false)
const activeTab = ref('all')
const showCreate = ref(false)
const transactions = ref([])
const profitData = ref({ totalIncome: 0, totalExpense: 0, profit: 0 })

const transactionForm = ref({
  type: 'income',
  amount: 0,
  category: '',
  description: ''
})

const TransactionTable = defineComponent({
  name: 'TransactionTable',
  props: {
    transactions: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  emits: ['confirm', 'refresh'],
  setup(props, { emit }) {
    const userStore = useUserStore()
    
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '-'
      return new Date(dateStr).toLocaleString('zh-CN')
    }
    
    const formatMoney = (amount) => {
      if (amount == null) return '¥ 0.00'
      return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
    }
    
    const handleConfirm = (row) => {
      emit('confirm', row)
    }
    
    return () => h('div', [
      h('el-table', {
        data: props.transactions,
        vLoading: props.loading,
        style: 'width: 100%'
      }, {
        default: () => [
          h('el-table-column', { prop: 'type', label: '类型', width: 100 }, {
            default: ({ row }) => h(ElTag, {
              type: row.type === 'income' ? 'success' : 'danger',
              size: 'small'
            }, { default: () => row.type === 'income' ? '收入' : '支出' })
          }),
          h('el-table-column', { prop: 'amount', label: '金额', width: 150 }, {
            default: ({ row }) => h('span', {
              style: row.type === 'income' ? 'color: #67c23a' : 'color: #f56c6c'
            }, formatMoney(row.amount))
          }),
          h('el-table-column', { prop: 'category', label: '类别', width: 120 }, {
            default: ({ row }) => row.category || '-'
          }),
          h('el-table-column', { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true }),
          h('el-table-column', { prop: 'recorder_name', label: '录入人', width: 100 }),
          h('el-table-column', { prop: 'created_at', label: '录入时间', width: 160 }, {
            default: ({ row }) => formatDateTime(row.created_at)
          }),
          h('el-table-column', { prop: 'confirmed_at', label: '确认状态', width: 120 }, {
            default: ({ row }) => row.confirmed_at 
              ? h(ElTag, { type: 'success', size: 'small' }, { default: () => '已确认' })
              : h(ElTag, { type: 'info', size: 'small' }, { default: () => '待确认' })
          }),
          h('el-table-column', { label: '操作', width: 120, fixed: 'right' }, {
            default: ({ row }) => !row.confirmed_at && userStore.isFinance
              ? h(ElButton, {
                  size: 'small',
                  type: 'primary',
                  text: true,
                  onClick: () => handleConfirm(row)
                }, { default: () => '确认' })
              : null
          })
        ]
      }),
      props.transactions.length === 0 && !props.loading
        ? h('el-empty', { description: '暂无交易记录' })
        : null
    ])
  }
})

const incomeTransactions = computed(() => transactions.value.filter(t => t.type === 'income'))
const expenseTransactions = computed(() => transactions.value.filter(t => t.type === 'expense'))

const formatMoney = (amount) => {
  if (amount == null) return '¥ 0.00'
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const loadData = async () => {
  loading.value = true
  try {
    [transactions.value, profitData.value] = await Promise.all([
      accountingApi.getTransactions(caseId.value),
      accountingApi.getProfit(caseId.value)
    ])
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const calculateProfit = async () => {
  try {
    profitData.value = await accountingApi.getProfit(caseId.value)
    ElMessage.success('利润计算完成')
  } catch (e) {
    console.error(e)
  }
}

const createTransaction = async () => {
  if (!transactionForm.value.amount) {
    ElMessage.warning('请输入金额')
    return
  }

  creating.value = true
  try {
    await accountingApi.createTransaction(caseId.value, {
      type: transactionForm.value.type,
      amount: transactionForm.value.amount,
      category: transactionForm.value.category,
      description: transactionForm.value.description
    })
    ElMessage.success('交易记录创建成功')
    showCreate.value = false
    transactionForm.value = { type: 'income', amount: 0, category: '', description: '' }
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    creating.value = false
  }
}

const confirmTransaction = async (row) => {
  try {
    await ElMessageBox.confirm(`确认该${row.type === 'income' ? '收入' : '支出'}记录吗？确认后将不可撤销。`, '确认交易', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await accountingApi.confirmTransaction(row.id)
    ElMessage.success('交易已确认')
    loadData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const closeCase = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结案吗？结案后将计算最终利润并锁定案件，之后无法再添加交易记录。',
      '结案确认',
      {
        confirmButtonText: '确认结案',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await accountingApi.closeCase(caseId.value)
    ElMessage.success('案件已结案')
    loadData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.accounting-page {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
}

.stat-card.income .stat-icon { color: #67c23a; }
.stat-card.expense .stat-icon { color: #f56c6c; }
.stat-card.profit .stat-icon { color: #409eff; }

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.stat-value.negative {
  color: #f56c6c;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
