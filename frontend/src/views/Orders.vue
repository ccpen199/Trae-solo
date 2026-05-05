<template>
  <div class="orders-page">
    <el-card>
      <template #header>
        <div class="header-actions">
          <span>订单管理</span>
          <div class="filters">
            <el-select v-model="filters.status" placeholder="订单状态" clearable style="width: 150px; margin-right: 10px">
              <el-option label="待确认" value="pending" />
              <el-option label="已确认" value="confirmed" />
              <el-option label="制作中" value="preparing" />
              <el-option label="已完成" value="ready" />
              <el-option label="已上菜" value="served" />
              <el-option label="已结账" value="paid" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-button type="primary" @click="fetchOrders">查询</el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="orders" v-loading="loading" style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="table.name" label="桌台" width="100">
          <template #default="{ row }">
            {{ row.table?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="orderType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.orderType === 'dine_in' ? 'primary' : 'success'">
              {{ row.orderType === 'dine_in' ? '堂食' : row.orderType === 'takeout' ? '外卖' : '配送' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewOrder(row)">查看</el-button>
            <el-button v-if="row.status !== 'paid' && row.status !== 'cancelled'" size="small" type="success" @click="handlePayment(row)">结账</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchOrders"
        @current-change="fetchOrders"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <el-dialog v-model="orderDialogVisible" title="订单详情" width="700px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="桌台">{{ currentOrder.table?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用餐人数">{{ currentOrder.guestCount || 1 }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">
          {{ currentOrder.orderType === 'dine_in' ? '堂食' : currentOrder.orderType === 'takeout' ? '外卖' : '配送' }}
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)">{{ getStatusLabel(currentOrder.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentOrder.createdAt) }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider>订单明细</el-divider>
      
      <el-table :data="currentOrder?.items || []" style="width: 100%">
        <el-table-column prop="dishName" label="菜品名称" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="subtotal" label="小计" width="100">
          <template #default="{ row }">¥{{ row.subtotal }}</template>
        </el-table-column>
      </el-table>
      
      <div class="order-total" v-if="currentOrder">
        <span>总计：</span>
        <span class="total-amount">¥{{ currentOrder.totalAmount }}</span>
      </div>
    </el-dialog>
    
    <el-dialog v-model="paymentDialogVisible" title="订单结账" width="500px">
      <el-form label-width="100px" v-model="paymentForm">
        <el-form-item label="订单金额">
          <span style="font-size: 18px; color: #f56c6c; font-weight: bold;">¥{{ currentOrder?.totalAmount }}</span>
        </el-form-item>
        <el-form-item label="优惠金额">
          <el-input-number v-model="paymentForm.discountAmount" :min="0" :max="currentOrder?.totalAmount || 0" :precision="2" />
        </el-form-item>
        <el-form-item label="实收金额">
          <span style="font-size: 18px; color: #f56c6c; font-weight: bold;">¥{{ payAmount.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="paymentForm.payMethod" placeholder="请选择支付方式">
            <el-option label="现金" value="cash" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="card" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paymentLoading" @click="submitPayment">确认结账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const orderDialogVisible = ref(false)
const paymentDialogVisible = ref(false)
const paymentLoading = ref(false)

const currentOrder = ref(null)

const orders = ref([])

const filters = reactive({
  status: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const paymentForm = reactive({
  discountAmount: 0,
  payMethod: 'wechat'
})

const payAmount = computed(() => {
  const total = parseFloat(currentOrder.value?.totalAmount || 0)
  const discount = parseFloat(paymentForm.discountAmount || 0)
  return Math.max(0, total - discount)
})

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    confirmed: 'primary',
    preparing: 'warning',
    ready: 'success',
    served: 'success',
    paid: 'success',
    cancelled: 'danger',
    refunded: 'info'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    preparing: '制作中',
    ready: '已完成',
    served: '已上菜',
    paid: '已结账',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return map[status] || status
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await api.order.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    })
    orders.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch orders error:', error)
  } finally {
    loading.value = false
  }
}

const viewOrder = (row) => {
  currentOrder.value = row
  orderDialogVisible.value = true
}

const handlePayment = (row) => {
  currentOrder.value = row
  paymentForm.discountAmount = 0
  paymentForm.payMethod = 'wechat'
  paymentDialogVisible.value = true
}

const submitPayment = async () => {
  if (!paymentForm.payMethod) {
    ElMessage.warning('请选择支付方式')
    return
  }
  
  paymentLoading.value = true
  try {
    await api.payment.create({
      orderId: currentOrder.value.id,
      discountAmount: paymentForm.discountAmount,
      payMethod: paymentForm.payMethod
    })
    
    ElMessage.success('结账成功')
    paymentDialogVisible.value = false
    fetchOrders()
    
  } catch (error) {
    console.error('Submit payment error:', error)
  } finally {
    paymentLoading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  align-items: center;
}

.order-total {
  text-align: right;
  margin-top: 20px;
  font-size: 16px;
}

.total-amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}
</style>
