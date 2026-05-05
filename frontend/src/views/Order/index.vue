<template>
  <div class="order-page page-container">
    <van-nav-bar title="我的订单" left-arrow @click-left="goBack" :placeholder="true" />
    
    <van-tabs v-model:active="activeTab">
      <van-tab title="全部">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <div v-if="orders.length > 0" class="order-list">
              <div 
                v-for="order in orders" 
                :key="order.id" 
                class="order-item bg-white"
                @click="goDetail(order.id)"
              >
                <div class="order-header flex-between">
                  <span class="order-no">订单号：{{ order.order_no }}</span>
                  <span class="order-status" :style="{ color: getStatusInfo(order.status).color }">
                    {{ getStatusInfo(order.status).text }}
                  </span>
                </div>
                
                <div class="order-goods">
                  <div 
                    v-for="item in order.items?.slice(0, 2)" 
                    :key="item.id" 
                    class="goods-item flex"
                  >
                    <img :src="item.product_image" class="goods-image" alt="" />
                    <div class="goods-info flex-1">
                      <div class="goods-name">{{ item.product_name }}</div>
                      <div class="goods-price">¥{{ item.price }} x {{ item.quantity }}</div>
                    </div>
                  </div>
                  <div v-if="order.items?.length > 2" class="more-text">
                    共{{ order.items.length }}件商品
                  </div>
                </div>
                
                <div class="order-footer flex-between">
                  <div class="order-amount">
                    <span class="label">订单金额：</span>
                    <span class="amount">¥{{ order.pay_amount }}</span>
                  </div>
                  <div class="order-actions">
                    <van-button 
                      v-if="order.status === 0"
                      size="small"
                      @click.stop="handleCancel(order)"
                    >
                      取消订单
                    </van-button>
                    <van-button 
                      v-if="order.status === 0"
                      type="primary" 
                      size="small"
                      @click.stop="handlePay(order)"
                    >
                      去支付
                    </van-button>
                    <van-button 
                      v-if="order.status === 2"
                      type="primary" 
                      size="small"
                      @click.stop="handleConfirm(order)"
                    >
                      确认收货
                    </van-button>
                  </div>
                </div>
              </div>
            </div>
            <van-empty v-else description="暂无订单" />
          </van-list>
        </van-pull-refresh>
      </van-tab>
      
      <van-tab title="待支付">
        <van-pull-refresh v-model="refreshing2" @refresh="onRefresh(2)">
          <van-list
            v-model:loading="loading2"
            :finished="finished2"
            finished-text="没有更多了"
            @load="onLoad(2)"
          >
            <div v-if="orders2.length > 0" class="order-list">
              <div 
                v-for="order in orders2" 
                :key="order.id" 
                class="order-item bg-white"
                @click="goDetail(order.id)"
              >
                <div class="order-header flex-between">
                  <span class="order-no">订单号：{{ order.order_no }}</span>
                  <span class="order-status" :style="{ color: getStatusInfo(order.status).color }">
                    {{ getStatusInfo(order.status).text }}
                  </span>
                </div>
                <div class="order-footer flex-between">
                  <div class="order-amount">
                    <span class="label">订单金额：</span>
                    <span class="amount">¥{{ order.pay_amount }}</span>
                  </div>
                  <div class="order-actions">
                    <van-button size="small" @click.stop="handleCancel(order)">取消订单</van-button>
                    <van-button type="primary" size="small" @click.stop="handlePay(order)">去支付</van-button>
                  </div>
                </div>
              </div>
            </div>
            <van-empty v-else description="暂无待支付订单" />
          </van-list>
        </van-pull-refresh>
      </van-tab>
      
      <van-tab title="待收货">
        <van-empty description="暂无待收货订单" />
      </van-tab>
      
      <van-tab title="已完成">
        <van-empty description="暂无已完成订单" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import request from '@/utils/axios';

const router = useRouter();

const activeTab = ref(0);

const orders = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);

const orders2 = ref([]);
const loading2 = ref(false);
const finished2 = ref(false);
const refreshing2 = ref(false);
const page2 = ref(1);

const pageSize = 10;

const statusMap = {
  '-1': { text: '已取消', color: '#999' },
  0: { text: '待支付', color: '#FF4D4F' },
  1: { text: '待发货', color: '#FAAD14' },
  2: { text: '配送中', color: '#1890FF' },
  3: { text: '已完成', color: '#52C41A' }
};

