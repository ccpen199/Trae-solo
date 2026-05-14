<template>
  <div class="order-detail" v-if="order">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="header-title">订单详情</div>
    </div>

    <div class="scroll-content">
      <div class="status-card">
        <div class="status-icon">{{ getStatusIcon(order.status) }}</div>
        <div class="status-info">
          <div class="status-text">{{ getStatusText(order.status) }}</div>
          <div class="status-desc">{{ getStatusDesc(order.status) }}</div>
        </div>
      </div>

      <div class="address-card card">
        <div class="address-icon">📍</div>
        <div class="address-info">
          <div class="address-header">
            <span class="receiver">{{ order.receiver }}</span>
            <span class="phone">{{ order.phone }}</span>
          </div>
          <div class="address-detail">{{ order.address }}</div>
        </div>
      </div>

      <div class="product-card card">
        <div v-for="item in order.items" :key="item.id" class="product-item" @click="goProduct(item.product_id)">
          <img :src="item.product_image" class="product-image" />
          <div class="product-info">
            <div class="product-title text-ellipsis-2">{{ item.product_title }}</div>
            <div class="product-bottom">
              <span class="price">¥{{ item.price }}</span>
              <span class="qty">x{{ item.quantity }}</span>
              <span class="subtotal">¥{{ item.total_price }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card card">
        <div class="info-row">
          <span class="label">订单编号</span>
          <span class="value">{{ order.order_no }}</span>
        </div>
        <div class="info-row">
          <span class="label">下单时间</span>
          <span class="value">{{ formatTime(order.created_at) }}</span>
        </div>
        <div v-if="order.pay_time" class="info-row">
          <span class="label">支付时间</span>
          <span class="value">{{ formatTime(order.pay_time) }}</span>
        </div>
        <div v-if="order.ship_time" class="info-row">
          <span class="label">发货时间</span>
          <span class="value">{{ formatTime(order.ship_time) }}</span>
        </div>
      </div>

      <div class="summary-card card">
        <div class="summary-row">
          <span class="label">商品金额</span>
          <span class="value">¥{{ order.total_amount.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span class="label">优惠</span>
          <span class="value discount">-¥{{ order.discount_amount.toFixed(2) }}</span>
        </div>
        <div class="divider"></div>
        <div class="summary-row total">
          <span class="label">实付金额</span>
          <span class="value price">¥{{ order.pay_amount.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div v-if="order.status === 0 || order.status === 2" class="bottom-bar safe-area-bottom">
      <button 
        v-if="order.status === 0"
        class="btn btn-outline"
        @click="cancelOrder"
      >取消订单</button>
      <button 
        v-if="order.status === 0"
        class="btn btn-primary"
        @click="payOrder"
      >立即付款</button>
      <button 
        v-if="order.status === 2"
        class="btn btn-primary"
        @click="confirmOrder"
      >确认收货</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '../api';

const route = useRoute();
const router = useRouter();
const showToast = inject('showToast');

const order = ref(null);

const fetchDetail = async () => {
  try {
    const res = await orderApi.getOrderDetail(route.params.id);
    if (res.code === 200) {
      order.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const getStatusIcon = (status) => {
  const icons = {
    [-1]: '❌',
    0: '💳',
    1: '📦',
    2: '🚚',
    3: '✅'
  };
  return icons[status] || '📋';
};

const getStatusText = (status) => {
  const texts = {
    [-1]: '订单已取消',
    0: '待付款',
    1: '待发货',
    2: '待收货',
    3: '已完成'
  };
  return texts[status] || '未知状态';
};

const getStatusDesc = (status) => {
  const descs = {
    [-1]: '您的订单已取消',
    0: '请尽快完成支付',
    1: '商家正在准备发货',
    2: '商品已发货，请注意查收',
    3: '感谢您的购买，期待再次光临'
  };
  return descs[status] || '';
};

const goBack = () => {
  router.back();
};

const goProduct = (id) => {
  router.push(`/product/${id}`);
};

const cancelOrder = async () => {
  try {
    const res = await orderApi.cancelOrder(order.value.id);
    if (res.code === 200) {
      showToast('订单已取消');
      fetchDetail();
    }
  } catch (e) {
    showToast(e.response?.data?.message || '取消失败');
  }
};

const payOrder = async () => {
  try {
    const res = await orderApi.payOrder(order.value.id);
    if (res.code === 200) {
      showToast('支付成功');
      fetchDetail();
    }
  } catch (e) {
    showToast(e.response?.data?.message || '支付失败');
  }
};

const confirmOrder = async () => {
  try {
    const res = await orderApi.confirmOrder(order.value.id);
    if (res.code === 200) {
      showToast('确认收货成功');
      fetchDetail();
    }
  } catch (e) {
    showToast(e.response?.data?.message || '确认失败');
  }
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
.order-detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.header {
  position: sticky;
  top: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.back-btn {
  font-size: 20px;
  color: #333;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.scroll-content {
  padding-bottom: 12px;
}

.status-card {
  background: linear-gradient(135deg, #ff5000 0%, #ff6b00 100%);
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #fff;
}

.status-icon {
  font-size: 40px;
}

.status-info {
  flex: 1;
}

.status-text {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.status-desc {
  font-size: 13px;
  opacity: 0.9;
}

.address-card {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  margin: 12px;
  gap: 12px;
}

.address-icon {
  font-size: 20px;
  margin-top: 2px;
}

.address-info {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.receiver {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.phone {
  font-size: 14px;
  color: #666;
}

.address-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.product-card {
  margin: 12px;
  overflow: hidden;
}

.product-item {
  display: flex;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.product-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price {
  color: #ff4d4f;
  font-size: 14px;
}

.qty {
  font-size: 13px;
  color: #999;
}

.subtotal {
  margin-left: auto;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.info-card, .summary-card {
  margin: 12px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: #999;
}

.info-row .value {
  color: #333;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.summary-row.total {
  margin-bottom: 0;
}

.summary-row .label {
  color: #666;
}

.summary-row .value {
  color: #333;
}

.summary-row .value.discount {
  color: #52c41a;
}

.summary-row .value.price {
  color: #ff4d4f;
  font-size: 18px;
  font-weight: bold;
}

.summary-row.total .label {
  font-weight: bold;
  color: #333;
}

.divider {
  height: 1px;
  background: #f5f5f5;
  margin: 12px 0;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid #eee;
  z-index: 100;
}

.bottom-bar .btn {
  padding: 10px 24px;
  font-size: 14px;
}
</style>
