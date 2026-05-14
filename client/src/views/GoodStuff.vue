<template>
  <div class="good-stuff">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">有好货</span>
      <span class="placeholder"></span>
    </div>

    <div class="good-stuff-content">
      <div class="hero-banner">
        <div class="banner-content">
          <div class="banner-title">有好货</div>
          <div class="banner-subtitle">精选好物 品质生活</div>
        </div>
        <div class="banner-decorations">
          <span class="deco">✨</span>
          <span class="deco">⭐</span>
          <span class="deco">💎</span>
        </div>
      </div>

      <div class="featured-section">
        <div class="section-header">
          <div class="section-title">精选推荐</div>
          <div class="section-more">查看更多 ></div>
        </div>
        <div class="featured-list">
          <div v-for="item in featuredItems" :key="item.id" class="featured-card" @click="goDetail(item.id)">
            <div class="featured-image-wrap">
              <img :src="item.cover_image" :alt="item.title" class="featured-image" />
              <div class="featured-tag">精选</div>
            </div>
            <div class="featured-info">
              <div class="featured-title">{{ item.title }}</div>
              <div class="featured-desc">{{ item.desc }}</div>
              <div class="featured-price">¥{{ item.price }}</div>
            </div>
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
          {{ category.name }}
        </div>
      </div>

      <div class="product-waterfall">
        <div class="waterfall-column">
          <div v-for="product in leftProducts" :key="product.id" class="product-card" @click="goDetail(product.id)">
            <div class="product-image-wrap">
              <img :src="product.cover_image" :alt="product.title" class="product-image" />
            </div>
            <div class="product-info">
              <div class="product-title">{{ product.title }}</div>
              <div class="product-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ product.price }}</span>
              </div>
              <div class="product-likes">❤️ {{ product.likes }}</div>
            </div>
          </div>
        </div>
        <div class="waterfall-column">
          <div v-for="product in rightProducts" :key="product.id" class="product-card" @click="goDetail(product.id)">
            <div class="product-image-wrap">
              <img :src="product.cover_image" :alt="product.title" class="product-image" />
            </div>
            <div class="product-info">
              <div class="product-title">{{ product.title }}</div>
              <div class="product-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ product.price }}</span>
              </div>
              <div class="product-likes">❤️ {{ product.likes }}</div>
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

const categories = [
  { id: 0, name: '全部' },
  { id: 1, name: '穿搭' },
  { id: 2, name: '美妆' },
  { id: 3, name: '家居' },
  { id: 4, name: '数码' },
  { id: 5, name: '美食' }
];

const featuredItems = ref([
  {
    id: 1,
    title: '设计师款连衣裙',
    desc: '原创设计 独特风格',
    price: 299,
    cover_image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'
  },
  {
    id: 2,
    title: '手工皮质手提包',
    desc: '匠心制作 质感满分',
    price: 599,
    cover_image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400'
  }
]);

const leftProducts = ref([
  {
    id: 101,
    title: '北欧简约陶瓷花瓶',
    price: 129,
    likes: 1256,
    cover_image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400'
  },
  {
    id: 102,
    title: '复古机械手表',
    price: 899,
    likes: 856,
    cover_image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400'
  },
  {
    id: 103,
    title: '手工香薰蜡烛',
    price: 68,
    likes: 2568,
    cover_image: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400'
  }
]);

const rightProducts = ref([
  {
    id: 201,
    title: '真皮钱包',
    price: 199,
    likes: 986,
    cover_image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400'
  },
  {
    id: 202,
    title: '高品质蓝牙耳机',
    price: 399,
    likes: 3256,
    cover_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
  },
  {
    id: 203,
    title: '精致项链',
    price: 259,
    likes: 1896,
    cover_image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'
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
.good-stuff {
  padding-bottom: 30px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(to right, #667eea, #764ba2);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.banner-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.banner-decorations {
  display: flex;
  gap: 8px;
}

.deco {
  font-size: 24px;
}

.featured-section {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-more {
  font-size: 12px;
  color: #999;
}

.featured-list {
  display: flex;
  gap: 12px;
}

.featured-card {
  flex: 1;
  cursor: pointer;
}

.featured-image-wrap {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.featured-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(102, 126, 234, 0.9);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.featured-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.featured-desc {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.featured-price {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.categories {
  display: flex;
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 8px;
  overflow-x: auto;
  white-space: nowrap;
}

.category-item {
  padding: 8px 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 20px;
  margin-right: 8px;
}

.category-item.active {
  background: #667eea;
  color: #fff;
}

.product-waterfall {
  display: flex;
  gap: 8px;
  padding: 0 12px;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.product-image-wrap {
  aspect-ratio: 1;
}

.product-image {
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
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: 36px;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
}

.price-symbol {
  font-size: 12px;
  color: #667eea;
  font-weight: 600;
}

.price-value {
  font-size: 16px;
  color: #667eea;
  font-weight: 700;
}

.product-likes {
  font-size: 11px;
  color: #999;
}
</style>
