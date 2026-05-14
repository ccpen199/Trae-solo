<template>
  <div class="order page-container">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="header-title">我的订单</div>
    </div>

    <div class="tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab" 
        :class="{ active: activeTab === tab.value }"
        @click="changeTab(tab.value)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div v-if="orders.length > 0" class="order-list">
      <div v-for="order in orders" :key="order.id" class="order-card card" @click="goDetail(order.id)">
        <div class="order-header">
          <span class="shop-name">{{ order.items?.[0]?.product_title || '商品' }}</span>
          <span class="order-status" :class="'status-' + order.status">
            {{ getStatusText(order.status) }}
          </span>
        </div>

        <div v-for="item in order.items" :key="item.id" class="order-item">
          <img :src="item.product_image" class="product-image" />
          <div class="product-info">
            <div class="product-title text-ellipsis-2">{{ item.product_title }}</div>
            <div class="product-price">
              <span class="price">¥{{ item.price }}</span>
              <span class="qty">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <div class="order-total">
            共 {{ order.items?.length || 0 }} 件商品，实付：
            <span class="price">¥{{ order.pay_amount }}</span>
          </div>
          <div class="order-actions" @click.stop>
            <button 
              v-if="order.status === 0" 
              class="btn btn-outline"
              @click="cancelOrder(order)"
            >取消订单</button>
            <button 
              v-if="order.status === 0" 
              class="btn btn-primary"
              @click="payOrder(order)"
            >去付款</button>
            <button 
              v-if="order.status === 2" 
              class="btn btn-primary"
              @click="confirmOrder(order)"
            >确认收货</button>
            <button 
              v-if="order.status === 3" 
              class="btn btn-outline"
              @click="goComment(order)"
            >去评价</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!hasMore" class="no-more">没有更多了</div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <div class="icon">📋</div>
      <div class="text">暂无订单</div>
      <button class="btn btn-primary mt-12" @click="goShopping">去逛逛</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '../api';

const route = useRoute();
const router = useRouter();
const showToast = inject('showToast');

const activeTab = ref(route.query.status !== undefined ? parseInt(route.query.status) : -1);
const orders = ref([]);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);
const hasMore = ref(true);

const tabs = computed(() => [
  { label: '全部', value: -1 },
  { label: '待付款', value: 0 },
  { label: '待发货', value: 1 },
  { label: '待收货', value: 2 },
  { label: '已完成', value: 3 }
]);

const getStatusText = (status) => {
  const statusMap = {
    [-1]: '已取消',
    0: '待付款',
    1: '待发货',
    2: '待收货',
    3: '已完成'
  };
  return statusMap[status] || '未知状态';
};

const fetchOrders = async (refresh = false) => {
  if (loading.value || (!hasMore.value && !refresh)) return;
  
  loading.value = true;
  
  if (refresh) {
    page.value = 1;
    orders.value = [];
    hasMore.value = true;
  }
  
  try {
    const params = {
      page: page.value,
      pageSize
    };
    if (activeTab.value >= 0) {
      params.status = activeTab.value;
    }
    
    const res = await orderApi.getOrders(params);
    if (res.code === 200) {
      if (refresh) {
        orders.value = res.data.list;
      } else {
        orders.value = [...orders.value, ...res.data.list];
      }
      
      hasMore.value = res.data.list.length >= pageSize;
      if (hasMore.value) {
        page.value++;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const changeTab = (value) => {
  activeTab.value = value;
  fetchOrders(true);
};

const goBack = () => {
  router.back();
};

const goDetail = (id) => {
  router.push(`/order/${id}`);
};

const goShopping = () => {
  router.push('/');
};

const cancelOrder = async (order) => {
  try {
    const res = await orderApi.cancelOrder(order.id);
    if (res.code === 200) {
      showToast('订单已取消');
      fetchOrders(true);
    }
  } catch (e) {
    showToast(e.response?.data?.message || '取消失败');
  }
};

const payOrder = async (order) => {
  try {
    const res = await orderApi.payOrder(order.id);
    if (res.code === 200) {
      showToast('支付成功');
      fetchOrders(true);
    }
  } catch (e) {
    showToast(e.response?.data?.message || '支付失败');
  }
};

const confirmOrder = async (order) => {
  try {
    const res = await orderApi.confirmOrder(order.id);
    if (res.code === 200) {
      showToast('确认收货成功');
      fetchOrders(true);
    }
  } catch (e) {
    showToast(e.response?.data?.message || '确认失败');
  }
};

const goComment = (order) => {
  showToast('评价功能开发中');
};

const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight || window.innerHeight;
  
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    fetchOrders();
  }
};

onMounted(() => {
  fetchOrders(true);
  window.addEventListener('scroll', handleScroll);
});

onActivated(() => {
  fetchOrders(true);
});
</script>

<style scoped>
.order {
  background: #f5f5f5;
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

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 52px;
  z-index: 99;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 14px;
  color: #666;
  position: relative;
}

.tab.active {
  color: #ff5000;
  font-weight: bold;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: #ff5000;
  border-radius: 2px;
}

.order-list {
  padding: 12px;
}

.order-card {
  margin-bottom: 12px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.shop-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.order-status {
  font-size: 13px;
}

.order-status.status-0 { color: #ff4d4f; }
.order-status.status-1 { color: #fa8c16; }
.order-status.status-2 { color: #1890ff; }
.order-status.status-3 { color: #52c41a; }
.order-status.status--1 { color: #999; }

.order-item {
  display: flex;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 1px solid #f5f5f5;
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

.product-price {
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

.order-footer {
  padding: 12px 16px;
}

.order-total {
  text-align: right;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.order-total .price {
  font-size: 16px;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.order-actions .btn {
  padding: 6px 16px;
  font-size: 13px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-state .icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state .text {
  color: #999;
  font-size: 14px;
}

.loading, .no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
