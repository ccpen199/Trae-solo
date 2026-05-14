<template>
  <div class="juhuasuan">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">聚划算</span>
      <span class="placeholder"></span>
    </div>

    <div class="juhuasuan-content">
      <div class="countdown-banner">
        <div class="banner-left">
          <div class="banner-title">限时秒杀</div>
          <div class="banner-subtitle">全场低至3折</div>
        </div>
        <div class="countdown">
          <div class="countdown-label">距离结束</div>
          <div class="countdown-time">
            <span class="time-block">{{ hours }}</span>
            <span class="time-sep">:</span>
            <span class="time-block">{{ minutes }}</span>
            <span class="time-sep">:</span>
            <span class="time-block">{{ seconds }}</span>
          </div>
        </div>
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

      <div class="product-list">
        <div v-for="product in products" :key="product.id" class="product-item" @click="goDetail(product.id)">
          <div class="product-image-wrap">
            <img :src="product.cover_image" :alt="product.title" class="product-image" />
            <div class="discount-badge">{{ product.discount }}折</div>
          </div>
          <div class="product-info">
            <div class="product-title">{{ product.title }}</div>
            <div class="product-desc">{{ product.desc }}</div>
            <div class="price-row">
              <div class="price-info">
                <span class="price-symbol">¥</span>
                <span class="price-current">{{ product.price }}</span>
                <span class="price-original">¥{{ product.original_price }}</span>
              </div>
              <div class="sold-info">已抢{{ product.sold }}%</div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: product.sold + '%' }"></div>
            </div>
            <button class="btn-buy" @click.stop="showToast('抢购功能开发中')">马上抢</button>
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

const activeTab = ref('all');
const hours = ref('02');
const minutes = ref('30');
const seconds = ref('45');

let timer = null;

const tabs = [
  { label: '全部', value: 'all' },
  { label: '女装', value: 'women' },
  { label: '数码', value: 'digital' },
  { label: '家居', value: 'home' },
  { label: '美妆', value: 'beauty' }
];

const products = ref([
  {
    id: 1,
    title: '华为 Mate 60 Pro 256GB',
    desc: '旗舰芯片 超强性能',
    price: 5999,
    original_price: 6999,
    discount: 8.6,
    sold: 78,
    cover_image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
  },
  {
    id: 2,
    title: '时尚连衣裙 夏季新款',
    desc: '显瘦百搭 多色可选',
    price: 129,
    original_price: 299,
    discount: 4.3,
    sold: 92,
    cover_image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'
  },
  {
    id: 3,
    title: '智能扫地机器人',
    desc: '自动规划 深度清洁',
    price: 999,
    original_price: 1999,
    discount: 5,
    sold: 65,
    cover_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
  },
  {
    id: 4,
    title: '大牌护肤套装',
    desc: '补水保湿 提亮肤色',
    price: 299,
    original_price: 599,
    discount: 5,
    sold: 85,
    cover_image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'
  },
  {
    id: 5,
    title: '蓝牙耳机 Pro版',
    desc: '主动降噪 超长续航',
    price: 399,
    original_price: 799,
    discount: 5,
    sold: 72,
    cover_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
  },
  {
    id: 6,
    title: '运动鞋 夏季透气款',
    desc: '轻便舒适 时尚百搭',
    price: 199,
    original_price: 399,
    discount: 5,
    sold: 88,
    cover_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
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
.juhuasuan {
  padding-bottom: 30px;
  background: linear-gradient(to bottom, #ff5000 150px, #f5f5f5 150px);
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ff5000;
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

.juhuasuan-content {
  padding: 0 12px 12px;
}

.countdown-banner {
  background: linear-gradient(135deg, #ff6b00, #ff8c00);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.banner-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.countdown-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
  text-align: right;
}

.countdown-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-block {
  background: #000;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
}

.time-sep {
  color: #fff;
  font-weight: 600;
}

.tabs {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 0 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  padding: 14px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.tab-item.active {
  color: #ff5000;
  font-weight: 600;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-item {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  cursor: pointer;
}

.product-image-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.discount-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: #ff5000;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.product-info {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.product-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-symbol {
  font-size: 12px;
  color: #ff5000;
  font-weight: 600;
}

.price-current {
  font-size: 20px;
  color: #ff5000;
  font-weight: 700;
}

.price-original {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.sold-info {
  font-size: 12px;
  color: #ff5000;
}

.progress-bar {
  height: 8px;
  background: #ffe4dc;
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #ff5000, #ff6b00);
  border-radius: 4px;
}

.btn-buy {
  align-self: flex-end;
  background: linear-gradient(to right, #ff5000, #ff6b00);
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
}
</style>
