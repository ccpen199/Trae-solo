<template>
  <div class="sale">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">天天特卖</span>
      <span class="placeholder"></span>
    </div>

    <div class="sale-content">
      <div class="hero-banner">
        <div class="banner-bg">
          <div class="banner-text">
            <div class="banner-title">天天特卖</div>
            <div class="banner-subtitle">每日更新 极致低价</div>
          </div>
          <div class="countdown">
            <div class="countdown-label">限时</div>
            <div class="countdown-time">{{ hours }}:{{ minutes }}:{{ seconds }}</div>
          </div>
        </div>
      </div>

      <div class="quick-categories">
        <div 
          v-for="cat in quickCategories" 
          :key="cat.id"
          class="quick-cat-item"
          @click="activeQuickCat = cat.id"
          :class="{ active: activeQuickCat === cat.id }"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
        </div>
      </div>

      <div class="flash-sale">
        <div class="section-header">
          <div class="section-title">限时秒杀</div>
          <div class="section-more">查看全部 ></div>
        </div>
        <div class="flash-list">
          <div v-for="item in flashItems" :key="item.id" class="flash-card" @click="goDetail(item.id)">
            <img :src="item.cover_image" :alt="item.title" class="flash-image" />
            <div class="flash-price">
              <span class="current">¥{{ item.price }}</span>
              <span class="original">¥{{ item.original_price }}</span>
            </div>
            <div class="flash-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: item.soldPercent + '%' }"></div>
              </div>
              <div class="progress-text">已抢{{ item.soldPercent }}%</div>
            </div>
          </div>
        </div>
      </div>

      <div class="product-list">
        <div class="section-header">
          <div class="section-title">超值特惠</div>
        </div>
        <div class="product-grid">
          <div v-for="product in products" :key="product.id" class="product-card" @click="goDetail(product.id)">
            <div class="product-image-wrap">
              <img :src="product.cover_image" :alt="product.title" class="product-image" />
              <div class="sale-tag">{{ product.tag }}</div>
            </div>
            <div class="product-info">
              <div class="product-title">{{ product.title }}</div>
              <div class="product-desc">{{ product.desc }}</div>
              <div class="product-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ product.price }}</span>
                <span class="price-original">¥{{ product.original_price }}</span>
              </div>
              <div class="product-footer">
                <span class="sold-text">已售{{ product.sold }}件</span>
                <button class="btn-buy" @click.stop="showToast('购买功能开发中')">
                  去抢
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
import { ref, inject, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showToast = inject('showToast');

const activeQuickCat = ref(0);
const hours = ref('01');
const minutes = ref('59');
const seconds = ref('59');

let timer = null;

const quickCategories = [
  { id: 0, name: '全部', icon: '🔥' },
  { id: 1, name: '9.9包邮', icon: '💸' },
  { id: 2, name: '19.9特卖', icon: '💰' },
  { id: 3, name: '爆款', icon: '⭐' }
];

const flashItems = ref([
  {
    id: 1,
    title: '纯棉T恤',
    price: 9.9,
    original_price: 39.9,
    soldPercent: 85,
    cover_image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'
  },
  {
    id: 2,
    title: '手机支架',
    price: 6.9,
    original_price: 29.9,
    soldPercent: 92,
    cover_image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
  },
  {
    id: 3,
    title: '数据线',
    price: 8.9,
    original_price: 25.9,
    soldPercent: 76,
    cover_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
  }
]);

const products = ref([
  {
    id: 101,
    title: '高品质耳机',
    desc: '降噪耳机 音质出色',
    price: 29.9,
    original_price: 99,
    tag: '直降69元',
    sold: 12580,
    cover_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
  },
  {
    id: 102,
    title: '创意台灯',
    desc: '护眼台灯 多档调节',
    price: 19.9,
    original_price: 69,
    tag: '4折特惠',
    sold: 8562,
    cover_image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400'
  },
  {
    id: 103,
    title: '便携充电宝',
    desc: '10000mAh 轻薄便携',
    price: 39.9,
    original_price: 99,
    tag: '限时抢购',
    sold: 25689,
    cover_image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400'
  },
  {
    id: 104,
    title: '精美笔记本',
    desc: '质感封面 内页丰富',
    price: 12.9,
    original_price: 39,
    tag: '3折优惠',
    sold: 6523,
    cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'
  }
]);

const updateCountdown = () => {
  let h = parseInt(hours.value);
  let m = parseInt(minutes.value);
  let s = parseInt(seconds.value);
  
  if (s > 0) {
    s--;
  } else if (m > 0) {
    m--;
    s = 59;
  } else if (h > 0) {
    h--;
    m = 59;
    s = 59;
  }
  
  hours.value = String(h).padStart(2, '0');
  minutes.value = String(m).padStart(2, '0');
  seconds.value = String(s).padStart(2, '0');
};

const goBack = () => {
  router.back();
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

onMounted(() => {
  timer = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.sale {
  padding-bottom: 30px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(to right, #ff4757, #ff6b81);
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
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  padding: 20px;
}

.banner-bg {
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
  color: rgba(255, 255, 255, 0.9);
}

.countdown {
  text-align: right;
}

.countdown-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}

.countdown-time {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  background: #000;
  padding: 4px 8px;
  border-radius: 4px;
}

.quick-categories {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px 8px;
  display: flex;
  justify-content: space-around;
}

.quick-cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s;
}

.quick-cat-item.active {
  opacity: 1;
}

.cat-icon {
  font-size: 24px;
}

.cat-name {
  font-size: 12px;
  color: #333;
}

.flash-sale {
  background: #fff;
  margin: 0 12px 12px;
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

.flash-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.flash-card {
  width: 100px;
  flex-shrink: 0;
  cursor: pointer;
}

.flash-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
}

.flash-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}

.current {
  font-size: 14px;
  font-weight: 600;
  color: #ff4757;
}

.original {
  font-size: 10px;
  color: #999;
  text-decoration: line-through;
}

.flash-progress {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-bar {
  height: 6px;
  background: #ffe0e6;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ff4757;
  border-radius: 3px;
}

.progress-text {
  font-size: 10px;
  color: #ff4757;
}

.product-list {
  padding: 12px;
}

.product-grid {
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

.sale-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff4757;
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
  gap: 4px;
  margin-bottom: 8px;
}

.price-symbol {
  font-size: 12px;
  color: #ff4757;
  font-weight: 600;
}

.price-value {
  font-size: 18px;
  color: #ff4757;
  font-weight: 700;
}

.price-original {
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
  background: linear-gradient(to right, #ff4757, #ff6b81);
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
</style>
