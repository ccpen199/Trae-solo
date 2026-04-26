<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button v-if="userStore.isBuyer" type="primary" @click="goToCreate">
            <el-icon><Plus /></el-icon>
            创建订单
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待预付" value="PENDING_PREPAYMENT" />
            <el-option label="已预付" value="PREPAYMENT_PAID" />
            <el-option label="采集中" value="IN_COLLECTION" />
            <el-option label="质检完成" value="QUALITY_CHECKED" />
            <el-option label="运输中" value="IN_TRANSPORT" />
            <el-option label="已到货" value="DELIVERED" />
            <el-option label="已结算" value="SETTLED" />
            <el-option label="已取消" value="CANCELLED" />
            <el-option label="异常处理" value="EXCEPTION_HANDLING" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orders" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="productCategory" label="产品类别" width="100" />
        <el-table-column label="重量(kg)" width="120">
          <template #default="{ row }">
            <span>{{ formatNumber(row.actualWeight || row.expectedWeight) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" width="120">
          <template #default="{ row }">
            <span>¥{{ formatNumber(row.actualAmount || row.expectedAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="viewDetail(row.id)">详情</el-button>
            <el-button
              v-if="row.status === 'PENDING_PREPAYMENT' && userStore.isBuyer"
              type="primary"
              text
              @click="handlePrepay(row)"
            >
              预付
            </el-button>
            <el-button
              v-if="['DRAFT', 'PENDING_PREPAYMENT'].includes(row.status)"
              type="danger"
              text
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="loadOrders"
        @current-change="loadOrders"
      />
    </el-card>

    <el-dialog v-model="prepayDialogVisible" title="预付款支付" width="400px">
      <el-form :model="prepayForm" label-width="80px">
        <el-form-item label="订单金额">
          <span>¥{{ formatNumber(prepayForm.expectedAmount) }}</span>
        </el-form-item>
        <el-form-item label="预付金额">
          <el-input-number v-model="prepayForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="prepayForm.paymentMethod" placeholder="请选择支付方式" style="width: 100%">
            <el-option label="虚拟账户" value="VIRTUAL_ACCOUNT" />
            <el-option label="微信支付" value="WECHAT" />
            <el-option label="支付宝" value="ALIPAY" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="prepayDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="prepayLoading" @click="submitPrepay">
          确认支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { orderApi } from '@/api/order'
import type { Order, OrderStatus } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const orders = ref<Order[]>([])
const prepayDialogVisible = ref(false)
const prepayLoading = ref(false)

const searchForm = reactive({
  orderNo: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const prepayForm = reactive({
  orderId: '',
  expectedAmount: 0,
  amount: 0,
  paymentMethod: 'VIRTUAL_ACCOUNT',
})

const statusMap: Record<OrderStatus, { text: string; type: string }> = {
  DRAFT: { text: '草稿', type: 'info' },
  PENDING_PREPAYMENT: { text: '待预付', type: 'warning' },
  PREPAYMENT_PAID: { text: '已预付', type: '' },
  IN_COLLECTION: { text: '采集中', type: 'primary' },
  QUALITY_CHECKED: { text: '质检完成', type: '' },
  IN_TRANSPORT: { text: '运输中', type: 'primary' },
  DELIVERED: { text: '已到货', type: 'success' },
  SETTLED: { text: '已结算', type: 'success' },
  CANCELLED: { text: '已取消', type: 'danger' },
  EXCEPTION_HANDLING: { text: '异常处理', type: 'danger' },
  STORAGE_TRANSFERRED: { text: '货权转移', type: 'warning' },
}

const getStatusType = (status: OrderStatus) => statusMap[status]?.type || ''
const getStatusText = (status: OrderStatus) => statusMap[status]?.text || status

const formatNumber = (num: any) => {
  if (num?.toNumber) {
    return num.toNumber().toFixed(2)
  }
  return Number(num || 0).toFixed(2)
}

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')

const loadOrders = async () => {
  loading.value = true
  try {
    const result = await orderApi.getList(searchForm.status as OrderStatus)
    orders.value = result
    pagination.total = result.length
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadOrders()
}

const resetSearch = () => {
  searchForm.orderNo = ''
  searchForm.status = ''
  pagination.page = 1
  loadOrders()
}

const goToCreate = () => router.push('/orders/create')
const viewDetail = (id: string) => router.push(`/orders/${id}`)

const handlePrepay = (row: Order) => {
  prepayForm.orderId = row.id
  prepayForm.expectedAmount = row.expectedAmount?.toNumber?.() || row.expectedAmount || 0
  prepayForm.amount = prepayForm.expectedAmount
  prepayForm.paymentMethod = 'VIRTUAL_ACCOUNT'
  prepayDialogVisible.value = true
}

const submitPrepay = async () => {
  if (prepayForm.amount <= 0) {
    ElMessage.warning('请输入有效的预付金额')
    return
  }

  prepayLoading.value = true
  try {
    await orderApi.prepay(prepayForm.orderId, prepayForm.amount, prepayForm.paymentMethod)
    ElMessage.success('预付款支付成功')
    prepayDialogVisible.value = false
    loadOrders()
  } catch (error) {
    console.error('Failed to prepay:', error)
  } finally {
    prepayLoading.value = false
  }
}

const handleCancel = async (row: Order) => {
  try {
    await ElMessageBox.confirm('确认要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await orderApi.cancel(row.id)
    ElMessage.success('订单已取消')
    loadOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to cancel order:', error)
    }
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style lang="scss" scoped>
.order-list {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-form {
    margin-bottom: 20px;
  }
}
</style>
