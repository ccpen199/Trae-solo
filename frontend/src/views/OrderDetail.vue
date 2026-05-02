<template>
  <div class="order-detail-container">
    <el-header style="height: auto; padding: 0;">
      <div class="header-inner">
        <div class="logo">
          <h1><router-link to="/">C2C二手交易平台</router-link></h1>
        </div>
        
        <div class="header-actions">
          <template v-if="userStore.isLoggedIn">
            <router-link to="/publish">
              <el-button type="primary">发布商品</el-button>
            </router-link>
            <el-dropdown>
              <span class="user-info">
                <el-avatar :size="32">
                  {{ userStore.userInfo?.nickname?.charAt(0) }}
                </el-avatar>
                <span class="nickname">{{ userStore.userInfo?.nickname }}</span>
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
          </template>
          <template v-else>
            <router-link to="/login"><el-button>登录</el-button></router-link>
            <router-link to="/register"><el-button type="primary">注册</el-button></router-link>
          </template>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item><router-link to="/">首页</router-link></el-breadcrumb-item>
        <el-breadcrumb-item><router-link to="/orders">我的订单</router-link></el-breadcrumb-item>
        <el-breadcrumb-item>订单详情</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-loading="loading">
        <template v-if="order">
          <el-card class="status-card">
            <div class="order-status-header">
              <el-tag :type="getStatusType(order.status)" size="large">
                {{ getStatusText(order.status) }}
              </el-tag>
              <span class="order-no">订单号：{{ order.order_no }}</span>
            </div>
            
            <el-steps :active="getStepIndex(order.status)" finish-status="success" class="order-steps" align-center>
              <el-step title="等待付款" />
              <el-step title="等待发货" />
              <el-step title="等待收货" />
              <el-step title="交易完成" />
            </el-steps>
          </el-card>

          <el-card class="product-card">
            <template #header>
              <span>商品信息</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="6">
                <router-link :to="`/products/${order.product_id}`">
                  <img class="product-image" :src="getProductImage()" alt="商品图片" />
                </router-link>
              </el-col>
              <el-col :span="18">
                <router-link :to="`/products/${order.product_id}`" class="product-title">
                  <h3>{{ order.title || order.product_title }}</h3>
                </router-link>
                <div class="product-info">
                  <span class="price">¥{{ order.price.toFixed(2) }}</span>
                  <span class="seller">卖家：{{ order.seller_nickname || order.buyer_nickname }}</span>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <el-card class="info-card">
            <template #header>
              <span>订单信息</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单编号">{{ order.order_no }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(order.created_at) }}</el-descriptions-item>
              <el-descriptions-item label="商品金额">¥{{ order.price.toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="服务费">¥{{ order.service_fee.toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="实付金额" span="2">
                <span class="total-price">¥{{ order.total_amount.toFixed(2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="担保状态" span="2">
                <el-tag :type="getEscrowStatusType(order.escrow_status)">
                  {{ getEscrowStatusText(order.escrow_status) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="action-card" v-if="showActions">
            <template #header>
              <span>操作</span>
            </template>
            <div class="action-buttons">
              <el-button
                v-if="order.status === 'pending_payment'"
                type="primary"
                size="large"
                :loading="payLoading"
                @click="handlePay"
              >
                立即支付
              </el-button>
              <el-button
                v-if="order.status === 'pending_payment'"
                size="large"
                @click="handleCancel"
              >
                取消订单
              </el-button>
              <el-button
                v-if="order.status === 'pending_shipment' && order.isSeller"
                type="primary"
                size="large"
                @click="handleShip"
              >
                去发货
              </el-button>
              <el-button
                v-if="order.status === 'shipped' && !order.isSeller"
                type="primary"
                size="large"
                :loading="receiveLoading"
                @click="handleReceive"
              >
                确认收货
              </el-button>
              <el-button
                v-if="order.status === 'shipped' && !order.isSeller"
                size="large"
                @click="handleDispute"
              >
                申请纠纷
              </el-button>
            </div>
          </el-card>
        </template>

        <el-empty v-if="!loading && !order" description="订单不存在" />
      </div>
    </el-main>

    <el-dialog v-model="shipDialogVisible" title="发货" width="500px">
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="快递公司">
          <el-select v-model="shipForm.shippingCompany" placeholder="请选择快递公司" style="width: 100%;">
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
        <el-button type="primary" :loading="shipLoading" @click="submitShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store'
import { orderApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const payLoading = ref(false)
const receiveLoading = ref(false)
const shipLoading = ref(false)
const order = ref(null)

const shipDialogVisible = ref(false)
const shipForm = ref({
  shippingCompany: '',
  trackingNumber: ''
})

const productImages = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%20smartphone%20used%20electronics%20product%20photo&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sony%20camera%20lens%20used%20photography%20product%20photo&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20watch%20Rolex%20used%20jewelry%20product%20photo&image_size=square'
]

const showActions = computed(() => {
  return ['pending_payment', 'pending_shipment', 'shipped'].includes(order.value?.status)
})

const getProductImage = () => {
  if (order.value?.images && order.value.images.length > 0) {
    return order.value.images[0]
  }
  const index = (order.value?.product_id || 0) % productImages.length
  return productImages[index]
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
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

const getStepIndex = (status) => {
  const steps = {
    pending_payment: 0,
    paid: 1,
    pending_shipment: 1,
    shipped: 2,
    pending_confirmation: 2,
    completed: 3,
    cancelled: 0,
    refunded: 0
  }
  return steps[status] || 0
}

const getEscrowStatusType = (status) => {
  const types = {
    locked: 'warning',
    released: 'success',
    refunded: 'info',
    pending: 'info'
  }
  return types[status] || 'info'
}

const getEscrowStatusText = (status) => {
  const texts = {
    locked: '资金已锁定（担保中）',
    released: '资金已释放',
    refunded: '已退款',
    pending: '等待支付'
  }
  return texts[status] || status
}

const fetchOrder = async () => {
  loading.value = true
  try {
    const result = await orderApi.getDetail(route.params.id)
    order.value = result.data
  } catch (e) {
    console.error('Failed to fetch order:', e)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

const handlePay = async () => {
  try {
    await ElMessageBox.confirm(
      `确认支付 ¥${order.value.total_amount.toFixed(2)} 吗？`,
      '确认支付',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    payLoading.value = true
    await orderApi.pay(order.value.id)
    ElMessage.success('支付成功')
    fetchOrder()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to pay:', e)
    }
  } finally {
    payLoading.value = false
  }
}

const handleCancel = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入取消原因',
      '取消订单',
      {
        confirmButtonText: '确认取消',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '请输入取消原因'
      }
    )

    await orderApi.cancel(order.value.id, { cancelReason: reason })
    ElMessage.success('订单已取消')
    fetchOrder()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to cancel:', e)
    }
  }
}

const handleShip = () => {
  shipForm.value = { shippingCompany: '', trackingNumber: '' }
  shipDialogVisible.value = true
}

const submitShip = async () => {
  if (!shipForm.value.shippingCompany || !shipForm.value.trackingNumber) {
    ElMessage.warning('请填写完整的物流信息')
    return
  }

  shipLoading.value = true
  try {
    await orderApi.ship(order.value.id, shipForm.value)
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    fetchOrder()
  } catch (e) {
    console.error('Failed to ship:', e)
  } finally {
    shipLoading.value = false
  }
}

const handleReceive = async () => {
  try {
    await ElMessageBox.confirm(
      '确认已收到商品吗？确认后资金将转给卖家',
      '确认收货',
      {
        confirmButtonText: '确认收货',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    receiveLoading.value = true
    await orderApi.receive(order.value.id)
    ElMessage.success('确认收货成功')
    fetchOrder()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to receive:', e)
    }
  } finally {
    receiveLoading.value = false
  }
}

const handleDispute = () => {
  ElMessage.info('纠纷功能开发中')
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

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.order-detail-container {
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

.nickname {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.breadcrumb {
  margin-bottom: 20px;
}

.status-card {
  margin-bottom: 20px;
}

.order-status-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.order-no {
  color: #909399;
  font-size: 14px;
}

.order-steps {
  padding: 20px 40px;
}

.product-card {
  margin-bottom: 20px;
}

.product-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

.product-title {
  text-decoration: none;
  color: #303133;
}

.product-title h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: normal;
  line-height: 1.5;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.product-info .price {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

.product-info .seller {
  font-size: 14px;
  color: #909399;
}

.info-card {
  margin-bottom: 20px;
}

.total-price {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.action-card {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>
