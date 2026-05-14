<template>
  <div class="alihealth">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="search-bar" @click="showToast('搜索功能开发中')">
        <span class="search-icon">🔍</span>
        <span class="search-placeholder">搜索药品、保健品</span>
      </div>
      <span class="placeholder"></span>
    </div>

    <div class="alihealth-content">
      <div class="hero-banner">
        <div class="banner-content">
          <div class="banner-title">阿里健康</div>
          <div class="banner-subtitle">正品保障 专业服务</div>
        </div>
      </div>

      <div class="quick-services">
        <div 
          v-for="service in services" 
          :key="service.id"
          class="service-item"
          @click="showToast(service.name + ' 功能开发中')"
        >
          <div class="service-icon">{{ service.icon }}</div>
          <div class="service-name">{{ service.name }}</div>
        </div>
      </div>

      <div class="health-reminder">
        <div class="reminder-icon">💊</div>
        <div class="reminder-content">
          <div class="reminder-title">每日健康提醒</div>
          <div class="reminder-text">记得按时服药，保持良好作息</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div class="section-title">热门分类</div>
        </div>
        <div class="category-grid">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-item"
            @click="showToast(category.name + ' 功能开发中')"
          >
            <div class="category-icon">{{ category.icon }}</div>
            <div class="category-name">{{ category.name }}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div class="section-title">为你推荐</div>
          <div class="section-more">查看更多 ></div>
        </div>
        <div class="product-grid">
          <div v-for="product in products" :key="product.id" class="product-card" @click="goDetail(product.id)">
            <div class="product-image-wrap">
              <img :src="product.cover_image" :alt="product.title" class="product-image" />
              <div class="product-tag" v-if="product.tag">{{ product.tag }}</div>
            </div>
            <div class="product-info">
              <div class="product-title">{{ product.title }}</div>
              <div class="product-desc">{{ product.desc }}</div>
              <div class="product-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ product.price }}</span>
              </div>
              <div class="product-footer">
                <span class="sold-text">月销{{ product.sold }}</span>
                <button class="btn-buy" @click.stop="showToast('购买功能开发中')">
                  立即购买
                </button>
              </div>
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

const services = [
  { id: 1, name: '在线问诊', icon: '👨‍⚕️' },
  { id: 2, name: '健康档案', icon: '📋' },
  { id: 3, name: '送药上门', icon: '🚚' },
  { id: 4, name: '疫苗接种', icon: '💉' },
  { id: 5, name: '体检预约', icon: '🏥' },
  { id: 6, name: '健康资讯', icon: '📰' }
];

const categories = [
  { id: 1, name: '感冒用药', icon: '🌡️' },
  { id: 2, name: '肠胃用药', icon: '💊' },
  { id: 3, name: '皮肤用药', icon: '🧴' },
  { id: 4, name: '维生素', icon: '💊' },
  { id: 5, name: '保健品', icon: '🥗' },
  { id: 6, name: '医疗器械', icon: '🩺' },
  { id: 7, name: '成人用品', icon: '❤️' },
  { id: 8, name: '母婴用品', icon: '🍼' }
];

const products = ref([
  {
    id: 1,
    title: '维生素C咀嚼片',
    desc: '增强免疫力 100片装',
    price: 39.9,
    tag: '热销',
    sold: 12580,
    cover_image: 'https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400'
  },
  {
    id: 2,
    title: '医用口罩 50只装',
    desc: '三层防护 透气舒适',
    price: 19.9,
    tag: '防疫必备',
    sold: 85620,
    cover_image: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=400'
  },
  {
    id: 3,
    title: '钙尔奇钙片',
    desc: '中老年补钙 60片装',
    price: 69,
    tag: '买2送1',
    sold: 32568,
    cover_image: 'https://images.unsplash.com/photo-1587854692958-ebfd4614c836?w=400'
  },
  {
    id: 4,
    title: '电子体温计',
    desc: '精准测温 快速读数',
    price: 29.9,
    tag: '限时特惠',
    sold: 15689,
    cover_image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400'
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
.alihealth {
  padding-bottom: 30px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(to right, #00a4ff, #00b7ff);
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

.placeholder {
  width: 40px;
}

.alihealth-content {
  padding-bottom: 16px;
}

.hero-banner {
  background: linear-gradient(135deg, #00a4ff 0%, #00b7ff 100%);
  padding: 24px 20px;
}

.banner-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.banner-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.quick-services {
  background: #fff;
  margin: -20px 16px 12px;
  border-radius: 16px;
  padding: 20px 12px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.service-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.service-name {
  font-size: 12px;
  color: #333;
}

.health-reminder {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #e8f8ff, #d0f0ff);
  margin: 0 16px 12px;
  padding: 16px;
  border-radius: 12px;
}

.reminder-icon {
  font-size: 32px;
}

.reminder-title {
  font-size: 14px;
  font-weight: 600;
  color: #0077aa;
  margin-bottom: 4px;
}

.reminder-text {
  font-size: 12px;
  color: #666;
}

.section {
  background: #fff;
  margin: 0 16px 12px;
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

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
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

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: #fafafa;
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

.product-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #00a4ff;
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
}

.product-info {
  padding: 10px;
}

.product-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.price-symbol {
  font-size: 12px;
  color: #00a4ff;
  font-weight: 600;
}

.price-value {
  font-size: 18px;
  color: #00a4ff;
  font-weight: 700;
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
  background: linear-gradient(to right, #00a4ff, #00b7ff);
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
</style>
