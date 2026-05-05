<template>
  <div class="product-page page-container">
    <van-nav-bar
      left-arrow
      @click-left="goBack"
      :placeholder="true"
    />
    
    <div v-if="product" class="product-detail">
      <div class="product-image-wrapper">
        <img :src="product.image" class="product-image" alt="" :class="{ 'out-of-stock': product.stock <= 0 }" />
      </div>
      
      <div class="product-info bg-white">
        <div class="price-section">
          <div class="current-price">
            <span class="symbol">¥</span>
            <span class="price">{{ product.show_price || product.price }}</span>
          </div>
          <div v-if="product.original_price" class="original-price">
            ¥{{ product.original_price }}
          </div>
          <div v-if="product.vip_price && userStore.isVip" class="vip-tag">
            会员专享价
          </div>
        </div>
        
        <div class="product-name">{{ product.name }}</div>
        
        <div class="product-meta">
          <span class="spec">规格：{{ product.spec }}</span>
          <span class="sales">已售{{ product.sales }}件</span>
        </div>
        
        <van-cell-group inset class="info-group">
          <van-cell title="库存" :value="product.stock > 0 ? `${product.stock}件` : '已抢光'" />
          <van-cell title="单位" :value="product.unit" />
        </van-cell-group>
      </div>
      
      <div v-if="similarProducts.length > 0" class="similar-section mt-12 bg-white">
        <div class="section-header">
          <span class="title">相似商品</span>
        </div>
        <div class="similar-list">
          <div 
            v-for="item in similarProducts" 
            :key="item.id" 
            class="similar-item"
            @click="goProduct(item.id)"
          >
            <img :src="item.image" class="similar-image" alt="" />
            <div class="similar-name">{{ item.name }}</div>
            <div class="similar-price">¥{{ item.show_price || item.price }}</div>
          </div>
        </div>
      </div>
      
      <div class="product-description mt-12 bg-white">
        <div class="section-header">
          <span class="title">商品详情</span>
        </div>
        <div class="description-content">
          <p>{{ product.description }}</p>
        </div>
      </div>
    </div>
    
    <van-empty v-else description="加载中..." />
    
    <div class="bottom-actions bottom-nav safe-bottom bg-white">
      <div class="action-left flex">
        <div class="action-item" @click="goHome">
          <van-icon name="home-o" size="20" color="#666" />
          <span class="text">首页</span>
        </div>
        <div class="action-item" @click="goCart">
          <van-badge :content="cartStore.cartCount" :show-zero="false" :max="99">
            <van-icon name="shopping-cart-o" size="20" color="#666" />
          </van-badge>
          <span class="text">购物车</span>
        </div>
      </div>
      <div class="action-right flex">
        <van-button
          v-if="product?.stock > 0"
          type="warning"
          size="large"
          @click="handleAddToCart"
          class="action-btn add-btn"
        >
          加入购物车
        </van-button>
        <van-button
          v-if="product?.stock > 0"
          type="primary"
          size="large"
          @click="handleBuyNow"
          class="action-btn buy-btn"
        >
          立即购买
        </van-button>
        <van-button
          v-else
          type="default"
          size="large"
          disabled
          class="action-btn"
        >
          已抢光
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import request from '@/utils/axios';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const cartStore = useCartStore();

const product = ref(null);
const similarProducts = ref([]);

const goBack = () => {
  router.back();
};

const goHome = () => {
  router.push('/home');
};

const goCart = () => {
  router.push('/cart');
};

const goProduct = (productId) => {
  router.push(`/product/${productId}`);
};

const handleAddToCart = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  
  try {
    await cartStore.addToCart(product.value.id, 1);
    showToast('已加入购物车');
  } catch (error) {
    console.error('加入购物车失败:', error);
  }
};

const handleBuyNow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  
  try {
    await cartStore.addToCart(product.value.id, 1);
    router.push('/cart');
  } catch (error) {
    console.error('加入购物车失败:', error);
  }
};

const fetchProduct = async () => {
  try {
    const productId = route.params.productId;
    const res = await request.get(`/product/${productId}`);
    product.value = res.data.product;
    similarProducts.value = res.data.similarProducts;
  } catch (error) {
    console.error('获取商品详情失败:', error);
  }
};

onMounted(() => {
  fetchProduct();
  
  if (userStore.isLoggedIn) {
    cartStore.fetchCart();
  }
});
</script>

<style lang="less" scoped>
.product-page {
  padding-bottom: 60px;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.product-image-wrapper {
  width: 100%;
  background: #f5f5f5;
  
  .product-image {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
}

.product-info {
  padding: 16px;
  
  .price-section {
    display: flex;
    align-items: baseline;
    margin-bottom: 12px;
    
    .current-price {
      display: flex;
      align-items: baseline;
      
      .symbol {
        font-size: 14px;
        color: #FF4D4F;
        font-weight: 600;
      }
      
      .price {
        font-size: 24px;
        color: #FF4D4F;
        font-weight: 600;
      }
    }
    
    .original-price {
      font-size: 14px;
      color: #999;
      text-decoration: line-through;
      margin-left: 8px;
    }
    
    .vip-tag {
      margin-left: 8px;
      padding: 2px 6px;
      background: linear-gradient(135deg, #FAAD14 0%, #FA8C16 100%);
      color: #fff;
      font-size: 10px;
      border-radius: 4px;
    }
  }
  
  .product-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    line-height: 1.5;
    margin-bottom: 8px;
  }
  
  .product-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #999;
    margin-bottom: 16px;
  }
  
  .info-group {
    margin: 0;
  }
}

.similar-section, .product-description {
  padding: 16px;
  
  .section-header {
    margin-bottom: 12px;
    
    .title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }
}

.similar-section {
  .similar-list {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding-bottom: 8px;
    
    .similar-item {
      flex-shrink: 0;
      width: 100px;
      
      .similar-image {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 8px;
        object-fit: cover;
        background: #f5f5f5;
      }
      
      .similar-name {
        font-size: 12px;
        color: #333;
        margin-top: 6px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .similar-price {
        font-size: 14px;
        color: #FF4D4F;
        font-weight: 600;
        margin-top: 4px;
      }
    }
  }
}

.product-description {
  .description-content {
    font-size: 14px;
    color: #666;
    line-height: 1.8;
  }
}

.bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid #eee;
  
  .action-left {
    gap: 24px;
    
    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .text {
        font-size: 10px;
        color: #666;
        margin-top: 2px;
      }
    }
  }
  
  .action-right {
    gap: 12px;
    
    .action-btn {
      height: 40px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .add-btn {
      --van-button-warning-background: #FFBB4A;
      --van-button-warning-border-color: #FFBB4A;
    }
    
    .buy-btn {
      --van-button-primary-background: #FF4D4F;
      --van-button-primary-border-color: #FF4D4F;
    }
  }
}
</style>
