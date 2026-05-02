<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { request } from '@/utils/api'
import websocketService from '@/utils/websocket'
import { showLoadingToast, closeToast, showToast, showConfirmDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const order = ref<any>(null)
const loading = ref(false)

const statusSteps = computed(() => {
  const steps = [
    { text: '待确认', status: order.value?.status === 'pending' ? 'processing' : order.value?.createdAt ? 'finished' : 'waiting' },
    { text: '已确认', status: ['confirmed', 'preparing', 'ready', 'served', 'completed'].includes(order.value?.status) ? 'finished' : 'waiting' },
    { text: '制作中', status: ['preparing', 'ready', 'served', 'completed'].includes(order.value?.status) ? 'finished' : 'waiting' },
    { text: '已出餐', status: ['ready', 'served', 'completed'].includes(order.value?.status) ? 'finished' : 'waiting' },
    { text: '已完成', status: order.value?.status === 'completed' ? 'finished' : 'waiting' },
  ]
  return steps
})

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    preparing: '制作中',
    ready: '已出餐',
    served: '已上齐',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    confirmed: 'primary',
    preparing: 'primary',
    ready: 'success',
    served: 'success',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'default'
}

const getOrderTypeText = (type: string) => {
  const map: Record<string, string> = {
    dine_in: '堂食',
    takeaway: '打包',
    delivery: '外卖',
  }
  return map[type] || type
}

const fetchOrder = async () => {
  const orderId = route.params.id as string || cartStore.orderId

  if (!orderId) {
    showToast('订单不存在')
    router.push('/menu')
    return
  }

  loading.value = true
  showLoadingToast({
    message: '加载订单中...',
    forbidClick: true,
  })

  try {
    const data = await request.get(`/orders/${orderId}`)
    order.value = data
  } catch (error) {
    showToast({ message: '加载失败', type: 'fail' })
  } finally {
    loading.value = false
    closeToast()
  }
}

const addMoreItems = () => {
  router.push('/menu')
}

const goToPayment = async () => {
  if (!order.value) return

  try {
    await showConfirmDialog({
      title: '确认结账',
      message: `订单金额 ¥${order.value.payableAmount}，确认前往支付？`,
    })
    router.push('/payment')
  } catch {
    // 用户取消
  }
}

const onOrderStatusChanged = (data: any) => {
  if (data.orderId === order.value?.id) {
    fetchOrder()
    showToast(`订单状态已更新: ${getStatusText(data.status)}`)
  }
}

onMounted(() => {
  fetchOrder()

  if (cartStore.tableId) {
    websocketService.connect('customer', undefined, cartStore.tableId)
    websocketService.on('orderCustomerStatusChanged', onOrderStatusChanged)
  }
})
</script>

<template>
  <div class="order-detail-page">
    <van-nav-bar
      title="订单详情"
      left-text="返回"
      @click-left="$router.back()"
    />

    <div v-if="order" class="order-detail-content">
      <div class="status-section">
        <div class="status-header">
          <h2 class="order-number">{{ order.orderNumber }}</h2>
          <van-tag :type="getStatusType(order.status)" size="large">
            {{ getStatusText(order.status) }}
          </van-tag>
        </div>

        <van-steps :active="getCurrentStep" active-color="#ff6b00">
          <van-step v-for="(step, index) in statusSteps" :key="index">
            {{ step.text }}
          </van-step>
        </van-steps>
      </div>

      <div class="info-section">
        <van-cell-group inset>
          <van-cell title="订单类型" :value="getOrderTypeText(order.orderType)" />
          <van-cell title="开单时间" :value="order.createdAt" />
          <van-cell title="备注" :value="order.customerRemarks || '无'" />
        </van-cell-group>
      </div>

      <div class="items-section">
        <div class="section-title">
          <van-icon name="list" color="#ff6b00" />
          <span>订单商品</span>
        </div>

        <div class="items-list">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="order-item"
          >
            <div class="item-info">
              <h4 class="item-name">{{ item.name }}</h4>
              <p v-if="item.specifications" class="item-spec">
                {{ item.specifications }}
              </p>
            </div>
            <div class="item-price">
              <span class="quantity">x{{ item.quantity }}</span>
              <span class="price">¥{{ item.subtotal }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <van-cell-group inset>
          <van-cell title="商品合计" :value="`¥${order.totalAmount}`" />
          <van-cell
            v-if="order.discountAmount > 0"
            title="优惠金额"
            :value="`-¥${order.discountAmount}`"
          />
          <van-cell
            title="应付金额"
            :value="`¥${order.payableAmount}`"
            value-class="total-amount"
          />
        </van-cell-group>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="bottom-actions">
        <van-button
          type="default"
          size="large"
          block
          @click="addMoreItems"
          v-if="order && !['completed', 'cancelled'].includes(order.status)"
        >
          加菜
        </van-button>
        <van-button
          type="primary"
          size="large"
          block
          @click="goToPayment"
          v-if="order && ['served', 'ready', 'preparing'].includes(order.status)"
        >
          去支付 ¥{{ order?.payableAmount }}
        </van-button>
        <van-button
          type="primary"
          size="large"
          block
          @click="$router.push('/review')"
          v-if="order && order.status === 'completed'"
        >
          去评价
        </van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.order-detail-content {
  flex: 1;
  padding: 12px;
}

.status-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.order-number {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-section,
.items-section,
.summary-section {
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 4px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.items-list {
  background: #fff;
  border-radius: 12px;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.item-info {
  flex: 1;
}

.item-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.item-spec {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.quantity {
  font-size: 14px;
  color: #999;
}

.price {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.total-amount {
  font-size: 18px;
  font-weight: 600;
  color: #ff6b00;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.bottom-actions {
  display: flex;
  gap: 12px;
}

:deep(.van-button) {
  border-radius: 20px;
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border: none;
}
</style>
