<template>
  <div class="ranking-detail-page">
    <header class="page-header">
      <div class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </div>
      <h1 class="page-title" v-if="ranking">{{ ranking.name }}</h1>
      <div class="search-btn" @click="goToSearch">
        <span class="search-icon">🔍</span>
      </div>
    </header>

    <div class="sort-tabs" v-if="items.length > 0">
      <div
        class="sort-tab"
        :class="{ active: sortBy === 'rank' }"
        @click="changeSort('rank')"
      >
        综合排名
      </div>
      <div
        class="sort-tab"
        :class="{ active: sortBy === 'gmv' }"
        @click="changeSort('gmv')"
      >
        GMV排序
      </div>
      <div
        class="sort-tab"
        :class="{ active: sortBy === 'sales' }"
        @click="changeSort('sales')"
      >
        销量排序
      </div>
    </div>

    <div class="content" v-if="!loading">
      <div
        class="product-card"
        v-for="(item, index) in items"
        :key="item.id"
        @click="goToProduct(item.product_id)"
      >
        <div class="rank-section">
          <div class="rank-badge" :class="getRankClass(index)">
            {{ item.rank }}
          </div>
        </div>
        
        <div class="product-image">
          <img :src="item.image" :alt="item.title">
          <div class="live-badge" v-if="item.is_live">
            <span class="live-dot"></span>
            直播中
          </div>
        </div>
        
        <div class="product-info">
          <div class="product-title">{{ item.title }}</div>
          
          <div class="tags" v-if="item.tags && item.tags.length > 0">
            <span
              class="tag"
              v-for="tag in item.tags"
              :key="tag"
              :class="getTagClass(tag)"
            >
              {{ tag }}
            </span>
          </div>
          
          <div class="influencer" v-if="item.influencer_name">
            <img :src="item.influencer_avatar" class="influencer-avatar" alt="">
            <span class="influencer-name">{{ item.influencer_name }}</span>
          </div>
          
          <div class="recommend-reason" v-if="item.recommend_reason">
            💬 {{ item.recommend_reason }}
          </div>
          
          <div class="stats">
            <span class="recommend-count">👥 {{ formatNumber(item.recommend_count) }}人推荐</span>
            <span class="recommend-value">⭐ {{ item.recommend_value.toFixed(1) }}</span>
          </div>
          
          <div class="price-section">
            <span class="price">¥{{ item.price }}</span>
            <button
              class="recommend-btn"
              @click.stop="handleRecommend(item)"
            >
              推荐
            </button>
          </div>
        </div>
      </div>

      <div class="empty" v-if="items.length === 0">
        <div class="empty-icon">📦</div>
        <p>暂无商品</p>
      </div>
    </div>

    <div class="loading" v-else>
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { rankingsAPI, productsAPI } from '../api';

const route = useRoute();
const router = useRouter();

const ranking = ref(null);
const items = ref([]);
const loading = ref(false);
const sortBy = ref('rank');

const loadRanking = async () => {
  loading.value = true;
  
  try {
    const id = route.params.id;
    const res = await rankingsAPI.getRankingById(id, sortBy.value);
    
    if (res.success) {
      ranking.value = res.data.ranking;
      items.value = res.data.items;
    }
  } catch (error) {
    console.error('加载榜单详情失败:', error);
  } finally {
    loading.value = false;
  }
};

const changeSort = (sort) => {
  sortBy.value = sort;
  loadRanking();
};

const goBack = () => {
  router.back();
};

const goToProduct = (id) => {
  router.push(`/product/${id}`);
};

const goToSearch = () => {
  router.push('/search');
};

const handleRecommend = async (item) => {
  try {
    const res = await productsAPI.recommend(item.product_id);
    if (res.success) {
      item.recommend_count++;
    }
  } catch (error) {
    console.error('推荐失败:', error);
  }
};

const getRankClass = (index) => {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return 'normal';
};

const getTagClass = (tag) => {
  const tagMap = {
    '热销': 'tag-hot',
    '新品': 'tag-new',
    '爆款': 'tag-hot',
    '限时特惠': 'tag-sale',
    '明星同款': 'tag-hot',
    '性价比之王': 'tag-new'
  };
  return tagMap[tag] || 'tag-sale';
};

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

onMounted(() => {
  loadRanking();
});
</script>

<style scoped>
.ranking-detail-page {
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-primary);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .search-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border-radius: 50%;
  cursor: pointer;
}

.back-icon {
  font-size: 18px;
  color: var(--text-primary);
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.search-icon {
  font-size: 16px;
}

.sort-tabs {
  display: flex;
  background-color: var(--bg-primary);
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}

.sort-tab {
  padding: 6px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 16px;
  transition: var(--transition);
}

.sort-tab.active {
  background-color: var(--primary-color);
  color: white;
}

.content {
  padding: 12px;
}

.product-card {
  display: flex;
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: var(--transition);
}

.product-card:active {
  transform: scale(0.99);
}

.rank-section {
  display: flex;
  align-items: flex-start;
  padding-right: 12px;
}

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: white;
  border-radius: var(--radius-md);
}

.rank-badge.gold {
  background: linear-gradient(135deg, #ffd700, #ffb347);
}

.rank-badge.silver {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
}

.rank-badge.normal {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
}

.product-image {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  align-items: center;
  padding: 2px 6px;
  background-color: var(--error-color);
  color: white;
  font-size: 10px;
  border-radius: 8px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background-color: white;
  border-radius: 50%;
  margin-right: 4px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.product-info {
  flex: 1;
  padding-left: 12px;
  display: flex;
  flex-direction: column;
}

.product-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  margin-right: 4px;
  margin-bottom: 4px;
}

.tag-hot {
  background-color: #fff1f0;
  color: var(--error-color);
}

.tag-new {
  background-color: #f6ffed;
  color: var(--success-color);
}

.tag-sale {
  background-color: #fff7e6;
  color: var(--warning-color);
}

.influencer {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.influencer-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 6px;
}

.influencer-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.recommend-reason {
  font-size: 12px;
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
}

.stats {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.recommend-count {
  margin-right: 12px;
}

.recommend-value {
  color: var(--warning-color);
}

.price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.recommend-btn {
  padding: 6px 16px;
  background-color: var(--primary-color);
  color: white;
  font-size: 13px;
  border-radius: 16px;
  transition: var(--transition);
}

.recommend-btn:hover {
  background-color: var(--primary-light);
}

.recommend-btn:active {
  transform: scale(0.95);
}
</style>
