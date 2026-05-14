<template>
  <div class="home page-container">
    <div class="header">
      <div class="location">
        <span>📍</span>
        <span>北京</span>
      </div>
      <div class="search-bar" @click="goSearch">
        <span class="search-icon">🔍</span>
        <span class="search-placeholder">搜索商品</span>
      </div>
      <div class="message-icon" @click="goMessage">💬</div>
    </div>

    <div class="banner">
      <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800" alt="banner" />
    </div>

    <div class="channels card">
      <div class="channel-item" v-for="channel in channels" :key="channel.id" @click="handleChannel(channel)">
        <div class="channel-icon">{{ channel.icon }}</div>
        <span class="channel-name">{{ channel.name }}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">猜你喜欢</span>
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
      <div v-else-if="!hasMore" class="no-more">没有更多了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { productApi } from '../api';

const router = useRouter();
const showToast = inject('showToast');

const channels = ref([]);
const products = ref([]);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);
const hasMore = ref(true);

const fetchChannels = async () => {
  try {
    const res = await productApi.getChannels();
    if (res.code === 200) {
      channels.value = res.data;
    }
  } catch (e) {
    console.error('获取频道失败:', e);
  }
};

const fetchProducts = async (refresh = false) => {
  if (loading.value) return;
  
  loading.value = true;
  
  try {
    if (refresh) {
      page.value = 1;
      products.value = [];
      hasMore.value = true;
    }
    
    const res = await productApi.getRecommend({
      page: page.value,
      pageSize
    });
    
    if (res.code === 200) {
      if (refresh) {
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
    console.error('获取商品失败:', e);
  } finally {
    loading.value = false;
  }
};

const goSearch = () => {
  router.push('/search');
};

const goMessage = () => {
  router.push('/message');
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const handleChannel = (channel) => {
  if (channel.link) {
    if (channel.link.startsWith('/')) {
      router.push(channel.link);
    } else {
      showToast(channel.name + ' 功能开发中');
    }
  }
};

const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight || window.innerHeight;
  
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    if (hasMore.value && !loading.value) {
      fetchProducts();
    }
  }
};

onMounted(() => {
  fetchChannels();
  fetchProducts(true);
  window.addEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.home {
  padding-bottom: 70px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(to right, #ff5000, #ff6b00);
  position: sticky;
  top: 0;
  z-index: 100;
}

.location {
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.search-bar {
  flex: 1;
  background: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.search-icon {
  color: #999;
}

.search-placeholder {
  color: #999;
  font-size: 14px;
}

.message-icon {
  color: #fff;
  font-size: 20px;
}

.banner {
  padding: 12px 16px;
}

.banner img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
}

.channels {
  margin: 0 16px 16px;
  padding: 16px 8px;
  display: flex;
  flex-wrap: wrap;
}

.channel-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
}

.channel-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.channel-name {
  font-size: 12px;
  color: #333;
}

.section {
  padding: 0 8px 16px;
}

.section-header {
  padding: 12px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  border-left: 3px solid #ff5000;
  padding-left: 8px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 4px;
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
