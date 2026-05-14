<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">确认订单</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="address-section">
        <div class="address-icon">📍</div>
        <div class="address-info">
          <div class="address-user">{{ address.name }} {{ address.phone }}</div>
          <div class="address-detail">{{ address.address }}</div>
        </div>
        <div class="address-arrow">›</div>
      </div>

      <div class="product-section">
        <div class="section-header">商品清单</div>
        <div 
          v-for="item in checkoutItems" 
          :key="item.product_id"
          class="checkout-item"
        >
          <img :src="item.images?.[0]" alt="Product" class="checkout-image" />
          <div class="checkout-info">
            <h3 class="checkout-name">{{ item.name }}</h3>
            <span class="checkout-spec">{{ item.spec }}</span>
            <div class="checkout-bottom">
              <span class="checkout-price">¥{{ item.price }}</span>
              <span class="checkout-quantity">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-row">
          <span>商品金额</span>
          <span>¥{{ totalAmount }}</span>
        </div>
        <div class="summary-row">
          <span>运费</span>
          <span>¥{{ shippingFee }}</span>
        </div>
        <div class="summary-row">
          <span>优惠</span>
          <span class="discount">-¥{{ discount }}</span>
        </div>
        <div class="summary-row total">
          <span>实付款</span>
          <span class="total-price">¥{{ finalAmount }}</span>
        </div>
      </div>

      <div class="remark-section">
        <textarea 
          v-model="remark" 
          placeholder="订单备注（选填）"
          class="remark-input"
        ></textarea>
      </div>
    </div>

    <div class="bottom-bar safe-area-bottom">
      <div class="bottom-left">
        <span>合计：</span>
        <span class="total-price">¥{{ finalAmount }}</span>
      </div>
      <button 
        class="btn-submit" 
        :disabled="isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? '提交中...' : '提交订单' }}
      </button>
    </div>

    <div v-if="showPayModal" class="modal-mask" @click="showPayModal = false">
      <div class="pay-modal" @click.stop>
        <div class="modal-header">
          <span>选择支付方式</span>
        </div>
        <div class="pay-methods">
          <div 
            v-for="method in payMethods" 
            :key="method.id"
            class="pay-method"
            :class="{ active: selectedPayMethod === method.id }"
            @click="selectedPayMethod = method.id"
          >
            <span class="pay-icon">{{ method.icon }}</span>
            <span class="pay-name">{{ method.name }}</span>
            <div class="pay-check" :class="{ checked: selectedPayMethod === method.id }"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showPayModal = false">取消</button>
          <button class="btn-pay" @click="handlePay">立即支付 ¥{{ finalAmount }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { orderAPI, productAPI } from '../api';
const router = useRouter();
const address = ref({
 name: '张三',
 phone: '138****8888',
 address: '广东省深圳市南山区科技园路88号'
});
const checkoutItems = ref([]);
const remark = ref('');
const isSubmitting = ref(false);
const showPayModal = ref(false);
const selectedPayMethod = ref('alipay');
const payMethods = [
 { id: 'alipay', name: '支付宝', icon: '💳' },
 { id: 'wechat', name: '微信支付', icon: '💬' },
 { id: 'bank', name: '银行卡', icon: '🏦' }
];
const shippingFee = 0;
const discount = 0;
const totalAmount = computed(() => {
 return checkoutItems.value.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
});
const finalAmount = computed(() => {
 return totalAmount.value + shippingFee - discount;
});
async function loadCheckoutItems() {
 try {
 const itemsStr = sessionStorage.getItem('checkoutItems');
 if (!itemsStr) {
 router.push('/cart');
 return;
 }
 const items = JSON.parse(itemsStr);
 const productIds = [...new Set(items.map(item => item.product_id))];
 const products = {};
 for (const id of productIds) {
 const res = await productAPI.getProduct(id);
 if (res.success) {
 products[id] = res.data.product;
 }
 }
 checkoutItems.value = items.map(item => ({
 ...item,
 ...products[item.product_id]
 }));
 }
 catch (err) {
 console.error('加载商品信息失败:', err);
 }
}
function goBack() {
 router.back();
}
async function handleSubmit() {
 if (checkoutItems.value.length === 0) {
 const event = new CustomEvent('showToast', { detail: '请选择商品' });
 window.dispatchEvent(event);
 return;
 }
 isSubmitting.value = true;
 try {
 const items = checkoutItems.value.map(item => ({
 cart_id: item.cart_id,
 product_id: item.product_id,
 quantity: item.quantity,
 spec: item.spec
 }));
 const res = await orderAPI.createOrder({
 items,
 shipping_address: `${address.value.name} ${address.value.phone} ${address.value.address}`
 });
 if (res.success) {
 sessionStorage.removeItem('checkoutItems');
 const event = new CustomEvent('showToast', { detail: '订单创建成功' });
 window.dispatchEvent(event);
 showPayModal.value = true;
 }
 else {
 const event = new CustomEvent('showToast', { detail: res.message || '创建订单失败' });
 window.dispatchEvent(event);
 }
 }
 catch (err) {
 const event = new CustomEvent('showToast', { detail: err.message || '创建订单失败' });
 window.dispatchEvent(event);
 }
 finally {
 isSubmitting.value = false;
 }
}
async function handlePay() {
 showPayModal.value = false;
 const event = new CustomEvent('showToast', { detail: '支付成功' });
 window.dispatchEvent(event);
 setTimeout(() => {
 router.push('/orders');
 }, 1500);
}
onMounted(() => {
 loadCheckoutItems();
});
</script>

<style scoped>
.content {
  padding-top: 54px;
  padding-bottom: 80px;
}

.address-section {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 15px;
  margin: 10px;
  border-radius: 8px;
}

.address-icon {
  font-size: 24px;
  margin-right: 10px;
}

.address-info {
  flex: 1;
}

.address-user {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.address-detail {
  font-size: 14px;
  color: var(--gray-color);
  line-height: 1.4;
}

.address-arrow {
  color: var(--gray-color);
  font-size: 18px;
}

.product-section {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  padding: 15px;
  font-size: 14px;
  font-weight: bold;
  border-bottom: 1px solid var(--border-color);
}

.checkout-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
}

.checkout-item:last-child {
  border-bottom: none;
}

.checkout-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 10px;
}

