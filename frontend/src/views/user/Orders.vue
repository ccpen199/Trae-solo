<template>
  <div class="orders-page">
    <div class="orders-header">
      <van-icon name="arrow-left" size="20" @click="goBack" />
      <div class="header-title">我的订单</div>
    </div>

    <van-tabs v-model:active="activeTab" color="#1989fa" line-width="40" sticky>
      <van-tab title="全部" name="all">
        <OrderList :status="'all'" />
      </van-tab>
      <van-tab title="待支付" name="pending">
        <OrderList :status="'pending'" />
      </van-tab>
      <van-tab title="进行中" name="processing">
        <OrderList :status="'processing'" />
      </van-tab>
      <van-tab title="已完成" name="completed">
        <OrderList :status="'completed'" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const activeTab = ref('all')

const goBack = () => {
  router.back()
}

onMounted(() => {
  if (route.query.status) {
    activeTab.value = route.query.status
  }
})
</script>

<template>
  <div class="order-list">
    <div class="order-item" v-for="order in orderList" :key="order.id">
      <div class="order-header">
        <span class="order-no">订单号: {{ order.order_no }}</span>
        <span :class="['order-status', order.status]">{{ statusText[order.status] }}</span>
      </div>
      <div class="order-items">
        <div class="product-item" v-for="item in order.items" :key="item.id">
          <img :src="item.product_image" class="product-image" />
          <div class="product-info">
            <div class="product-name">{{ item.product_name }}</div>
            <div class="product-price">
              <span>¥{{ item.price }}</span>
              <span>x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="order-footer">
        <div class="order-total">
          共{{ order.items.length }}件商品 实付: <span class="total-price">¥{{ order.pay_amount }}</span>
        </div>
        <div class="order-actions">
          <van-button v-if="order.status === 'pending'" size="small" type="primary" @click="handlePay(order)">
            去支付
          </van-button>
          <van-button v-if="order.status === 'pending'" size="small" @click="handleCancel(order)">
            取消订单
          </van-button>
          <van-button v-if="order.status === 'completed'" size="small" type="default" @click="handleAgain(order)">
            再次购买
          </van-button>
        </div>
      </div>
    </div>

    <van-empty v-if="orderList.length === 0 && !loading" description="暂无订单" />
    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { getOrders, payOrder } from '../../api/user'

const props = defineProps({
  status: {
    type: String,
    default: 'all'
  }
})

const router = useRouter()

const orderList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)

const statusText = {
  pending: '待支付',
  processing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders({
      status: props.status === 'all' ? undefined : props.status,
      page: page.value,
      pageSize: pageSize.value
    })
    orderList.value = res.data.list || []
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePay = async (order) => {
  try {
    const res = await payOrder({ orderId: order.id, payMethod: 'wallet' })
    showToast('支付成功')
    fetchOrders()
  } catch (error) {
    console.error('支付失败:', error)
    showToast(error.message || '支付失败')
  }
}

const handleCancel = async (order) => {
  try {
    await showDialog({
      title: '提示',
      message: '确定要取消订单吗？'
    })
    showToast('订单已取消')
    fetchOrders()
  } catch {
    // 用户取消
  }
}

const handleAgain = (order) => {
  router.push('/home')
}

watch(() => props.status, () => {
  fetchOrders()
}, { immediate: true })

onMounted(() => {
  fetchOrders()
})
</script>

<style lang="less" scoped>
.orders-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.orders-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;

  .header-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    margin-right: 20px;
  }
}

.order-list {
  .order-item {
    background: #fff;
    margin: 8px 12px;
    border-radius: 8px;
    overflow: hidden;

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f7f8fa;

      .order-no {
        font-size: 12px;
        color: #969799;
      }

      .order-status {
        font-size: 13px;
        font-weight: 500;

        &.pending {
          color: #ff976a;
        }
        &.processing {
          color: #1989fa;
        }
        &.completed {
          color: #07c160;
        }
        &.cancelled,
        &.refunded {
          color: #969799;
        }
      }
    }

    .order-items {
      .product-item {
        display: flex;
        padding: 12px 16px;
        border-bottom: 1px solid #f7f8fa;

        .product-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          object-fit: cover;
          margin-right: 12px;
        }

        .product-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;

          .product-name {
            font-size: 14px;
            color: #323233;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .product-price {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #646566;

            span:first-child {
              color: #ee0a24;
              font-weight: 500;
            }
          }
        }
      }
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;

      .order-total {
        font-size: 13px;
        color: #646566;

        .total-price {
          font-size: 16px;
          font-weight: 600;
          color: #ee0a24;
        }
      }

      .order-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
