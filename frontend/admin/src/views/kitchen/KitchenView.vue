<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { request } from '@/utils/api'
import websocketService from '@/utils/websocket'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const orders = ref<any[]>([])
const activeTab = ref('pending')

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

const itemStatusLabels: Record<string, string> = {
  pending: '待制作',
  preparing: '制作中',
  ready: '已出餐',
  served: '已上菜',
  cancelled: '已取消',
  refunded: '已退款',
}

const tabOptions = [
  { label: '待制作', value: 'pending', statuses: ['pending', 'confirmed'] },
  { label: '制作中', value: 'preparing', statuses: ['preparing'] },
  { label: '已出餐', value: 'ready', statuses: ['ready', 'served'] },
  { label: '已完成', value: 'completed', statuses: ['completed'] },
]

const filteredOrders = computed(() => {
  const tab = tabOptions.find((t) => t.value === activeTab.value)
  if (!tab) return orders.value
  return orders.value.filter((o) => tab.statuses.includes(o.status))
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const result = await request.get('/orders/search', {
      params: { limit: 50 },
    })
    orders.value = result.data.sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  } catch (error) {
    ElMessage.error('加载订单数据失败')
  } finally {
    loading.value = false
  }
}

const startPreparing = async (order: any) => {
  try {
    await ElMessageBox.confirm(`确定要开始制作订单 ${order.orderNumber} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })
    await request.post(`/orders/${order.id}/start-preparing`)
    ElMessage.success('已开始制作')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const markItemPreparing = async (item: any, order: any) => {
  try {
    await request.post(`/orders/items/${item.id}/start-preparing`)
    ElMessage.success(`${item.name} 开始制作`)
    fetchOrders()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const markItemReady = async (item: any, order: any) => {
  try {
    await request.post(`/orders/items/${item.id}/mark-ready`)
    ElMessage.success(`${item.name} 已出餐`)
    fetchOrders()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const markOrderReady = async (order: any) => {
  try {
    await ElMessageBox.confirm(`确定订单 ${order.orderNumber} 已全部出餐吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
    await request.post(`/orders/${order.id}/mark-ready`)
    ElMessage.success('订单已出餐')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const onNewOrder = (data: any) => {
  ElNotification({
    title: '新订单',
    message: `订单 ${data.orderNumber} 已创建`,
    type: 'success',
    duration: 0,
  })
  fetchOrders()
}

const onOrderStatusChanged = (data: any) => {
  ElMessage.info(`订单 ${data.orderNumber} 状态已更新`)
  fetchOrders()
}

const onOrderItemStatusChanged = (data: any) => {
  ElMessage.info(`菜品 ${data.itemName} 状态已更新`)
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
  
  if (authStore.user) {
    websocketService.connect(authStore.user.role, authStore.user.id)
    websocketService.on('newOrder', onNewOrder)
    websocketService.on('orderStatusChanged', onOrderStatusChanged)
    websocketService.on('orderItemStatusChanged', onOrderItemStatusChanged)
  }
})

onUnmounted(() => {
  websocketService.off('newOrder', onNewOrder)
  websocketService.off('orderStatusChanged', onOrderStatusChanged)
  websocketService.off('orderItemStatusChanged', onOrderItemStatusChanged)
})
</script>

<template>
  <div class="kitchen-page">
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <span class="card-title">后厨工作台</span>
          <el-button type="primary" size="small" @click="fetchOrders">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane
          v-for="tab in tabOptions"
          :key="tab.value"
          :label="`${tab.label} (${filteredOrders.length})`"
          :name="tab.value"
        />
      </el-tabs>
    </el-card>

    <div class="orders-container" v-loading="loading">
      <el-empty v-if="filteredOrders.length === 0" description="暂无订单" />

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" v-for="order in filteredOrders" :key="order.id">
          <el-card :class="['order-card', `status-${order.status}`]" shadow="hover">
            <div class="order-header">
              <div class="order-info">
                <span class="order-number">{{ order.orderNumber }}</span>
                <el-tag :type="statusColors[order.status]" size="small">
                  {{ statusLabels[order.status] }}
                </el-tag>
              </div>
              <div class="order-meta">
                <span class="table-number" v-if="order.table">
                  桌号: {{ order.table.tableNumber }}
                </span>
                <span class="order-time">
                  {{ new Date(order.createdAt).toLocaleTimeString() }}
                </span>
              </div>
            </div>

            <div class="order-items">
              <div
                v-for="(item, index) in order.items"
                :key="item.id"
                :class="['order-item', `item-status-${item.status}`]"
              >
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span>
                  <el-tag v-if="item.specifications" size="mini" type="info">
                    {{ item.specifications }}
                  </el-tag>
                  <span v-if="item.customerRemarks" class="item-remarks">
                    备注: {{ item.customerRemarks }}
                  </span>
                </div>
                <div class="item-actions">
                  <el-tag size="small" :type="item.status === 'ready' || item.status === 'served' ? 'success' : item.status === 'preparing' ? 'primary' : 'info'">
                    {{ itemStatusLabels[item.status] }}
                  </el-tag>
                  <div class="action-buttons">
                    <el-button
                      v-if="item.status === 'pending'"
                      type="primary"
                      size="small"
                      @click="markItemPreparing(item, order)"
                    >
                      开始制作
                    </el-button>
                    <el-button
                      v-if="item.status === 'preparing'"
                      type="success"
                      size="small"
                      @click="markItemReady(item, order)"
                    >
                      已出餐
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="order-footer">
              <div class="order-amount">
                金额: <span class="amount">¥{{ order.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="order-actions">
                <el-button
                  v-if="order.status === 'confirmed'"
                  type="primary"
                  size="small"
                  @click="startPreparing(order)"
                >
                  开始制作
                </el-button>
                <el-button
                  v-if="order.status === 'preparing'"
                  type="success"
                  size="small"
                  @click="markOrderReady(order)"
                >
                  全部出餐
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.kitchen-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.orders-container {
  padding: 0;
}

.order-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s;

  &.status-pending {
    border-left: 4px solid #909399;
  }

  &.status-confirmed {
    border-left: 4px solid #e6a23c;
  }

  &.status-preparing {
    border-left: 4px solid #409eff;
  }

  &.status-ready {
    border-left: 4px solid #67c23a;
  }

  &.status-served {
    border-left: 4px solid #67c23a;
    opacity: 0.8;
  }

  &.status-completed {
    border-left: 4px solid #67c23a;
    opacity: 0.6;
  }
}

.order-header {
  margin-bottom: 16px;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.order-number {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.order-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.order-items {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.order-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;

  &.item-status-ready,
  &.item-status-served {
    background: #f0f9eb;
  }

  &.item-status-preparing {
    background: #ecf5ff;
  }
}

.item-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.item-quantity {
  font-size: 13px;
  color: #606266;
}

.item-remarks {
  font-size: 12px;
  color: #e6a23c;
}

.item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.order-amount {
  font-size: 14px;
  color: #606266;
}

.amount {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.order-actions {
  display: flex;
  gap: 8px;
}
</style>
