<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { request } from '@/utils/api'
import websocketService from '@/utils/websocket'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const orders = ref<any[]>([])
const currentOrder = ref<any>(null)
const orderDetailVisible = ref(false)
const activeTab = ref('all')

const filters = ref({
  status: '',
  dateFrom: '',
  dateTo: '',
})

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
})

const statusColors: Record<string, string> = {
  pending: 'info',
  confirmed: 'warning',
  preparing: 'primary',
  ready: 'success',
  served: '',
  completed: 'success',
  cancelled: 'danger',
}

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  preparing: '制作中',
  ready: '已出餐',
  served: '已上齐',
  completed: '已完成',
  cancelled: '已取消',
}

const orderTypeLabels: Record<string, string> = {
  dine_in: '堂食',
  takeaway: '打包',
  delivery: '外卖',
}

const tabOptions = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'pending' },
  { label: '制作中', value: 'preparing' },
  { label: '已出餐', value: 'ready' },
  { label: '已完成', value: 'completed' },
]

const fetchOrders = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }

    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }

    const result = await request.get('/orders/search', { params })
    orders.value = result.data
    pagination.value.total = result.total
  } catch (error) {
    ElMessage.error('加载订单数据失败')
  } finally {
    loading.value = false
  }
}

const viewOrderDetail = async (order: any) => {
  try {
    currentOrder.value = await request.get(`/orders/${order.id}`)
    orderDetailVisible.value = true
  } catch (error) {
    ElMessage.error('加载订单详情失败')
  }
}

const confirmOrder = async (order: any) => {
  try {
    await ElMessageBox.confirm(`确定要确认订单 ${order.orderNumber} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.post(`/orders/${order.id}/confirm`)
    ElMessage.success('订单已确认')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
  pagination.value.page = 1
  fetchOrders()
}

const handleSizeChange = (size: number) => {
  pagination.value.limit = size
  pagination.value.page = 1
  fetchOrders()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  fetchOrders()
}

const onNewOrder = (data: any) => {
  ElMessage.info(`新订单: ${data.orderNumber}`)
  fetchOrders()
}

const onOrderStatusChanged = (data: any) => {
  ElMessage.info(`订单 ${data.orderNumber} 状态已更新`)
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
  
  if (authStore.user) {
    websocketService.connect(authStore.user.role, authStore.user.id)
    websocketService.on('newOrder', onNewOrder)
    websocketService.on('orderStatusChanged', onOrderStatusChanged)
  }
})

onUnmounted(() => {
  websocketService.off('newOrder', onNewOrder)
  websocketService.off('orderStatusChanged', onOrderStatusChanged)
})
</script>

<template>
  <div class="orders-page">
    <el-card class="filter-card">
      <template #header>
        <span class="card-title">订单筛选</span>
      </template>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="tab in tabOptions"
          :key="tab.value"
          :label="tab.label"
          :name="tab.value"
        />
      </el-tabs>
    </el-card>

    <el-card class="orders-card" v-loading="loading">
      <template #header>
        <span class="card-title">订单列表</span>
        <el-button type="primary" size="small" @click="fetchOrders">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>

      <el-table :data="orders" stripe style="width: 100%">
        <el-table-column prop="orderNumber" label="订单号" width="160">
          <template #default="{ row }">
            <span class="order-number">{{ row.orderNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderType" label="类型" width="100">
          <template #default="{ row }">
            <span>{{ orderTypeLabels[row.orderType] }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tableNumber" label="桌号" width="100">
          <template #default="{ row }">
            <span v-if="row.table">{{ row.table.tableNumber }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="金额" width="100">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusColors[row.status]" size="small">
              {{ statusLabels[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewOrderDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              link
              size="small"
              @click="confirmOrder(row)"
            >
              确认
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="pagination.total > 0"
        class="pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        :page-size="pagination.limit"
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog
      v-model="orderDetailVisible"
      title="订单详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="currentOrder" class="order-detail">
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="订单号">
              {{ currentOrder.orderNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="订单类型">
              {{ orderTypeLabels[currentOrder.orderType] }}
            </el-descriptions-item>
            <el-descriptions-item label="桌号">
              {{ currentOrder.table?.tableNumber || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusColors[currentOrder.status]" size="small">
                {{ statusLabels[currentOrder.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">
              {{ new Date(currentOrder.createdAt).toLocaleString() }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4 class="section-title">订单商品</h4>
          <el-table :data="currentOrder.items" size="small" stripe>
            <el-table-column prop="name" label="菜品名称" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计" width="100">
              <template #default="{ row }">¥{{ row.subtotal.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="mini" :type="statusColors[row.status]">
                  {{ statusLabels[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="detail-section">
          <h4 class="section-title">金额明细</h4>
          <div class="amount-summary">
            <div class="amount-row">
              <span class="amount-label">商品合计:</span>
              <span class="amount-value">¥{{ currentOrder.totalAmount.toFixed(2) }}</span>
            </div>
            <div v-if="currentOrder.discountAmount > 0" class="amount-row discount">
              <span class="amount-label">优惠金额:</span>
              <span class="amount-value">-¥{{ currentOrder.discountAmount.toFixed(2) }}</span>
            </div>
            <div class="amount-row total">
              <span class="amount-label">应付金额:</span>
              <span class="amount-value">¥{{ currentOrder.payableAmount.toFixed(2) }}</span>
            </div>
            <div class="amount-row">
              <span class="amount-label">已付金额:</span>
              <span class="amount-value paid">¥{{ currentOrder.paidAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.filter-card,
.orders-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  :deep(.el-card__header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.order-number {
  font-weight: 600;
  color: #409eff;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.amount-summary {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  &.discount .amount-value {
    color: #67c23a;
  }

  &.total {
    padding-top: 8px;
    border-top: 1px solid #dcdfe6;

    .amount-label,
    .amount-value {
      font-weight: 600;
    }

    .amount-value {
      color: #f56c6c;
    }
  }

  &.paid .amount-value {
    color: #67c23a;
  }
}

.amount-label {
  font-size: 14px;
  color: #606266;
}

.amount-value {
  font-size: 14px;
  color: #303133;
}
</style>
