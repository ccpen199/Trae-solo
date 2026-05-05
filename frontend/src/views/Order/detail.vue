<template>
  <div class="order-detail-page page-container">
    <van-nav-bar title="订单详情" left-arrow @click-left="goBack" :placeholder="true" />
    
    <div v-if="order" class="order-detail-content">
      <div class="status-section bg-white">
        <div class="status-icon">
          <van-icon name="success" size="32" color="#52C41A" />
        </div>
        <div class="status-info">
          <div class="status-text" :style="{ color: statusInfo.color }">
            {{ statusInfo.text }}
          </div>
          <div class="status-desc">{{ statusInfo.desc }}</div>
        </div>
      </div>
      
      <div class="address-section bg-white rounded-8 mt-12" @click="goAddress">
        <div class="address-info">
          <div class="address-header flex-between">
            <span class="name">{{ order.address?.name }}</span>
            <span class="phone">{{ order.address?.phone }}</span>
          </div>
          <div class="address-detail">
            {{ order.address?.province }} {{ order.address?.city }} {{ order.address?.district }} {{ order.address?.address }}
          </div>
        </div>
      </div>
      
      <div class="goods-section bg-white rounded-8 mt-12">
        <div class="section-header">
          <span class="title">商品清单</span>
        </div>
        <div class="goods-list">
          <div 
            v-for="item in order.items" 
            :key="item.id" 
            class="goods-item flex"
          >
            <img :src="item.product_image" class="goods-image" alt="" />
            <div class="goods-info flex-1">
              <div class="goods-name">{{ item.product_name }}</div>
              <div class="goods-bottom flex-between">
                <div class="price">
                  <span class="current-price">¥{{ item.price }}</span>
                </div>
                <div class="quantity">x {{ item.quantity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="summary-section bg-white rounded-8 mt-12">
        <div class="summary-item flex-between">
          <span class="label">订单编号</span>
          <span class="value">{{ order.order_no }}</span>
        </div>
        <div class="summary-item flex-between">
          <span class="label">商品金额</span>
          <span class="value">¥{{ order.total_amount?.toFixed(2) }}</span>
        </div>
        <div class="summary-item flex-between">
          <span class="label">优惠金额</span>
          <span class="value discount">-¥{{ order.discount_amount?.toFixed(2) || '0.00' }}</span>
        </div>
        <div class="summary-item flex-between">
          <span class="label">运费</span>
          <span class="value">¥0.00</span>
        </div>
        <van-divider />
        <div class="summary-item flex-between total">
          <span class="label">实付金额</span>
          <span class="value">¥{{ order.pay_amount?.toFixed(2) }}</span>
        </div>
        <div class="summary-item flex-between">
          <span class="label">下单时间</span>
          <span class="value">{{ order.created_at }}</span>
        </div>
      </div>
    </div>
    
    <van-empty v-else description="加载中..." />
    
    <div v-if="order && (order.status === 0 || order.status === 2)" class="bottom-bar bottom-nav safe-bottom bg-white">
      <div class="bar-right">
        <van-button 
          v-if="order.status === 0"
          size="large"
          @click="handleCancel"
        >
          取消订单
        </van-button>
        <van-button 
          v-if="order.status === 0"
          type="primary" 
          size="large"
          :loading="paying"
          @click="handlePay"
        >
          去支付
        </van-button>
        <van-button 
          v-if="order.status === 2"
          type="primary" 
          size="large"
          @click="handleConfirm"
        >
          确认收货
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import request from '@/utils/axios';

const router = useRouter();
const route = useRoute();

const order = ref(null);
const paying = ref(false);

const statusMap = {
  '-1': { text: '已取消', color: '#999', desc: '订单已取消' },
  0: { text: '待支付', color: '#FF4D4F', desc: '请尽快完成支付' },
  1: { text: '待发货', color: '#FAAD14', desc: '商家正在准备商品' },
  2: { text: '配送中', color: '#1890FF', desc: '商品正在配送中，请耐心等待' },
  3: { text: '已完成', color: '#52C41A', desc: '订单已完成，感谢您的购买' }
};

const statusInfo = computed(() => {
  return statusMap[order.value?.status] || { text: '未知', color: '#999', desc: '' };
});

const goBack = () => {
  router.back();
};

const goAddress = () => {
  router.push('/address');
};

const handlePay = async () => {
  paying.value = true;
  try {
    await request.post('/order/pay', { orderId: order.value.id });
    showToast('支付成功');
    fetchOrder();
  } catch (error) {
    console.error('支付失败:', error);
  } finally {
    paying.value = false;
  }
};

const handleCancel = async () => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要取消订单吗？'
    });
    
    await request.post('/order/cancel', { orderId: order.value.id });
    showToast('订单已取消');
    fetchOrder();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error);
    }
  }
};

const handleConfirm = async () => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确认已收到商品吗？'
    });
    
    await request.post('/order/confirm', { orderId: order.value.id });
    showToast('确认收货成功');
    fetchOrder();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认收货失败:', error);
    }
  }
};

const fetchOrder = async () => {
  try {
    const orderId = route.params.orderId;
    const res = await request.get(`/order/${orderId}`);
    order.value = res.data;
  } catch (error) {
    console.error('获取订单详情失败:', error);
  }
};

onMounted(() => {
  fetchOrder();
});
</script>

<style lang="less" scoped>
.order-detail-page {
  padding-bottom: 70px;
  background: #f5f5f5;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.order-detail-content {
  padding: 12px;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  
  .status-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(82, 196, 26, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .status-info {
    .status-text {
      font-size: 18px;
      font-weight: 600;
    }
    
    .status-desc {
      font-size: 13px;
      color: #999;
      margin-top: 4px;
    }
  }
}

.address-section {
  padding: 16px;
  
  .address-info {
    .address-header {
      margin-bottom: 8px;
      
      .name {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }
      
      .phone {
        font-size: 14px;
        color: #666;
      }
    }
    
    .address-detail {
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }
  }
}

.goods-section {
  padding: 16px;
  
  .section-header {
    margin-bottom: 12px;
    
    .title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .goods-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .goods-item {
      gap: 12px;
      
      .goods-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        object-fit: cover;
        background: #f5f5f5;
      }
      
      .goods-info {
        display: flex;
        flex-direction: column;
        
        .goods-name {
          font-size: 14px;
          color: #333;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .goods-bottom {
          margin-top: auto;
          
          .current-price {
            font-size: 16px;
            color: #FF4D4F;
            font-weight: 600;
          }
          
          .quantity {
            font-size: 14px;
            color: #666;
          }
        }
      }
    }
  }
}

.summary-section {
  padding: 16px;
  
  .summary-item {
    padding: 8px 0;
    font-size: 14px;
    
    .label {
      color: #666;
    }
    
    .value {
      color: #333;
      
      &.discount {
        color: #52C41A;
      }
    }
    
    &.total {
      .label {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }
      
      .value {
        font-size: 18px;
        font-weight: 600;
        color: #FF4D4F;
      }
    }
  }
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px;
  border-top: 1px solid #eee;
  
  .bar-right {
    display: flex;
    gap: 12px;
    
    :deep(.van-button) {
      min-width: 100px;
      height: 40px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    
    :deep(.van-button--primary) {
      --van-button-primary-background: #FF4D4F;
      --van-button-primary-border-color: #FF4D4F;
    }
  }
}
</style>
