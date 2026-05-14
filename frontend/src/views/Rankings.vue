<template>
  <div class="rankings-page">
    <header class="page-header">
      <h1 class="page-title">好物榜</h1>
      <div class="search-btn" @click="goToSearch">
        <span class="search-icon">🔍</span>
      </div>
    </header>

    <div class="refresh-status" v-if="refreshStatus !== 'idle'">
      <div class="status-content" :class="refreshStatus">
        <span v-if="refreshStatus === 'loading'" class="loading-spinner"></span>
        <span v-if="refreshStatus === 'loading'">正在刷新...</span>
        <span v-else-if="refreshStatus === 'success'">刷新成功</span>
        <span v-else-if="refreshStatus === 'cached'">5分钟内已更新</span>
      </div>
    </div>

    <div class="tabs">
      <div
        class="tab"
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="content" v-if="!loading">
      <div
        class="ranking-card"
        v-for="ranking in rankings"
        :key="ranking.id"
      >
        <div class="ranking-header" @click="goToRanking(ranking.id)">
          <div class="ranking-info">
            <span class="ranking-name">{{ ranking.name }}</span>
            <span class="ranking-count">{{ ranking.item_count }}件好物</span>
          </div>
          <span class="arrow">→</span>
        </div>
        
        <div class="ranking-items" v-if="ranking.items && ranking.items.length > 0">
          <div
            class="ranking-item"
            v-for="(item, index) in ranking.items.slice(0, 3)"
            :key="item.id"
            @click="goToProduct(item.product_id)"
          >
            <div class="item-rank">
              <span class="rank-badge" :class="getRankBadgeClass(index)">{{ item.rank }}</span>
            </div>
            <div class="item-image">
              <img :src="item.image" :alt="item.title">
            </div>
            <div class="item-info">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-stats">
                <span class="recommend-count">👥 {{ formatNumber(item.recommend_count) }}人推荐</span>
                <span class="recommend-value">⭐ {{ item.recommend_value.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ranking-desc">{{ ranking.description }}</div>
      </div>

      <div class="empty" v-if="rankings.length === 0">
        <div class="empty-icon">📋</div>
        <p>暂无榜单</p>
      </div>
    </div>

    <div class="loading" v-else>
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div class="pull-refresh" :class="{ active: pullDistance > 50 }" v-show="pullDistance > 0">
      <span v-if="pullDistance < 80">下拉刷新</span>
      <span v-else>释放刷新</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { rankingsAPI } from '../api';

const router = useRouter();

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'hot', label: '热门榜' },
  { key: 'recommend', label: '推荐榜' },
  { key: 'vertical', label: '垂直榜' }
];

const activeTab = ref('all');
const rankings = ref([]);
const loading = ref(false);
const refreshStatus = ref('idle');

const pullStartY = ref(0);
const pullDistance = ref(0);
const lastRefreshTime = ref(0);
const RANKING_CACHE_TIME = 300000;

const loadRankings = async (isRefresh = false) => {
  const now = Date.now();
  
  if (!isRefresh && lastRefreshTime.value > 0 && now - lastRefreshTime.value < RANKING_CACHE_TIME) {
    refreshStatus.value = 'cached';
    setTimeout(() => {
      refreshStatus.value = 'idle';
    }, 2000);
    return;
  }
  
  if (isRefresh) {
    refreshStatus.value = 'loading';
  }
  
  loading.value = true;
  
  try {
    const type = activeTab.value === 'all' ? null : 
                 activeTab.value === 'vertical' ? null : activeTab.value;
    
    const res = await rankingsAPI.getRankings(type);
    
    if (res.success) {
      let data = res.data;
      
      if (activeTab.value === 'vertical') {
        data = data.filter(r => !['hot', 'recommend'].includes(r.type));
      } else if (activeTab.value === 'all') {
        const hot = data.find(r => r.type === 'hot');
        const recommend = data.find(r => r.type === 'recommend');
        const others = data.filter(r => !['hot', 'recommend'].includes(r.type));
        data = [hot, recommend, ...others].filter(Boolean);
      }
      
      for (const ranking of data) {
        const detailRes = await rankingsAPI.getRankingById(ranking.id);
        if (detailRes.success) {
          ranking.items = detailRes.data.items.slice(0, 3);
        }
      }
      
      rankings.value = data;
      lastRefreshTime.value = now;
      
      if (isRefresh) {
        refreshStatus.value = 'success';
        setTimeout(() => {
          refreshStatus.value = 'idle';
        }, 2000);
      }
    }
  } catch (error) {
    console.error('加载榜单失败:', error);
  } finally {
    loading.value = false;
  }
};

