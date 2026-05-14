<template>
  <div class="subsidy">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">百亿补贴</span>
      <span class="placeholder"></span>
    </div>

    <div class="subsidy-content">
      <div class="hero-banner">
        <div class="banner-bg">
          <div class="banner-text">
            <div class="banner-title">百亿补贴</div>
            <div class="banner-subtitle">官方直补 全网低价</div>
          </div>
        </div>
      </div>

      <div class="categories">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          @click="activeCategory = category.id"
          :class="{ active: activeCategory === category.id }"
        >
          <div class="category-icon">{{ category.icon }}</div>
          <div class="category-name">{{ category.name }}</div>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-item" @click="activeFilter = 'all'" :class="{ active: activeFilter === 'all' }">综合</div>
        <div class="filter-item" @click="activeFilter = 'price'" :class="{ active: activeFilter === 'price' }">价格</div>
        <div class="filter-item" @click="activeFilter = 'sales'" :class="{ active: activeFilter === 'sales' }">销量</div>
      </div>

      <div class="product-grid">
        <div v-for="product in products" :key="product.id" class="product-card" @click="goDetail(product.id)">
          <div class="product-image-wrap">
            <img :src="product.cover_image" :alt="product.title" class="product-image" />
            <div class="subsidy-badge">
              <span class="subsidy-text">补贴</span>
              <span class="subsidy-amount">¥{{ product.subsidy }}</span>
            </div>
          </div>
          <div class="product-info">
            <div class="product-title">{{ product.title }}</div>
            <div class="product-desc">{{ product.desc }}</div>
            <div class="price-section">
              <div class="current-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ product.price }}</span>
              </div>
              <div class="original-price">¥{{ product.original_price }}</div>
            </div>
            <div class="product-footer">
              <span class="sold-text">已拼{{ product.sold }}件</span>
              <button class="btn-buy" @click.stop="showToast('购买功能开发中')">
                去抢购
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showToast = inject('showToast');

const activeCategory = ref(0);
const activeFilter = ref('all');

const categories = [
  { id: 0, name: '全部', icon: '🔥' },
  { id: 1, name: '数码', icon: '📱' },
  { id: 2, name: '美妆', icon: '💄' },
  { id: 3, name: '服饰', icon: '👗' },
  { id: 4, name: '食品', icon: '🍎' },
  { id: 5, name: '家居', icon: '🏠' }
];

const products = ref([
  {
    id: 1,
    title: 'Apple iPhone 15 Pro 128GB',
    desc: 'A17 Pro芯片 钛金属设计',
    price: 6999,
    original_price: 7999,
    subsidy: 1000,
    sold: 12580,
    cover_image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
  },
  {
    id: 2,
    title: '兰蔻小黑瓶精华 50ml',
    desc: '焕活肌肤 深层修护',
    price: 699,
    original_price: 1080,
    subsidy: 381,
    sold: 8562,
    cover_image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'
  },
  {
    id: 3,
    title: 'iPad Air 5 64GB',
    desc: 'M1芯片 超轻薄设计',
    price: 4299,
    original_price: 4799,
    subsidy: 500,
    sold: 5632,
    cover_image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'
  },
  {
    id: 4,
    title: 'Nike运动鞋 缓震系列',
    desc: '轻便透气 舒适百搭',
    price: 399,
    original_price: 699,
    subsidy: 300,
    sold: 32568,
    cover_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
  },
  {
    id: 5,
    title: '戴森吸尘器 V10',
    desc: '强劲吸力 智能感应',
    price: 2499,
    original_price: 3490,
    subsidy: 991,
    sold: 4568,
    cover_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
  },
  {
    id: 6,
    title: 'SK-II神仙水 230ml',
    desc: '调节肤质 改善暗沉',
    price: 1099,
    original_price: 1540,
    subsidy: 441,
    sold: 12896,
    cover_image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'
  }
]);

const goBack = () => {
  router.back();
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};
</script>

<style scoped>
.subsidy {
  padding-bottom: 30px;
  background: linear-gradient(to bottom, #e60012 180px, #f5f5f5 180px);
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #e60012;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .placeholder {
  width: 40px;
  color: #fff;
  font-size: 20px;
}

.title {
  color: #fff;
  font-size: 17px;
  font-weight: 600;
}

.hero-banner {
  padding: 0 16px 16px;
}

.banner-bg {
  background: linear-gradient(135deg, #ff3366, #e60012);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.banner-text .banner-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.banner-text .banner-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.categories {
  background: #fff;
  border-radius: 12px;
  margin: 0 16px 12px;
  padding: 16px 8px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s;
}

.category-item.active {
  opacity: 1;
}

.category-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.category-name {
  font-size: 12px;
  color: #333;
}

.filter-bar {
  display: flex;
  background: #fff;
  border-radius: 12px;
  margin: 0 16px 12px;
  padding: 8px;
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
}

.filter-item.active {
  background: #fff0f0;
  color: #e60012;
  font-weight: 600;
}

.product-grid {
  padding: 0 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.product-image-wrap {
  position: relative;
  aspect-ratio: 1;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.subsidy-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  background: linear-gradient(to right, #e60012, #ff3366);
  border-radius: 12px;
  overflow: hidden;
}

.subsidy-text {
  background: #fff;
  color: #e60012;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
}

.subsidy-amount {
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
}

.product-info {
  padding: 10px;
}

.product-title {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: 36px;
}

.product-desc {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-section {
  margin-bottom: 8px;
}

.current-price {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 12px;
  color: #e60012;
  font-weight: 600;
}

.price-value {
  font-size: 18px;
  color: #e60012;
  font-weight: 700;
}

.original-price {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sold-text {
  font-size: 11px;
  color: #999;
}

.btn-buy {
  background: linear-gradient(to right, #e60012, #ff3366);
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
</style>
