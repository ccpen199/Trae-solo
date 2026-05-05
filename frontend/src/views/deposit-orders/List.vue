<template>
  <div class="deposit-order-list-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="定金单号/订单号/客户"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="status in statusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select
            v-model="searchForm.paymentMethodId"
            placeholder="全部方式"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="pm in paymentMethods"
              :key="pm.id"
              :label="pm.name"
              :value="pm.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <span>定金单列表</span>
      </template>

      <el-table
        v-loading="loading"
        :data="depositOrderList"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="deposit_no" label="定金单号" width="180" />
        <el-table-column prop="order_no" label="关联订单" width="180" />
        <el-table-column prop="customer_name" label="客户" width="100" />
        <el-table-column prop="amount" label="定金金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">
              ¥{{ row.amount?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method_name" label="支付方式" width="100" />
        <el-table-column prop="status" label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="审核人" width="100">
          <template #default="{ row }">
            {{ row.operator_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ row.created_at ? formatDate(row.created_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              link
              @click="handleApprove(row)"
            >
              审核通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="warning"
              link
              @click="handleReject(row)"
            >
              审核拒绝
            </el-button>
            <el-button
              v-if="row.status === 'approved'"
              type="danger"
              link
              @click="handleCancel(row)"
            >
              取消审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getDepositOrderList, approveDepositOrder, rejectDepositOrder, cancelDepositOrder } from '@/api/depositOrders'
import { getPaymentMethods } from '@/api/common'

const router = useRouter()

const loading = ref(false)
const depositOrderList = ref([])
const paymentMethods = ref([])

const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已取消', value: 'cancelled' }
]

const searchForm = reactive({
  keyword: '',
  status: null,
  paymentMethodId: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const getStatusLabel = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      paymentMethodId: searchForm.paymentMethodId || undefined
    }

    const res = await getDepositOrderList(params)
    depositOrderList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch deposit order list error:', error)
  } finally {
    loading.value = false
  }
}

const fetchPaymentMethodsList = async () => {
  try {
    const res = await getPaymentMethods()
    paymentMethods.value = res.data || []
  } catch (error) {
    console.error('Fetch payment methods error:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = null
  searchForm.paymentMethodId = null
  pagination.page = 1
  fetchData()
}

const handleView = (row) => {
  ElMessage.info('详情功能开发中')
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确定要审核通过该定金单吗？审核通过后订单将进入待发货状态。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await approveDepositOrder(row.id)
    ElMessage.success('审核通过')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Approve error:', error)
    }
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm('确定要拒绝该定金单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await rejectDepositOrder(row.id)
    ElMessage.success('已拒绝')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Reject error:', error)
    }
  }
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消审核吗？取消后订单状态将退回销售。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cancelDepositOrder(row.id)
    ElMessage.success('已取消审核')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel error:', error)
    }
  }
}

onMounted(() => {
  fetchPaymentMethodsList()
  fetchData()
})
</script>

<style scoped>
.deposit-order-list-container {
  padding: 0;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
</style>