const switchTab = (key) => {
  if (activeTab.value !== key) {
    activeTab.value = key;
    loadRankings();
  }
};

const goToRanking = (id) => {
  router.push(`/ranking/${id}`);
};

const goToSearch = () => {
  router.push('/search');
};

const goToProduct = (id) => {
  router.push(`/product/${id}`);
};

const getRankBadgeClass = (index) => {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return 'normal';
};

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

const handleTouchStart = (e) => {
  if (window.scrollY === 0) {
    pullStartY.value = e.touches[0].clientY;
  }
};

const handleTouchMove = (e) => {
  if (pullStartY.value > 0 && window.scrollY === 0) {
    const currentY = e.touches[0].clientY;
    pullDistance.value = Math.max(0, currentY - pullStartY.value);
  }
};

const handleTouchEnd = async () => {
  if (pullDistance.value > 80) {
    await loadRankings(true);
  }
  pullDistance.value = 0;
  pullStartY.value = 0;
};

const checkAutoRefresh = () => {
  const now = Date.now();
  if (lastRefreshTime.value > 0 && now - lastRefreshTime.value >= RANKING_CACHE_TIME) {
    loadRankings(true);
  }
};

let visibilityChangeHandler = null;

onMounted(() => {
  loadRankings();
  
  document.addEventListener('touchstart', handleTouchStart);
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', handleTouchEnd);
  
  visibilityChangeHandler = () => {
    if (!document.hidden) {
      checkAutoRefresh();
    }
  };
  document.addEventListener('visibilitychange', visibilityChangeHandler);
});

onUnmounted(() => {
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);
  
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
  }
});
</script>

<style scoped>
.rankings-page {
  min-height: 100vh;
  background-color: var(--bg-secondary);
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--bg-primary);
  position: sticky;
  top: 0;
  z-index: 100;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-primary);
}

.search-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border-radius: 50%;
  cursor: pointer;
}

.search-icon {
  font-size: 18px;
}

.refresh-status {
  padding: 8px 20px;
  background-color: var(--bg-primary);
  text-align: center;
}

.status-content {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
}

.status-content.loading {
  color: var(--primary-color);
}

.status-content.success {
  color: var(--success-color);
}

.status-content.cached {
  color: var(--text-secondary);
}

.status-content .loading-spinner {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

.tabs {
  display: flex;
  background-color: var(--bg-primary);
  padding: 0 20px 12px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border-color);
}

.tab {
  flex-shrink: 0;
  padding: 8px 20px;
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 20px;
  margin-right: 10px;
  transition: var(--transition);
}

.tab.active {
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
}

.content {
  padding: 12px;
}

.ranking-card {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  cursor: pointer;
  padding: 4px 0;
}

.ranking-header:active {
  opacity: 0.7;
}

.ranking-info {
  display: flex;
  align-items: baseline;
}

.ranking-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
  margin-right: 10px;
}

.ranking-count {
  font-size: 12px;
  color: var(--text-muted);
}

.arrow {
  color: var(--text-muted);
  font-size: 18px;
}

.ranking-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.ranking-item:active {
  transform: scale(0.98);
}

.item-rank {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
  border-radius: 6px;
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
  background-color: var(--text-muted);
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}

.item-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.recommend-count {
  color: var(--text-secondary);
}

.recommend-value {
  color: var(--warning-color);
  font-weight: 500;
}

.ranking-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.pull-refresh {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: var(--text-muted);
  transition: top 0.2s;
}

.pull-refresh.active {
  color: var(--primary-color);
}
</style>
