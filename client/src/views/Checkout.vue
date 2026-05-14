<template>
  <div class="checkout page-container">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="header-title">确认订单</div>
    </div>

    <div class="address-card card">
      <div class="address-icon">📍</div>
      <div class="address-info">
        <div class="address-header">
          <span class="receiver">{{ address.receiver }}</span>
          <span class="phone">{{ address.phone }}</span>
        </div>
        <div class="address-detail">{{ address.address }}</div>
      </div>
      <div class="arrow">›</div>
    </div>

    <div class="product-card card">
      <div class="card-header">
        <span class="card-title">商品列表</span>
        <span class="count">共 {{ items.length }} 件</span>
      </div>
      <div v-for="item in items" :key="item.id" class="product-item">
        <img :src="item.cover_image" class="product-image" />
        <div class="product-info">
          <div class="product-title text-ellipsis-2">{{ item.title }}</div>
          <div class="product-bottom">
            <span class="price">¥{{ item.price }}</span>
            <span class="qty">x{{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="summary-card card">
      <div class="summary-row">
        <span class="label">商品金额</span>
        <span class="value">¥{{ totalAmount.toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span class="label">运费</span>
        <span class="value">¥{{ shipping.toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span class="label">优惠</span>
        <span class="value discount">-¥{{ discount.toFixed(2) }}</span>
      </div>
      <div class="divider"></div>
      <div class="summary-row total">
        <span class="label">实付金额</span>
        <span class="value price">¥{{ payAmount.toFixed(2) }}</span>
      </div>
    </div>

    <div class="bottom-bar safe-area-bottom">
      <div class="total-section">
        <span class="label">实付：</span>
        <span class="price">¥{{ payAmount.toFixed(2) }}</span>
      </div>
      <button 
        class="btn btn-primary submit-btn"
        @click="submitOrder"
        :disabled="loading"
      >
        {{ loading ? '提交中...' : '提交订单' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '../api';

const route = useRoute();
const router = useRouter();
const showToast = inject('showToast');

const items = ref([]);
const loading = ref(false);

const address = ref({
  receiver: '张三',
  phone: '138****8000',
  address: '北京市朝阳区xxx路xxx小区xxx号楼xxx单元xxx室'
});

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const shipping = computed(() => {
  return totalAmount.value >= 99 ? 0 : 10;
});

const discount = computed(() => {
  return 0;
});

const payAmount = computed(() => {
  return totalAmount.value + shipping.value - discount.value;
});

const goBack = () => {
  router.back();
};

const submitOrder = async () => {
  if (items.value.length === 0) {
    showToast('请选择商品');
    return;
  }
  
  loading.value = true;
  
  try {
    const orderItems = items.value.map(item => ({
      productId: item.product_id,
      skuId: item.sku_id,
      quantity: item.quantity,
      cartId: item.id
    }));
    
    const res = await orderApi.createOrder({
      items: orderItems,
      address: address.value.address,
      phone: '13800138000',
      receiver: address.value.receiver
    });
    
    if (res.code === 200) {
      showToast('下单成功');
      router.replace(`/order/${res.data.orderId}`);
    } else {
      showToast(res.message || '下单失败');
    }
  } catch (e) {
    console.error(e);
    showToast(e.response?.data?.message || '下单失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  try {
    const itemsParam = route.query.items;
    if (itemsParam) {
      items.value = JSON.parse(decodeURIComponent(itemsParam));
    }
  } catch (e) {
    console.error(e);
  }
});
</script>

<style scoped>
.checkout {
  background: #f5f5f5;
  padding-bottom: 70px;
  min-height: 100vh;
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

.address-card {
  display: flex;
  align-items: center;
  padding: 16px;
  margin: 12px;
  gap: 12px;
}

.address-icon {
  font-size: 24px;
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

.arrow {
  font-size: 20px;
  color: #ccc;
}

.product-card {
  margin: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.card-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.count {
  font-size: 13px;
  color: #999;
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
  justify-content: space-between;
  align-items: center;
}

.price {
  color: #ff4d4f;
  font-weight: bold;
}

.qty {
  font-size: 13px;
  color: #999;
}

.summary-card {
  margin: 12px;
  padding: 16px;
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

.label {
  color: #666;
}

.value {
  color: #333;
}

.value.discount {
  color: #52c41a;
}

.value.price {
  color: #ff4d4f;
  font-size: 18px;
  font-weight: bold;
}

.summary-row.total .label {
  font-weight: bold;
  color: #333;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #eee;
  z-index: 100;
}

.total-section {
  flex: 1;
}

.total-section .label {
  font-size: 14px;
}

.total-section .price {
  font-size: 20px;
  font-weight: bold;
  color: #ff4d4f;
}

.submit-btn {
  height: 44px;
  padding: 0 32px;
  font-size: 15px;
  font-weight: bold;
}

.submit-btn:disabled {
  opacity: 0.7;
}
</style>
