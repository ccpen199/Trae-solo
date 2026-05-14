<template>
  <div class="favorites" v-if="!loading && !error">
    <div class="favorites-header">
      <h2>我的收藏</h2>
    </div>

    <div class="favorites-tabs">
      <el-radio-group v-model="activeType" size="small" @change="loadFavorites">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="question">问题</el-radio-button>
        <el-radio-button label="article">文章</el-radio-button>
      </el-radio-group>
    </div>

    <div class="favorites-list">
      <div 
        class="favorite-item" 
        v-for="item in favorites" 
        :key="item.id"
        @click="goToContent(item)"
      >
        <div class="item-header">
          <el-tag size="small" :type="item.content_type === 'question' ? 'primary' : 'success'">
            {{ item.content_type === 'question' ? '问题' : '文章' }}
          </el-tag>
          <span class="fav-time">收藏于 {{ formatTime(item.created_at) }}</span>
        </div>
        <h3 class="item-title">{{ item.content_title }}</h3>
        <div class="item-summary" v-if="item.content_summary">
          {{ item.content_summary }}
        </div>
        <div class="item-meta">
          <span>{{ item.author_username }}</span>
          <span>{{ item.view_count || 0 }} 浏览</span>
          <span>{{ item.like_count || 0 }} 点赞</span>
        </div>
      </div>

      <el-empty v-if="favorites.length === 0" description="暂无收藏" />
      
      <div class="load-more" v-if="hasMore">
        <el-button @click="loadMoreFavorites" :loading="loadingMore">加载更多</el-button>
      </div>
    </div>
  </div>

  <div v-if="loading" class="loading-container">
    <el-skeleton :count="5" animated />
  </div>

  <div v-if="error" class="error-container">
    <el-empty :description="errorMessage">
      <el-button type="primary" @click="retry">重试</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { favoriteApi } from '@/api';

const router = useRouter();

const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const favorites = ref([]);
const activeType = ref('all');
const page = ref(1);
const hasMore = ref(false);
const loadingMore = ref(false);

const loadFavorites = async () => {
  page.value = 1;
  favorites.value = [];
  await fetchFavorites();
};

const fetchFavorites = async () => {
  loadingMore.value = true;
  try {
    const response = await favoriteApi.getList({
      type: activeType.value === 'all' ? undefined : activeType.value,
      page: page.value,
      page_size: 20
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      if (page.value === 1) {
        favorites.value = data.items || [];
      } else {
        favorites.value = [...favorites.value, ...(data.items || [])];
      }
      hasMore.value = (page.value * 20) < (data.total || 0);
    }
  } catch (err) {
    if (page.value === 1) {
      error.value = true;
      errorMessage.value = err.response?.data?.message || '加载失败';
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const loadMoreFavorites = () => {
  page.value++;
  fetchFavorites();
};

const goToContent = (item) => {
  if (item.content_type === 'question') {
    router.push(`/questions/${item.content_id}`);
  } else if (item.content_type === 'article') {
    router.push(`/articles/${item.content_id}`);
  }
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleDateString();
};

const retry = () => {
  error.value = false;
  loadFavorites();
};

onMounted(() => {
  loadFavorites();
});
</script>

<style scoped>
.favorites {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.favorites-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.favorites-header h2 {
  font-size: 20px;
  margin: 0;
}

.favorites-tabs {
  margin-bottom: 20px;
}

.favorites-list {
  min-height: 300px;
}

.favorite-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.favorite-item:hover {
  background: #f9f9f9;
}

.favorite-item:last-child {
  border-bottom: none;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.fav-time {
  color: #909399;
  font-size: 13px;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #303133;
}

.favorite-item:hover .item-title {
  color: #409eff;
}

.item-summary {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 13px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.loading-container, .error-container {
  padding: 40px;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  max-width: 700px;
  margin: 0 auto;
}
</style>