.checkout-info {
  flex: 1;
  min-width: 0;
}

.checkout-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 5px;
}

.checkout-spec {
  font-size: 12px;
  color: var(--gray-color);
  margin-bottom: 10px;
}

.checkout-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkout-price {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-color);
}

.summary-section {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  padding: 15px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.summary-row.total {
  padding-top: 15px;
  margin-top: 8px;
  border-top: 1px solid var(--border-color);
}

.discount {
  color: var(--primary-color);
}

.total-price {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.remark-section {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  padding: 15px;
}

.remark-input {
  width: 100%;
  height: 60px;
  border: none;
  resize: none;
  font-size: 14px;
  color: #333;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 10px;
  border-top: 1px solid var(--border-color);
}

.bottom-left {
  font-size: 14px;
}

.btn-submit {
  padding: 12px 40px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
}

.btn-submit:disabled {
  background: #ccc;
}

.pay-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 15px 15px 0 0;
  padding: 15px;
}

.modal-header {
  padding: 15px 0;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
}

.pay-methods {
  padding: 15px 0;
}

.pay-method {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color);
}

.pay-method:last-child {
  border-bottom: none;
}

.pay-icon {
  font-size: 24px;
  margin-right: 15px;
}

.pay-name {
  flex: 1;
  font-size: 16px;
}

.pay-check {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
}

.pay-check.checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.pay-check.checked::after {
  content: '✓';
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  flex: 1;
  padding: 15px;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 16px;
}

.btn-pay {
  flex: 2;
  padding: 15px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
}
</style>