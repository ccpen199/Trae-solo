<template>
  <div class="checkout-page page-container">
    <van-nav-bar title="确认订单" left-arrow @click-left="goBack" :placeholder="true" />
    
    <div class="checkout-content">
      <div class="address-section bg-white rounded-8" @click="goAddress">
        <div v-if="selectedAddress" class="address-info">
          <div class="address-header flex-between">
            <span class="name">{{ selectedAddress.name }}</span>
            <span class="phone">{{ selectedAddress.phone }}</span>
          </div>
          <div class="address-detail">
            <van-tag v-if="selectedAddress.is_default" type="danger" size="small" class="mr-8">默认</van-tag>
            {{ selectedAddress.province }} {{ selectedAddress.city }} {{ selectedAddress.district }} {{ selectedAddress.address }}
          </div>
        </div>
        <div v-else class="no-address">
          <van-icon name="location-o" size="24" color="#999" />
          <span class="text">请选择收货地址</span>
          <van-icon name="arrow" size="16" color="#999" />
        </div>
      </div>
      
      <div class="goods-section bg-white rounded-8 mt-12">
        <div class="section-header">
          <span class="title">商品清单</span>
        </div>
        <div class="goods-list">
          <div 
            v-for="item in cartStore.selectedItems" 
            :key="item.id" 
            class="goods-item flex"
          >
            <img :src="item.image" class="goods-image" alt="" />
            <div class="goods-info flex-1">
              <div class="goods-name">{{ item.name }}</div>
              <div class="goods-spec">{{ item.spec }}</div>
              <div class="goods-bottom flex-between">
                <div class="price">
                  <span class="current-price">¥{{ item.show_price || item.price }}</span>
                </div>
                <div class="quantity">x {{ item.quantity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="summary-section bg-white rounded-8 mt-12">
        <div class="summary-item flex-between">
          <span class="label">商品金额</span>
          <span class="value">¥{{ cartStore.totalAmount.toFixed(2) }}</span>
        </div>
        <div class="summary-item flex-between">
          <span class="label">运费</span>
          <span class="value">¥0.00</span>
        </div>
        <div class="summary-item flex-between">
          <span class="label">优惠</span>
          <span class="value discount">-¥0.00</span>
        </div>
        <van-divider />
        <div class="summary-item flex-between total">
          <span class="label">实付金额</span>
          <span class="value">¥{{ cartStore.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>
    
    <div class="bottom-bar bottom-nav safe-bottom bg-white">
      <div class="bar-left flex-between">
        <div class="price-info">
          <span class="label">合计：</span>
          <span class="total-price">¥{{ cartStore.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
      <van-button 
        type="primary" 
        size="large"
        :disabled="!selectedAddress || cartStore.selectedItems.length === 0"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交订单
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import request from '@/utils/axios';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const cartStore = useCartStore();

const selectedAddress = ref(null);
const submitting = ref(false);

const goBack = () => {
  router.back();
};

const goAddress = () => {
  router.push('/address?select=1');
};

const fetchAddress = async () => {
  try {
    const res = await request.get('/address/default');
    selectedAddress.value = res.data;
    
    if (!selectedAddress.value) {
      const listRes = await request.get('/address');
      if (listRes.data.length > 0) {
        selectedAddress.value = listRes.data[0];
      }
    }
  } catch (error) {
    console.error('获取地址失败:', error);
  }
};

const handleSubmit = async () => {
  if (!selectedAddress.value) {
    showToast('请选择收货地址');
    return;
  }
  
  if (cartStore.selectedItems.length === 0) {
    showToast('请选择商品');
    return;
  }
  
  submitting.value = true;
  
  try {
    const productIds = cartStore.selectedItems.map(item => item.product_id);
    
    const res = await request.post('/order/create', {
      addressId: selectedAddress.value.id,
      productIds
    });
    
    showToast('订单创建成功');
    
    await cartStore.fetchCart();
    
    router.push(`/order/${res.data.orderId}`);
  } catch (error) {
    console.error('创建订单失败:', error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  cartStore.fetchCart();
  fetchAddress();
});
</script>

<style lang="less" scoped>
.checkout-page {
  padding-bottom: 70px;
  background: #f5f5f5;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.checkout-content {
  padding: 12px;
}

.address-section {
  padding: 16px;
  
  .no-address {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .text {
      flex: 1;
      color: #999;
      font-size: 14px;
    }
  }
  
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
        
        .goods-spec {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
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
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid #eee;
  
  .bar-left {
    flex: 1;
    
    .price-info {
      .label {
        font-size: 14px;
        color: #666;
      }
      
      .total-price {
        font-size: 20px;
        font-weight: 600;
        color: #FF4D4F;
      }
    }
  }
  
  :deep(.van-button) {
    min-width: 120px;
    height: 44px;
    border-radius: 22px;
    font-size: 15px;
    font-weight: 600;
    --van-button-primary-background: #FF4D4F;
    --van-button-primary-border-color: #FF4D4F;
  }
}
</style>
