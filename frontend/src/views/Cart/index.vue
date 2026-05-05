<template>
  <div class="cart-page page-container">
    <van-nav-bar title="购物车" :placeholder="true" />
    
    <div v-if="cartStore.cartItems.length > 0" class="cart-content">
      <van-checkbox-group v-model="selectedIds">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <div class="cart-list">
            <div 
              v-for="item in cartStore.cartItems" 
              :key="item.id" 
              class="cart-item bg-white rounded-8"
              :class="{ 'out-of-stock': item.stock <= 0 }"
            >
              <van-checkbox 
                v-model="item.selected" 
                :name="item.product_id"
                :disabled="item.stock <= 0"
                @change="handleSelectChange(item)"
              />
              <img 
                :src="item.image" 
                class="product-image" 
                alt="" 
                @click="goProduct(item.product_id)"
              />
              <div class="product-info flex-1" @click="goProduct(item.product_id)">
                <div class="product-name">{{ item.name }}</div>
                <div class="product-spec">{{ item.spec }}</div>
                <div class="product-bottom flex-between">
                  <div class="prices">
                    <span class="current-price">¥{{ item.show_price || item.price }}</span>
                    <span v-if="item.vip_price && userStore.isVip" class="vip-tag">会员价</span>
                  </div>
                  <van-stepper
                    v-model="item.quantity"
                    :min="1"
                    :max="item.stock"
                    :disabled="item.stock <= 0"
                    @change="handleQuantityChange(item)"
                  />
                </div>
              </div>
              <van-icon 
                name="delete-o" 
                size="20" 
                color="#999" 
                @click="handleRemove(item)"
              />
            </div>
          </div>
        </van-pull-refresh>
      </van-checkbox-group>
    </div>
    
    <van-empty v-else description="购物车空空如也">
      <template #image>
        <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=empty%20shopping%20cart%20illustration%20simple%20cute&image_size=square" alt="" />
      </template>
      <van-button type="primary" round @click="goHome">去逛逛</van-button>
    </van-empty>
    
    <div v-if="cartStore.cartItems.length > 0" class="bottom-bar bottom-nav safe-bottom bg-white">
      <div class="bar-left flex">
        <van-checkbox 
          v-model="isAllSelected" 
          @change="handleSelectAll"
        >
          全选
        </van-checkbox>
      </div>
      <div class="bar-right flex-between">
        <div class="price-section">
          <span class="label">合计：</span>
          <span class="total-price">¥{{ cartStore.totalAmount.toFixed(2) }}</span>
        </div>
        <van-button 
          type="primary" 
          size="large"
          :disabled="cartStore.totalCount === 0"
          @click="goCheckout"
        >
          结算({{ cartStore.totalCount }})
        </van-button>
      </div>
    </div>
    
    <div class="tab-bar bottom-nav safe-bottom" v-if="cartStore.cartItems.length === 0">
      <van-tabbar v-model="activeTab" route fixed placeholder>
        <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
        <van-tabbar-item to="/search" icon="search">搜索</van-tabbar-item>
        <van-tabbar-item to="/cart" icon="shopping-cart-o">购物车</van-tabbar-item>
        <van-tabbar-item to="/user" icon="user-o">我的</van-tabbar-item>
      </van-tabbar>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();

const activeTab = ref(2);
const refreshing = ref(false);
const selectedIds = ref([]);

const isAllSelected = computed({
  get: () => cartStore.isAllSelected,
  set: (value) => {}
});

const goHome = () => {
  router.push('/home');
};

const goProduct = (productId) => {
  router.push(`/product/${productId}`);
};

const goCheckout = () => {
  router.push('/checkout');
};

const handleSelectChange = async (item) => {
  try {
    await cartStore.updateCartItem(item.product_id, undefined, item.selected);
  } catch (error) {
    console.error('更新购物车失败:', error);
  }
};

const handleSelectAll = async (selected) => {
  try {
    await cartStore.toggleSelectAll(selected);
    await cartStore.fetchCart();
  } catch (error) {
    console.error('全选失败:', error);
  }
};

const handleQuantityChange = async (item) => {
  try {
    await cartStore.updateCartItem(item.product_id, item.quantity, undefined);
    await cartStore.fetchCart();
  } catch (error) {
    console.error('更新数量失败:', error);
  }
};

const handleRemove = async (item) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要移除该商品吗？'
    });
    
    await cartStore.removeFromCart(item.product_id);
    await cartStore.fetchCart();
    showToast('已移除');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除商品失败:', error);
    }
  }
};

const onRefresh = async () => {
  try {
    await cartStore.fetchCart();
  } catch (error) {
    console.error('刷新失败:', error);
  } finally {
    refreshing.value = false;
  }
};

onMounted(() => {
  if (userStore.isLoggedIn) {
    cartStore.fetchCart();
  }
});
</script>

<style lang="less" scoped>
.cart-page {
  padding-bottom: 60px;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.cart-content {
  padding: 12px;
  
  .cart-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .cart-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      
      :deep(.van-checkbox) {
        padding: 4px;
      }
      
      .product-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        object-fit: cover;
        background: #f5f5f5;
      }
      
      .product-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        .product-name {
          font-size: 14px;
          color: #333;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .product-spec {
          font-size: 12px;
          color: #999;
        }
        
        .product-bottom {
          margin-top: auto;
          
          .prices {
            display: flex;
            align-items: center;
            
            .current-price {
              font-size: 16px;
              color: #FF4D4F;
              font-weight: 600;
            }
            
            .vip-tag {
              margin-left: 6px;
              padding: 1px 4px;
              background: #FAAD14;
              color: #fff;
              font-size: 10px;
              border-radius: 2px;
            }
          }
        }
      }
      
      &.out-of-stock {
        opacity: 0.5;
        pointer-events: none;
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
    :deep(.van-checkbox__label) {
      font-size: 14px;
    }
  }
  
  .bar-right {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .price-section {
      text-align: right;
      
      .label {
        font-size: 12px;
        color: #666;
      }
      
      .total-price {
        font-size: 20px;
        color: #FF4D4F;
        font-weight: 600;
      }
    }
    
    :deep(.van-button) {
      height: 40px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      --van-button-primary-background: #FF4D4F;
      --van-button-primary-border-color: #FF4D4F;
    }
  }
}
</style>
