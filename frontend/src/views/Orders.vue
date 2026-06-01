<template>
  <div class="orders">
    <van-nav-bar title="我的订单" left-arrow @click-left="goBack" fixed placeholder />

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="全部" name="0" />
      <van-tab title="待付款" name="1" />
      <van-tab title="待消费" name="2" />
      <van-tab title="已完成" name="5" />
    </van-tabs>

    <div class="order-list">
      <div class="order-card" v-for="order in orders" :key="order.id">
        <div class="order-header">
          <span class="order-no">订单号：{{ order.order_no }}</span>
          <span class="order-status" :class="'status-' + order.status">{{ getStatusText(order.status) }}</span>
        </div>
        <div class="order-goods">
          <div class="goods-item" v-for="item in order.items" :key="item.id">
            <img :src="item.product_image" :alt="item.product_name" class="goods-img" />
            <div class="goods-info">
              <div class="goods-name">{{ item.product_name }}</div>
              <div class="goods-price">¥{{ item.price }}</div>
              <div class="goods-quantity">x{{ item.quantity }}</div>
            </div>
          </div>
        </div>
        <div class="order-footer">
          <div class="order-total">
            共{{ getTotalQuantity(order) }}件，实付：<span class="total-price">¥{{ order.pay_amount }}</span>
          </div>
          <div class="order-actions">
            <van-button size="small" plain type="primary" v-if="order.status === 1" @click="cancelOrder(order.id)">
              取消订单
            </van-button>
            <van-button size="small" type="primary" v-if="order.status === 1" @click="payOrder(order.id)">
              去支付
            </van-button>
            <van-button size="small" type="primary" v-if="order.status === 2" @click="goPickup(order.id)">
              自提码
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <div class="empty" v-if="orders.length === 0">
      <van-empty description="暂无订单" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import request from '@/utils/request';

const router = useRouter();
const activeTab = ref('0');
const orders = ref([]);

const statusMap = {
  0: '待确认',
  1: '待付款',
  2: '待消费',
  3: '消费中',
  4: '待评价',
  5: '已完成',
  6: '已取消'
};

const getStatusText = (status) => statusMap[status] || '未知';

const getTotalQuantity = (order) => {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
};

const getOrders = async () => {
  const status = activeTab.value === '0' ? undefined : parseInt(activeTab.value);
  const res = await request.get('/orders', { params: { status } });
  orders.value = res || [];
};

const cancelOrder = async (id) => {
  try {
    await showConfirmDialog({ title: '提示', message: '确定取消该订单吗？' });
    await request.post('/orders/cancel', { id });
    showToast('取消成功');
    getOrders();
  } catch {
    // 取消操作
  }
};

const payOrder = async (id) => {
  try {
    await request.post('/orders/pay', { id });
    showToast('支付成功');
    getOrders();
  } catch (e) {
    showToast('支付失败');
  }
};

const goPickup = (id) => {
  router.push(`/pickup/${id}`);
};

const goBack = () => {
  router.back();
};

watch(activeTab, () => {
  getOrders();
});

onMounted(() => {
  getOrders();
});
</script>

<style scoped lang="less">
.orders {
  min-height: 100vh;
  background: #f5f5f5;
}

.order-list {
  padding: 10px;
}

.order-card {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 13px;
  color: #666;
}

.order-status {
  font-size: 13px;
  font-weight: 500;

  &.status-1 {
    color: #ff6b35;
  }
  &.status-2 {
    color: #07c160;
  }
  &.status-5 {
    color: #999;
  }
  &.status-6 {
    color: #999;
  }
}

.order-goods {
  padding: 10px 15px;
}

.goods-item {
  display: flex;
  padding: 8px 0;
}

.goods-img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
}

.goods-info {
  flex: 1;
  margin-left: 12px;
  position: relative;
}

.goods-name {
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-price {
  color: #ff6b35;
  font-size: 13px;
  font-weight: 500;
}

.goods-quantity {
  position: absolute;
  right: 0;
  bottom: 0;
  color: #999;
  font-size: 13px;
}

.order-footer {
  padding: 12px 15px;
  border-top: 1px solid #f0f0f0;
}

.order-total {
  font-size: 13px;
  text-align: right;
  margin-bottom: 10px;
}

.total-price {
  color: #ff6b35;
  font-size: 16px;
  font-weight: 600;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty {
  padding-top: 100px;
}
</style>
