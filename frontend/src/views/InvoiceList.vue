<template>
  <div class="invoice-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>发票列表</span>
          <div>
            <el-button 
              v-if="userStore.isCustomer" 
              type="primary" 
              @click="$router.push('/invoices/new')"
            >
              <el-icon><Plus /></el-icon>
              新建开票申请
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="待开票" value="pending" />
            <el-option label="已开票" value="issued" />
            <el-option label="已交付" value="delivered" />
            <el-option label="已结票" value="settled" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已红冲" value="red_credited" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="filters.order_no" placeholder="输入订单号" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="invoices" v-loading="loading" style="width: 100%">
        <el-table-column prop="invoice_no" label="发票号码" width="180">
          <template #default="{ row }">
            <span v-if="row.invoice_no" class="invoice-no">{{ row.invoice_no }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="关联订单" width="150" />
        <el-table-column prop="customer_name" label="客户名称" width="150" />
        <el-table-column prop="invoice_title" label="发票抬头" min-width="180" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ formatAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="`status-tag status-${row.status}`">
              {{ row.status_name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button 
              v-if="userStore.isFinance && row.status === 'pending'" 
              type="success" 
              link 
              size="small"
              @click="handleIssue(row)"
            >
              一键开票
            </el-button>
            <el-button 
              v-if="(userStore.isFinance || userStore.isTax) && 
                   ['issued', 'delivered', 'settled'].includes(row.status)"
              type="danger" 
              link 
              size="small"
              @click="handleRedCredit(row)"
            >
              红冲
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadInvoices"
          @current-change="loadInvoices"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="redCreditDialogVisible"
      title="红冲申请"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="redCreditForm" label-width="80px">
        <el-form-item label="原发票">
          <el-input :value="selectedInvoice?.invoice_no || selectedInvoice?.order_no" disabled />
        </el-form-item>
        <el-form-item label="原金额">
          <el-input :value="`¥${formatAmount(selectedInvoice?.amount)}`" disabled />
        </el-form-item>
        <el-form-item label="红冲原因" required>
          <el-input
            v-model="redCreditForm.reason"
            type="textarea"
            :rows="3"
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const invoices = ref([])
const selectedInvoice = ref(null)
const redCreditDialogVisible = ref(false)
const redCreditLoading = ref(false)

const filters = reactive({
  status: '',
  order_no: '',
  dateRange: null
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

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

const loadInvoices = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (filters.status) params.status = filters.status
    if (filters.order_no) params.order_no = filters.order_no
    if (filters.dateRange?.length === 2) {
      params.start_date = filters.dateRange[0]
      params.end_date = filters.dateRange[1]
    }

    const data = await api.get('/invoices', { params })
    invoices.value = data.invoices
    pagination.total = data.pagination.total
  } catch (e) {
    console.error('Failed to load invoices:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadInvoices()
}

const handleReset = () => {
  filters.status = ''
  filters.order_no = ''
  filters.dateRange = null
  pagination.page = 1
  loadInvoices()
}

const viewDetail = (row) => {
  router.push(`/invoices/${row.id}`)
}

const handleIssue = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认对订单 ${row.order_no} 开票？开票后将生成电子发票并自动交付。`,
      '确认开票',
      {
        confirmButtonText: '确认开票',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await api.post(`/invoices/${row.id}/issue`)
    ElMessage.success('开票成功！发票号码: ' + result.invoice.invoice_no)
    loadInvoices()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Issue invoice failed:', e)
    }
  }
}

const handleRedCredit = (row) => {
  selectedInvoice.value = row
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
    const result = await api.post(`/invoices/${selectedInvoice.value.id}/red-credit`, {
      reason: redCreditForm.reason
    })
    ElMessage.success('红冲成功！红冲发票号码: ' + result.red_credit.red_invoice_no)
    redCreditDialogVisible.value = false
    loadInvoices()
  } catch (e) {
    console.error('Red credit failed:', e)
  } finally {
    redCreditLoading.value = false
  }
}

onMounted(() => {
  loadInvoices()
})
</script>

<style scoped>
.invoice-list {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.invoice-no {
  font-family: 'Monaco', monospace;
  color: #409eff;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.text-muted {
  color: #909399;
}
</style>
