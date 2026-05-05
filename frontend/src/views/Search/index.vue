<template>
  <div class="search-page page-container">
    <div class="search-header">
      <van-icon name="arrow-left" size="22" @click="goBack" />
      <van-search
        v-model="keyword"
        placeholder="搜索商品"
        :autofocus="true"
        @search="handleSearch"
        @cancel="handleCancel"
        show-action
      />
    </div>
    
    <div v-if="!showResults" class="search-suggestions">
      <div v-if="hotSearches.length > 0" class="section">
        <div class="section-header flex-between">
          <span class="section-title">热门搜索</span>
        </div>
        <div class="tag-list">
          <van-tag
            v-for="(item, index) in hotSearches"
            :key="index"
            type="default"
            size="medium"
            round
            @click="searchKeyword(item.keyword)"
          >
            {{ item.keyword }}
          </van-tag>
        </div>
      </div>
      
      <div v-if="searchHistory.length > 0" class="section">
        <div class="section-header flex-between">
          <span class="section-title">搜索历史</span>
          <van-icon name="delete-o" size="18" color="#999" @click="clearHistory" />
        </div>
        <div class="tag-list">
          <van-tag
            v-for="(keyword, index) in searchHistory"
            :key="index"
            type="default"
            size="medium"
            round
            @click="searchKeyword(keyword)"
          >
            {{ keyword }}
          </van-tag>
        </div>
      </div>
    </div>
    
    <div v-else class="search-results">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div class="results-header">
            <span class="results-count">共 {{ total }} 件商品</span>
          </div>
          
          <div v-if="searchResults.length > 0" class="product-list">
            <div 
              v-for="product in searchResults" 
              :key="product.id" 
              class="product-item flex"
              :class="{ 'out-of-stock': product.stock <= 0 }"
              @click="goProduct(product.id)"
            >
              <img :src="product.image" class="product-image" alt="" />
              <div class="product-info flex-1">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-spec">{{ product.spec }}</div>
                <div class="product-sales">已售 {{ product.sales }} 件</div>
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
          
          <van-empty v-else description="暂无搜索结果" />
        </van-list>
      </van-pull-refresh>
    </div>
    
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
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import request from '@/utils/axios';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const cartStore = useCartStore();

const activeTab = ref(1);
const keyword = ref('');
const hotSearches = ref([]);
const searchHistory = ref([]);
const showResults = ref(false);
const searchResults = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = 20;

const goBack = () => {
  if (showResults.value) {
    showResults.value = false;
    searchResults.value = [];
  } else {
    router.back();
  }
};

const handleCancel = () => {
  showResults.value = false;
  searchResults.value = [];
};

const searchKeyword = (kw) => {
  keyword.value = kw;
  handleSearch();
};

const handleSearch = () => {
  if (!keyword.value.trim()) {
    showToast('请输入搜索关键词');
    return;
  }
  
  showResults.value = true;
  searchResults.value = [];
  page.value = 1;
  finished.value = false;
  onLoad();
};

const clearHistory = async () => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要清空搜索历史吗？'
    });
    
    if (userStore.isLoggedIn) {
      await request.delete('/search/history');
    }
    
    searchHistory.value = [];
    localStorage.removeItem('searchHistory');
    showToast('已清空搜索历史');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空历史失败:', error);
    }
  }
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

const goProduct = (productId) => {
  router.push(`/product/${productId}`);
};

const onLoad = async () => {
  try {
    const res = await request.get('/search', {
      params: {
        keyword: keyword.value,
        limit: pageSize,
        offset: (page.value - 1) * pageSize
      }
    });
    
    const { products, total: totalCount, hasMore } = res.data;
    
    if (page.value === 1) {
      searchResults.value = products;
    } else {
      searchResults.value = [...searchResults.value, ...products];
    }
    
    total.value = totalCount;
    finished.value = !hasMore;
    page.value++;
  } catch (error) {
    console.error('搜索失败:', error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onRefresh = () => {
  page.value = 1;
  finished.value = false;
  searchResults.value = [];
  onLoad();
};

const fetchHotSearches = async () => {
  try {
    const res = await request.get('/search/hot');
    hotSearches.value = res.data;
  } catch (error) {
    console.error('获取热门搜索失败:', error);
  }
};

const fetchSearchHistory = async () => {
  try {
    if (userStore.isLoggedIn) {
      const res = await request.get('/search/history');
      searchHistory.value = res.data;
    } else {
      const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      searchHistory.value = localHistory;
    }
  } catch (error) {
    console.error('获取搜索历史失败:', error);
  }
};

onMounted(() => {
  fetchHotSearches();
  fetchSearchHistory();
  
  const queryKeyword = route.query.keyword;
  if (queryKeyword) {
    keyword.value = queryKeyword;
    handleSearch();
  }
});
</script>

<style lang="less" scoped>
.search-page {
  background: #fff;
  padding-bottom: 60px;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
  
  :deep(.van-search) {
    flex: 1;
    padding: 0;
    background: transparent;
    
    .van-search__content {
      background: #f5f5f5;
      border-radius: 20px;
    }
  }
}

.search-suggestions {
  padding: 16px;
  
  .section {
    margin-bottom: 20px;
    
    .section-header {
      margin-bottom: 12px;
      
      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      
      :deep(.van-tag) {
        font-size: 13px;
        padding: 6px 14px;
        background: #f5f5f5;
        border: none;
        color: #666;
      }
    }
  }
}

.search-results {
  .results-header {
    padding: 12px 16px;
    font-size: 13px;
    color: #999;
    background: #fff;
  }
  
  .product-list {
    background: #fff;
    
    .product-item {
      padding: 16px;
      border-bottom: 1px solid #f5f5f5;
      gap: 12px;
      
      .product-image {
        width: 100px;
        height: 100px;
        border-radius: 8px;
        object-fit: cover;
        background: #f5f5f5;
      }
      
      .product-info {
        display: flex;
        flex-direction: column;
        
        .product-name {
          font-size: 15px;
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
          margin-top: 4px;
        }
        
        .product-sales {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }
        
        .product-price {
          margin-top: auto;
          
          .prices {
            display: flex;
            align-items: baseline;
            
            .current-price {
              font-size: 18px;
              font-weight: 600;
              color: #FF4D4F;
              
              &::before {
                content: '¥';
                font-size: 12px;
              }
            }
            
            .original-price {
              font-size: 12px;
              color: #999;
              text-decoration: line-through;
              margin-left: 6px;
            }
          }
        }
      }
    }
  }
}
</style>