const getStatusInfo = (status) => {
  return statusMap[status] || { text: '未知', color: '#999' };
};

const goBack = () => {
  router.back();
};

const goDetail = (orderId) => {
  router.push(`/order/${orderId}`);
};

const handlePay = async (order) => {
  try {
    await request.post('/order/pay', { orderId: order.id });
    showToast('支付成功');
    fetchOrders();
  } catch (error) {
    console.error('支付失败:', error);
  }
};

const handleCancel = async (order) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要取消订单吗？'
    });
    
    await request.post('/order/cancel', { orderId: order.id });
    showToast('订单已取消');
    fetchOrders();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error);
    }
  }
};

const handleConfirm = async (order) => {
  try {
    await request.post('/order/confirm', { orderId: order.id });
    showToast('确认收货成功');
    fetchOrders();
  } catch (error) {
    console.error('确认收货失败:', error);
  }
};

const fetchOrders = async (tabIndex = 0) => {
  if (tabIndex === 0) {
    loading.value = true;
  } else {
    loading2.value = true;
  }
  
  try {
    const params = { 
      limit: pageSize, 
      offset: (tabIndex === 0 ? page.value : page2.value - 1) * pageSize 
    };
    
    if (tabIndex === 1) {
      params.status = 0;
    } else if (tabIndex === 2) {
      params.status = 1;
    } else if (tabIndex === 3) {
      params.status = 3;
    }
    
    const res = await request.get('/order', { params });
    
    if (tabIndex === 0) {
      orders.value = page.value === 1 ? res.data : [...orders.value, ...res.data];
      finished.value = res.data.length < pageSize;
      loading.value = false;
      refreshing.value = false;
    } else if (tabIndex === 1) {
      orders2.value = page2.value === 1 ? res.data : [...orders2.value, ...res.data];
      finished2.value = res.data.length < pageSize;
      loading2.value = false;
      refreshing2.value = false;
    }
  } catch (error) {
    console.error('获取订单列表失败:', error);
    loading.value = false;
    loading2.value = false;
    refreshing.value = false;
    refreshing2.value = false;
  }
};

const onLoad = (tabIndex = 0) => {
  if (tabIndex === 0) {
    page.value++;
  } else {
    page2.value++;
  }
  fetchOrders(tabIndex);
};

const onRefresh = (tabIndex = 0) => {
  if (tabIndex === 0) {
    page.value = 1;
    finished.value = false;
    orders.value = [];
  } else {
    page2.value = 1;
    finished2.value = false;
    orders2.value = [];
  }
  fetchOrders(tabIndex);
};

fetchOrders();
</script>

<style lang="less" scoped>
.order-page {
  background: #f5f5f5;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

:deep(.van-tabs__wrap) {
  position: sticky;
  top: 46px;
  z-index: 9;
  background: #fff;
}

:deep(.order-list) {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .order-item {
    border-radius: 8px;
    padding: 12px;
    
    .order-header {
      padding-bottom: 12px;
      border-bottom: 1px solid #f5f5f5;
      
      .order-no {
        font-size: 13px;
        color: #666;
      }
      
      .order-status {
        font-size: 14px;
        font-weight: 600;
      }
    }
    
    .order-goods {
      padding: 12px 0;
      
      .goods-item {
        gap: 12px;
        margin-bottom: 8px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .goods-image {
          width: 64px;
          height: 64px;
          border-radius: 4px;
          object-fit: cover;
          background: #f5f5f5;
        }
        
        .goods-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          
          .goods-name {
            font-size: 13px;
            color: #333;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .goods-price {
            font-size: 13px;
            color: #FF4D4F;
            margin-top: 4px;
          }
        }
      }
      
      .more-text {
        font-size: 12px;
        color: #999;
        text-align: right;
        margin-top: 8px;
      }
    }
    
    .order-footer {
      padding-top: 12px;
      border-top: 1px solid #f5f5f5;
      
      .order-amount {
        .label {
          font-size: 13px;
          color: #666;
        }
        
        .amount {
          font-size: 16px;
          color: #FF4D4F;
          font-weight: 600;
        }
      }
      
      .order-actions {
        display: flex;
        gap: 8px;
        
        :deep(.van-button) {
          height: 32px;
          font-size: 13px;
        }
      }
    }
  }
}
</style>
