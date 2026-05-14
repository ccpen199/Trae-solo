<template>
  <div class="supermarket">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="search-bar" @click="showToast('搜索功能开发中')">
        <span class="search-icon">🔍</span>
        <span class="search-placeholder">搜索天猫超市商品</span>
      </div>
      <span class="cart-btn" @click="goCart">🛒</span>
    </div>

    <div class="supermarket-content">
      <div class="banner">
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800" alt="超市横幅" />
      </div>

      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.value"
          class="tab-item"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </div>
      </div>

      <div class="categories">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          @click="filterByCategory(category.id)"
        >
          <div class="category-icon">{{ category.icon }}</div>
          <div class="category-name">{{ category.name }}</div>
        </div>
      </div>

      <div class="promo-section">
        <div class="section-title">限时特惠</div>
        <div class="promo-grid">
          <div v-for="product in promoProducts" :key="product.id" class="promo-card" @click="goDetail(product.id)">
            <div class="promo-tag">限时</div>
            <img :src="product.cover_image" :alt="product.title" class="promo-image" />
            <div class="promo-info">
              <div class="promo-title">{{ product.title }}</div>
              <div class="promo-price">
                <span class="current-price">¥{{ product.price }}</span>
                <span class="original-price">¥{{ product.original_price }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">猜你喜欢</div>
        <div class="product-grid">
          <div v-for="product in products" :key="product.id" class="product-card" @click="goDetail(product.id)">
            <img :src="product.cover_image" :alt="product.title" class="product-image" />
            <div class="product-info">
              <div class="product-title">{{ product.title }}</div>
              <div class="product-meta">
                <span class="sales">已售{{ product.sales }}件</span>
              </div>
              <div class="product-price">
                <span class="price-label">¥</span>
                <span class="price-value">{{ product.price }}</span>
              </div>
            </div>
            <button class="add-cart-btn" @click.stop="addToCart(product)">
              <span>+</span>
            </button>
          </div>
        </div>
      </div>

      <div class="floating-cart" v-if="cartCount > 0" @click="goCart">
        <span class="cart-icon">🛒</span>
        <span class="cart-count">{{ cartCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showToast = inject('showToast');

const activeTab = ref('all');
const cartCount = ref(0);

const tabs = [
  { label: '全部', value: 'all' },
  { label: '生鲜', value: 'fresh' },
  { label: '零食', value: 'snack' },
  { label: '酒水', value: 'drink' },
  { label: '日用', value: 'daily' }
];

const categories = [
  { id: 1, name: '新鲜水果', icon: '🍎' },
  { id: 2, name: '海鲜水产', icon: '🦐' },
  { id: 3, name: '肉类禽蛋', icon: '🥩' },
  { id: 4, name: '蔬菜豆品', icon: '🥦' },
  { id: 5, name: '乳品烘焙', icon: '🥛' },
  { id: 6, name: '休闲零食', icon: '🍪' },
  { id: 7, name: '酒水饮料', icon: '🍺' },
  { id: 8, name: '粮油调味', icon: '🌾' },
  { id: 9, name: '个护清洁', icon: '🧴' },
  { id: 10, name: '母婴用品', icon: '🍼' }
];

const promoProducts = ref([
  {
    id: 101,
    title: '新西兰进口奇异果 12个装',
    price: 39.9,
    original_price: 59.9,
    cover_image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400'
  },
  {
    id: 102,
    title: '澳大利亚牛肉 500g',
    price: 68,
    original_price: 98,
    cover_image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400'
  },
  {
    id: 103,
    title: '农夫山泉 550ml*24瓶',
    price: 29.9,
    original_price: 39.9,
    cover_image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400'
  },
  {
    id: 104,
    title: '进口牛奶 1L*6盒',
    price: 49.9,
    original_price: 69.9,
    cover_image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'
  }
]);

const products = ref([
  {
    id: 201,
    title: '有机苹果 1kg 新鲜水果',
    price: 25.9,
    original_price: 35.9,
    sales: 1258,
    cover_image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400'
  },
  {
    id: 202,
    title: '精选三文鱼 300g 刺身级',
    price: 89,
    original_price: 128,
    sales: 856,
    cover_image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400'
  },
  {
    id: 203,
    title: '鸡蛋 30枚 土鸡蛋',
    price: 29.9,
    original_price: 39.9,
    sales: 3256,
    cover_image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400'
  },
  {
    id: 204,
    title: '有机西兰花 500g',
    price: 12.9,
    original_price: 18.9,
    sales: 1568,
    cover_image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'
  },
  {
    id: 205,
    title: '纯牛奶 250ml*16盒',
    price: 59.9,
    original_price: 79.9,
    sales: 5689,
    cover_image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'
  },
  {
    id: 206,
    title: '薯片大礼包 多种口味',
    price: 49.9,
    original_price: 69.9,
    sales: 2356,
    cover_image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400'
  }
]);

const goBack = () => {
  router.back();
};

const goCart = () => {
  router.push('/cart');
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const filterByCategory = (categoryId) => {
  showToast('分类筛选功能开发中');
};

const addToCart = (product) => {
  cartCount.value++;
  showToast(`已添加 ${product.title} 到购物车`);
};
</script>

<style scoped>
.supermarket {
  padding-bottom: 30px;
  background: #f5f5f5;
  min-height: 100vh;
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

.back-btn {
  width: 40px;
  color: #fff;
  font-size: 20px;
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

.cart-btn {
  width: 40px;
  color: #fff;
  font-size: 20px;
}

.banner {
  padding: 12px 16px;
}

.banner img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 8px;
  overflow-x: auto;
  white-space: nowrap;
  margin-bottom: 12px;
}

.tab-item {
  padding: 14px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #ff5000;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #ff5000;
  border-radius: 2px;
}

.categories {
  background: #fff;
  padding: 16px 8px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin-bottom: 12px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
}

.category-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.category-name {
  font-size: 12px;
  color: #333;
}

.promo-section {
  margin: 0 16px 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.promo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.promo-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.promo-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff5000;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  z-index: 1;
}

.promo-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.promo-info {
  padding: 10px;
}

.promo-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.promo-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.current-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff5000;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.section {
  padding: 16px;
  background: #fff;
  margin-bottom: 12px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: #fafafa;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.product-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.product-info {
  padding: 10px;
  padding-right: 40px;
}

.product-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.product-meta {
  margin-bottom: 8px;
}

.sales {
  font-size: 11px;
  color: #999;
}

.product-price {
  display: flex;
  align-items: baseline;
}

.price-label {
  font-size: 12px;
  color: #ff5000;
  font-weight: 600;
}

.price-value {
  font-size: 18px;
  color: #ff5000;
  font-weight: 700;
}

.add-cart-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ff5000;
  border: none;
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.floating-cart {
  position: fixed;
  right: 20px;
  bottom: 100px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(to right, #ff5000, #ff6b00);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 80, 0, 0.4);
  cursor: pointer;
  z-index: 1000;
}

.cart-icon {
  font-size: 24px;
}

.cart-count {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 20px;
  height: 20px;
  background: #fff;
  color: #ff5000;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
