<template>
  <div class="search page-container">
    <div class="search-header">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input 
          v-model="keyword" 
          type="text" 
          placeholder="搜索商品"
          ref="inputRef"
          @keyup.enter="handleSearch"
          @input="handleInput"
        />
        <span v-if="keyword" class="clear-icon" @click="clearKeyword">✕</span>
      </div>
      <span class="search-btn" @click="handleSearch">搜索</span>
    </div>

    <div v-if="!hasSearched" class="search-content">
      <div class="history-section" v-if="history.length > 0">
        <div class="section-header">
          <span class="section-title">搜索历史</span>
          <span class="clear-btn" @click="clearHistory">清空</span>
        </div>
        <div class="tag-list">
          <span 
            v-for="(item, index) in history" 
            :key="index"
            class="tag"
            @click="searchKeyword(item.keyword)"
          >{{ item.keyword }}</span>
        </div>
      </div>

      <div class="hot-section">
        <div class="section-header">
          <span class="section-title">🔥 搜索发现</span>
        </div>
        <div class="tag-list">
          <span 
            v-for="(item, index) in hotWords" 
            :key="index"
            class="tag hot-tag"
            @click="searchKeyword(item.keyword)"
          >
            <span class="hot-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
            {{ item.keyword }}
          </span>
        </div>
      </div>

      <div class="suggestions" v-if="suggestions.length > 0">
        <div 
          v-for="(item, index) in suggestions" 
          :key="index"
          class="suggestion-item"
          @click="searchKeyword(item)"
        >
          <span class="search-icon">🔍</span>
          <span>{{ item }}</span>
        </div>
      </div>
    </div>

    <div v-else class="search-results">
      <div class="sort-bar">
        <span 
          class="sort-item" 
          :class="{ active: sortType === 'default' }"
          @click="changeSort('default')"
        >综合</span>
        <span 
          class="sort-item" 
          :class="{ active: sortType === 'sales' }"
          @click="changeSort('sales')"
        >销量</span>
        <span 
          class="sort-item" 
          :class="{ active: sortType === 'price_asc' || sortType === 'price_desc' }"
          @click="changePriceSort"
        >
          价格
          <span class="price-sort">
            <span :class="{ active: sortType === 'price_asc' }">↑</span>
            <span :class="{ active: sortType === 'price_desc' }">↓</span>
          </span>
        </span>
      </div>

      <div class="product-grid">
        <div 
          v-for="product in products" 
          :key="product.id" 
          class="product-card card"
          @click="goDetail(product.id)"
        >
          <div class="product-image">
            <img :src="product.cover_image" :alt="product.title" />
          </div>
          <div class="product-info">
            <div class="product-title">{{ product.title }}</div>
            <div class="product-price">
              <span class="price">¥{{ product.price }}</span>
              <span v-if="product.original_price" class="price-old">¥{{ product.original_price }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="products.length === 0" class="empty-state">
        <div class="icon">🔍</div>
        <div>没有找到相关商品</div>
      </div>
      <div v-else-if="!hasMore" class="no-more">没有更多了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { productApi } from '../api';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const showToast = inject('showToast');

const inputRef = ref(null);
const keyword = ref('');
const history = ref([]);
const hotWords = ref([]);
const suggestions = ref([]);
const hasSearched = ref(false);
const products = ref([]);
const sortType = ref('default');
const loading = ref(false);
const hasMore = ref(true);
const page = ref(1);
const pageSize = 10;

const fetchHotWords = async () => {
  try {
    const res = await productApi.getHotWords();
    if (res.code === 200) {
      hotWords.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchHistory = async () => {
  if (!userStore.isLoggedIn) return;
  try {
    const res = await productApi.getSearchHistory();
    if (res.code === 200) {
      history.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const handleInput = async () => {
  if (!keyword.value) {
    suggestions.value = [];
    return;
  }
  
  try {
    const res = await productApi.getSuggestions({ keyword: keyword.value });
    if (res.code === 200) {
      suggestions.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const searchKeyword = async (kw) => {
  keyword.value = kw;
  await handleSearch();
};

const handleSearch = async () => {
  if (!keyword.value.trim()) {
    showToast('请输入搜索关键词');
    return;
  }
  
  suggestions.value = [];
  hasSearched.value = true;
  page.value = 1;
  products.value = [];
  hasMore.value = true;
  
  if (userStore.isLoggedIn) {
    try {
      await productApi.saveSearchHistory({ keyword: keyword.value.trim() });
    } catch (e) {
      console.error(e);
    }
  }
  
  await fetchProducts();
};

const fetchProducts = async () => {
  if (loading.value || !hasMore.value) return;
  
  loading.value = true;
  
  try {
    const res = await productApi.getList({
      keyword: keyword.value,
      sort: sortType.value,
      page: page.value,
      pageSize
    });
    
    if (res.code === 200) {
      if (page.value === 1) {
        products.value = res.data.list;
      } else {
        products.value = [...products.value, ...res.data.list];
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

const changeSort = (type) => {
  if (sortType.value === type) return;
  sortType.value = type;
  page.value = 1;
  products.value = [];
  hasMore.value = true;
  fetchProducts();
};

const changePriceSort = () => {
  if (sortType.value === 'price_asc') {
    sortType.value = 'price_desc';
  } else if (sortType.value === 'price_desc') {
    sortType.value = 'price_asc';
  } else {
    sortType.value = 'price_asc';
  }
  page.value = 1;
  products.value = [];
  hasMore.value = true;
  fetchProducts();
};

const clearKeyword = () => {
  keyword.value = '';
  hasSearched.value = false;
  suggestions.value = [];
  inputRef.value?.focus();
};

const clearHistory = async () => {
  if (!userStore.isLoggedIn) {
    history.value = [];
    return;
  }
  try {
    await productApi.clearSearchHistory({});
    history.value = [];
  } catch (e) {
    console.error(e);
  }
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const handleScroll = () => {
  if (!hasSearched.value) return;
  
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight || window.innerHeight;
  
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    fetchProducts();
  }
};

onMounted(() => {
  fetchHotWords();
  fetchHistory();
  inputRef.value?.focus();
  window.addEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.search {
  background: #fff;
  min-height: 100vh;
}

.search-header {
  position: sticky;
  top: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.search-bar {
  flex: 1;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  color: #999;
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
}

.clear-icon {
  color: #999;
  font-size: 14px;
  padding: 4px;
}

.search-btn {
  color: #ff5000;
  font-size: 14px;
  white-space: nowrap;
}

.search-content {
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.clear-btn {
  font-size: 12px;
  color: #999;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.tag {
  background: #f5f5f5;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  color: #333;
}

.hot-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hot-rank {
  font-weight: bold;
  color: #999;
}

.hot-rank.rank-1 { color: #ff4d4f; }
.hot-rank.rank-2 { color: #ff7a45; }
.hot-rank.rank-3 { color: #ffa940; }

.suggestions {
  margin-top: 16px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
}

.search-results {
  background: #f5f5f5;
  min-height: 100vh;
}

.sort-bar {
  position: sticky;
  top: 57px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12px 0;
  z-index: 99;
  border-bottom: 1px solid #eee;
}

.sort-item {
  font-size: 14px;
  color: #666;
}

.sort-item.active {
  color: #ff5000;
  font-weight: bold;
}

.price-sort {
  display: inline-flex;
  flex-direction: column;
  font-size: 10px;
  margin-left: 2px;
}

.price-sort span {
  line-height: 1;
}

.price-sort span.active {
  color: #ff5000;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
}

.product-card {
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 10px;
}

.product-title {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  min-height: 36px;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price {
  color: #ff4d4f;
  font-size: 16px;
  font-weight: bold;
}

.price-old {
  color: #999;
  font-size: 11px;
  text-decoration: line-through;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.loading, .no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.card {
  background: #fff;
  border-radius: 12px;
}
</style>
