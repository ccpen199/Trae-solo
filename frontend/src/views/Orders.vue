<template>
  <div class="orders-container">
    <el-header style="height: auto; padding: 0;">
      <div class="header-inner">
        <div class="logo">
          <h1><router-link to="/">C2C二手交易平台</router-link></h1>
        </div>
        <div class="header-actions">
          <router-link to="/publish"><el-button type="primary">发布商品</el-button></router-link>
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32">{{ userStore.userInfo?.nickname?.charAt(0) }}</el-avatar>
              <span>{{ userStore.userInfo?.nickname }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item><router-link to="/profile">个人中心</router-link></el-dropdown-item>
                <el-dropdown-item><router-link to="/orders">我的订单</router-link></el-dropdown-item>
                <el-dropdown-item><router-link to="/chat">消息中心</router-link></el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <h2 class="page-title">我的订单</h2>
      
      <el-tabs v-model="activeTab" class="order-tabs">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="待付款" name="pending_payment" />
        <el-tab-pane label="待发货" name="pending_shipment" />
        <el-tab-pane label="待收货" name="shipped" />
        <el-tab-pane label="已完成" name="completed" />
        <el-tab-pane label="已取消" name="cancelled" />
      </el-tabs>

      <div v-loading="loading">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <el-card :body-style="{ padding: 0 }">
            <div class="order-header">
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-time">{{ formatDate(order.createdAt) }}</span>
              <el-tag :type="getStatusType(order.status)" size="small">
                {{ getStatusText(order.status) }}
              </el-tag>
            </div>
            <div class="order-content">
              <div class="product-info" @click="goToProduct(order.productId)">
                <el-avatar :size="80" shape="square" class="product-avatar">
                  {{ order.productTitle?.charAt(0) }}
                </el-avatar>
                <div class="product-detail">
                  <h3 class="product-title">{{ order.productTitle }}</h3>
                  <p class="product-price">¥{{ order.price.toFixed(2) }}</p>
                </div>
              </div>
              <div class="order-actions">
                <el-button v-if="order.status === 'pending_payment'" type="primary" @click="handlePay(order)">
                  去支付
                </el-button>
                <el-button v-if="order.status === 'pending_payment'" @click="handleCancel(order)">
                  取消订单
                </el-button>
                <el-button v-if="order.status === 'pending_shipment' && order.isSeller" type="primary" @click="handleShip(order)">
                  去发货
                </el-button>
                <el-button v-if="order.status === 'shipped' && !order.isSeller" type="primary" @click="handleReceive(order)">
                  确认收货
                </el-button>
                <el-button @click="goToDetail(order.id)">
                  查看详情
                </el-button>
              </div>
            </div>
            <div class="order-footer">
              <span>
                {{ order.isSeller ? '买家' : '卖家' }}：
                {{ order.isSeller ? order.buyerNickname : order.sellerNickname }}
              </span>
              <span class="total-price">
                订单金额：<strong>¥{{ order.totalAmount.toFixed(2) }}</strong>
              </span>
            </div>
          </el-card>
        </div>

        <el-empty v-if="!loading && orders.length === 0" description="暂无订单" />
      </div>
    </el-main>

    <el-dialog v-model="shipDialogVisible" title="发货" width="500px">
      <el-form :model="shipForm" label-width="80px">
        <el-form-item label="快递公司">
          <el-select v-model="shipForm.shippingCompany" placeholder="请选择">
            <el-option label="顺丰速运" value="顺丰速运" />
            <el-option label="中通快递" value="中通快递" />
            <el-option label="圆通速递" value="圆通速递" />
            <el-option label="申通快递" value="申通快递" />
            <el-option label="韵达快递" value="韵达快递" />
            <el-option label="邮政EMS" value="邮政EMS" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号">
          <el-input v-model="shipForm.trackingNumber" placeholder="请输入快递单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShip" :loading="submitting">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store'
import { orderApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const orders = ref([])
const activeTab = ref(route.query.status || '')

const shipDialogVisible = ref(false)
const currentOrder = ref(null)
const submitting = ref(false)
const shipForm = ref({
  shippingCompany: '',
  trackingNumber: ''
})

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getStatusType = (status) => {
  const types = {
    pending_payment: 'warning',
    paid: 'info',
    pending_shipment: 'primary',
    shipped: 'warning',
    pending_confirmation: 'primary',
    completed: 'success',
    cancelled: 'info',
    refunded: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending_payment: '待付款',
    paid: '已付款',
    pending_shipment: '待发货',
    shipped: '已发货',
    pending_confirmation: '待确认',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return texts[status] || status
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: 1,
      limit: 20,
      status: activeTab.value
    }
    const result = await orderApi.getMyOrders(params)
    orders.value = result.data.orders
  } catch (e) {
    console.error('Failed to fetch orders:', e)
  } finally {
    loading.value = false
  }
}

const goToProduct = (productId) => {
  router.push(`/products/${productId}`)
}

const goToDetail = (orderId) => {
  router.push(`/orders/${orderId}`)
}

const handlePay = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确认支付 ¥${order.totalAmount.toFixed(2)} 吗？`,
      '确认支付',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await orderApi.pay(order.id)
    ElMessage.success('支付成功')
    fetchOrders()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to pay:', e)
    }
  }
}

const handleCancel = async (order) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确认取消',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入取消原因'
    })

    await orderApi.cancel(order.id, { cancelReason: reason })
    ElMessage.success('订单已取消')
    fetchOrders()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to cancel:', e)
    }
  }
}

const handleShip = (order) => {
  currentOrder.value = order
  shipForm.value = { shippingCompany: '', trackingNumber: '' }
  shipDialogVisible.value = true
}

const submitShip = async () => {
  if (!shipForm.value.shippingCompany || !shipForm.value.trackingNumber) {
    ElMessage.warning('请填写完整的物流信息')
    return
  }

  submitting.value = true
  try {
    await orderApi.ship(currentOrder.value.id, shipForm.value)
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    fetchOrders()
  } catch (e) {
    console.error('Failed to ship:', e)
  } finally {
    submitting.value = false
  }
}

const handleReceive = async (order) => {
  try {
    await ElMessageBox.confirm(
      '确认已收到商品，无误后资金将转给卖家',
      '确认收货',
      {
        confirmButtonText: '确认收货',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await orderApi.receive(order.id)
    ElMessage.success('确认收货成功')
    fetchOrders()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to receive:', e)
    }
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Logout error:', e)
    }
  }
}

watch(
  () => activeTab.value,
  () => {
    router.replace({ query: { status: activeTab.value || undefined } })
    fetchOrders()
  }
)

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.logo a {
  color: inherit;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 20px;
}

.order-tabs {
  margin-bottom: 20px;
}

.order-card {
  margin-bottom: 20px;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background-color: #f5f7fa;
  font-size: 14px;
  color: #909399;
}

.order-no {
  flex: 1;
  color: #303133;
}

.order-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.product-info {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.product-avatar {
  margin-right: 16px;
  background-color: #f5f7fa;
}

.product-detail {
  flex: 1;
}

.product-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
  font-weight: normal;
}

.product-price {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.order-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  font-size: 14px;
  color: #909399;
}

.total-price {
  font-size: 16px;
}

.total-price strong {
  color: #f56c6c;
  font-size: 18px;
}
</style>
