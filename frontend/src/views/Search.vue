<template>
  <div class="search-page">
    <header class="search-header">
      <div class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </div>
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="search-input"
          v-model="keyword"
          placeholder="搜索你想要的好物"
          @keyup.enter="handleSearch"
          @focus="handleFocus"
          ref="searchInput"
        />
        <span class="clear-btn" v-if="keyword" @click="clearKeyword">✕</span>
      </div>
      <div class="action-btn" @click="handleAction">
        {{ isSearching ? '搜索' : '取消' }}
      </div>
    </header>

    <div class="content" v-if="!isSearching && !hasSearched">
      <div class="history-section" v-if="history.length > 0">
        <div class="section-header">
          <span class="section-title">历史搜索</span>
          <span class="clear-history" @click="clearHistory">清空</span>
        </div>
        <div class="history-tags">
          <span
            class="history-tag"
            v-for="(item, index) in history"
            :key="index"
            @click="searchKeyword(item)"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <div class="hot-section">
        <div class="section-header">
          <span class="section-title">🔥 热门搜索</span>
        </div>
        <div class="hot-tags">
          <span
            class="hot-tag"
            v-for="(item, index) in hotKeywords"
            :key="index"
            @click="searchKeyword(item)"
          >
            <span class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
            {{ item }}
          </span>
        </div>
      </div>
    </div>

    <div class="content" v-else-if="isSearching">
      <div class="loading">
        <div class="loading-spinner"></div>
        <span>搜索中...</span>
      </div>
    </div>

    <div class="content" v-else-if="hasSearched">
      <div class="results-header">
        <span class="results-count">找到 {{ results.length }} 个相关商品</span>
      </div>

      <div class="results-list" v-if="results.length > 0">
        <div
          class="result-item"
          v-for="item in results"
          :key="item.id"
          @click="goToProduct(item.id)"
        >
          <div class="result-image">
            <img :src="item.image" :alt="item.title">
          </div>
          <div class="result-info">
            <div class="result-title">{{ item.title }}</div>
            <div class="result-tags" v-if="item.ranking_name">
              <span class="ranking-tag">🏆 {{ item.ranking_name }} 第{{ item.rank }}名</span>
            </div>
            <div class="result-price">¥{{ item.price }}</div>
            <div class="result-stats">
              <span>已售 {{ formatNumber(item.sales_count) }}</span>
              <span>GMV ¥{{ formatNumber(item.gmv) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty" v-else>
        <div class="empty-icon">🔍</div>
        <p>没有找到相关商品</p>
        <p class="empty-tip">试试其他关键词吧</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { searchAPI } from '../api';

const router = useRouter();

const keyword = ref('');
const history = ref([]);
const results = ref([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const searchInput = ref(null);

const hotKeywords = [
  '智能手表',
  '蓝牙耳机',
  '笔记本电脑',
  '显示器',
  '扫地机器人',
  '护肤套装',
  '空气净化器',
  '充电宝'
];

const loadHistory = async () => {
  try {
    const res = await searchAPI.getHistory();
    if (res.success) {
      history.value = res.data;
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error);
  }
};

const handleSearch = async () => {
  if (!keyword.value.trim()) return;
  
  isSearching.value = true;
  
  try {
    const res = await searchAPI.search(keyword.value.trim());
    if (res.success) {
      results.value = res.data;
      hasSearched.value = true;
      await loadHistory();
    }
  } catch (error) {
    console.error('搜索失败:', error);
  } finally {
    isSearching.value = false;
  }
};

const searchKeyword = (kw) => {
  keyword.value = kw;
  handleSearch();
};

const clearKeyword = () => {
  keyword.value = '';
  hasSearched.value = false;
  results.value = [];
  nextTick(() => {
    searchInput.value?.focus();
  });
};

const clearHistory = async () => {
  try {
    const res = await searchAPI.clearHistory();
    if (res.success) {
      history.value = [];
    }
  } catch (error) {
    console.error('清空历史失败:', error);
  }
};

const handleFocus = () => {
  if (!keyword.value) {
    hasSearched.value = false;
    results.value = [];
  }
};

const handleAction = () => {
  if (keyword.value.trim()) {
    handleSearch();
  } else {
    goBack();
  }
};

const goBack = () => {
  router.back();
};

const goToProduct = (id) => {
  router.push(`/product/${id}`);
};

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

onMounted(() => {
  loadHistory();
  nextTick(() => {
    searchInput.value?.focus();
  });
});
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.search-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-primary);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 12px;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
}

.back-icon {
  font-size: 18px;
  color: var(--text-primary);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--bg-secondary);
  border-radius: 18px;
  padding: 8px 16px;
  gap: 8px;
}

.search-icon {
  font-size: 16px;
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.action-btn {
  font-size: 15px;
  color: var(--primary-color);
  cursor: pointer;
  white-space: nowrap;
}

.content {
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
  font-weight: bold;
  color: var(--text-primary);
}

.clear-history {
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
}

.history-section {
  margin-bottom: 24px;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-tag {
  padding: 8px 16px;
  background-color: var(--bg-secondary);
  border-radius: 16px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.history-tag:active {
  background-color: var(--border-color);
}

.hot-tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-tag {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition);
}

.hot-tag:last-child {
  border-bottom: none;
}

.hot-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  color: var(--text-secondary);
  margin-right: 12px;
}

.hot-rank.top {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
}

.results-header {
  margin-bottom: 16px;
}

.results-count {
  font-size: 14px;
  color: var(--text-muted);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  transition: var(--transition);
}

.result-item:active {
  transform: scale(0.99);
}

.result-image {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.result-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-info {
  flex: 1;
  padding-left: 12px;
  display: flex;
  flex-direction: column;
}

.result-title {
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

.result-tags {
  margin-bottom: 6px;
}

.ranking-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #fff1f0;
  color: var(--error-color);
  font-size: 12px;
  border-radius: 4px;
}

.result-price {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.result-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-tip {
  font-size: 13px;
  margin-top: 8px;
}
</style>
