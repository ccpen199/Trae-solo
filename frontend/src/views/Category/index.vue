<template>
  <div class="category-page page-container">
    <van-nav-bar :title="category?.name || '分类'" left-arrow @click-left="goBack" :placeholder="true" />
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="product-grid">
          <div 
            v-for="product in products" 
            :key="product.id" 
            class="product-item"
            :class="{ 'out-of-stock': product.stock <= 0 }"
            @click="goProduct(product.id)"
          >
            <img :src="product.image" class="product-image" alt="" />
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-spec">{{ product.spec }}</div>
              <div class="product-price flex-between">
                <div class="prices">
                  <span class="current-price">{{ product.show_price || product.price }}</span>
                  <span class="original-price">¥{{ product.original_price }}</span>
                </div>
                <van-button 
                  v-if="product.stock > 0"
                  type="primary" 
                  size="mini" 
                  square
                  @click.stop="addToCart(product.id)"
                >
                  +
                </van-button>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
    
    <van-empty v-if="products.length === 0 && !loading" description="暂无商品" />
    
    <div class="tab-bar bottom-nav safe-bottom">
      <van-tabbar v-model="activeTab" route fixed placeholder>
        <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
        <van-tabbar-item to="/search" icon="search">搜索</van-tabbar-item>
        <van-tabbar-item to="/cart" icon="shopping-cart-o">
          <template #icon="{ active }">
            <van-badge :content="cartStore.cartCount" :show-zero="false" :max="99">
              <van-icon :name="active ? 'shopping-cart' : 'shopping-cart-o'" size="20" />
            </van-badge>
          </template>
          购物车
        </van-tabbar-item>
        <van-tabbar-item to="/user" icon="user-o">我的</van-tabbar-item>
      </van-tabbar>
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

const activeTab = ref(0);
const category = ref(null);
const products = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = 20;

const goBack = () => {
  router.back();
};

const goProduct = (productId) => {
  router.push(`/product/${productId}`);
};

const addToCart = async (productId) => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  
  try {
    await cartStore.addToCart(productId, 1);
    showToast('已加入购物车');
  } catch (error) {
    console.error('加入购物车失败:', error);
  }
};

const onLoad = async () => {
  try {
    const categoryId = route.params.categoryId;
    const res = await request.get(`/home/category-products/${categoryId}`, {
      params: {
        limit: pageSize,
        offset: (page.value - 1) * pageSize
      }
    });
    
    const { category: cat, products: list, hasMore } = res.data;
    
    if (page.value === 1) {
      category.value = cat;
      products.value = list;
    } else {
      products.value = [...products.value, ...list];
    }
    
    finished.value = !hasMore;
    page.value++;
  } catch (error) {
    console.error('获取分类商品失败:', error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onRefresh = () => {
  page.value = 1;
  finished.value = false;
  products.value = [];
  onLoad();
};

onMounted(() => {
  onLoad();
  
  if (userStore.isLoggedIn) {
    cartStore.fetchCart();
  }
});
</script>

<style lang="less" scoped>
.category-page {
  padding-bottom: 60px;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
  
  .product-item {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    
    .product-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      background: #f5f5f5;
    }
    
    .product-info {
      padding: 8px;
      
      .product-name {
        font-size: 13px;
        color: #333;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .product-spec {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
      }
      
      .product-price {
        margin-top: 6px;
        
        .prices {
          display: flex;
          align-items: baseline;
          
          .current-price {
            font-size: 16px;
            font-weight: 600;
            color: #FF4D4F;
            
            &::before {
              content: '¥';
              font-size: 12px;
            }
          }
          
          .original-price {
            font-size: 11px;
            color: #999;
            text-decoration: line-through;
            margin-left: 4px;
          }
        }
      }
    }
    
    &.out-of-stock {
      opacity: 0.5;
    }
  }
}
</style>
