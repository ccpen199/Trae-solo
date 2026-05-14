<template>
  <div class="favorites page-container">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="header-title">我的收藏</div>
      <div class="edit-btn" @click="isEditing = !isEditing">
        {{ isEditing ? '完成' : '管理' }}
      </div>
    </div>

    <div v-if="favorites.length > 0" class="content">
      <div class="product-grid">
        <div 
          v-for="item in favorites" 
          :key="item.id" 
          class="product-card card"
        >
          <div class="product-image" @click="goDetail(item.id)">
            <img :src="item.cover_image" :alt="item.title" />
            <div v-if="isEditing" class="delete-btn" @click.stop="removeFavorite(item)">
              ✕
            </div>
          </div>
          <div class="product-info" @click="goDetail(item.id)">
            <div class="product-title text-ellipsis-2">{{ item.title }}</div>
            <div class="product-price">
              <span class="price">¥{{ item.price }}</span>
              <span v-if="item.original_price" class="price-old">¥{{ item.original_price }}</span>
            </div>
            <div class="product-sales">
              <span class="sales">已售{{ formatSales(item.sales) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
    </div>

    <div v-else class="empty-state">
      <div class="icon">❤️</div>
      <div class="text">暂无收藏商品</div>
      <button class="btn btn-primary mt-12" @click="goShopping">去逛逛</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { productApi } from '../api';

const router = useRouter();
const showToast = inject('showToast');

const favorites = ref([]);
const loading = ref(false);
const isEditing = ref(false);

const fetchFavorites = async () => {
  loading.value = true;
  try {
    const res = await productApi.getFavorites({ page: 1, pageSize: 50 });
    if (res.code === 200) {
      favorites.value = res.data.list;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const goShopping = () => {
  router.push('/');
};

const removeFavorite = async (item) => {
  try {
    const res = await productApi.toggleFavorite(item.id);
    if (res.code === 200) {
      favorites.value = favorites.value.filter(f => f.id !== item.id);
      showToast('已取消收藏');
    }
  } catch (e) {
    console.error(e);
  }
};

const formatSales = (sales) => {
  if (!sales) return 0;
  if (sales >= 10000) {
    return (sales / 10000).toFixed(1) + '万';
  }
  return sales;
};

onMounted(() => {
  fetchFavorites();
});
</script>

<style scoped>
.favorites {
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.back-btn {
  font-size: 20px;
  color: #333;
  width: 40px;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.edit-btn {
  font-size: 14px;
  color: #ff5000;
  width: 40px;
  text-align: right;
}

.content {
  padding: 12px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  overflow: hidden;
  position: relative;
}

.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
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
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
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

.product-sales {
  font-size: 11px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-state .icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state .text {
  color: #999;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
