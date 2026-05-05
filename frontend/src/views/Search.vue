<template>
  <div class="search-page page-container">
    <div class="container">
      <div class="search-header">
        <h1>搜索</h1>
        <el-input
          v-model="keyword"
          placeholder="搜索书籍、频道、图书馆..."
          size="large"
          @keyup.enter="performSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" @click="performSearch" :loading="loading">
              搜索
            </el-button>
          </template>
        </el-input>
      </div>

      <div v-if="hasResults" class="search-results">
        <el-tabs v-model="activeTab" class="result-tabs">
          <el-tab-pane label="书籍" name="books">
            <div v-if="results.books.length > 0" class="results-grid">
              <div
                v-for="book in results.books"
                :key="book.id"
                class="result-item book-item"
                @click="goToBook(book)"
              >
                <el-card shadow="hover">
                  <img :src="book.coverImage" :alt="book.title" class="book-cover" />
                  <h3 class="item-title text-ellipsis">{{ book.title }}</h3>
                  <p class="item-meta">{{ book.author }}</p>
                  <div class="item-stats">
                    <el-rate :model-value="book.rating" disabled size="small" />
                    <span class="rating-text">{{ book.rating }}</span>
                  </div>
                </el-card>
              </div>
            </div>
            <el-empty v-else description="暂无相关书籍" />
          </el-tab-pane>

          <el-tab-pane label="频道" name="channels">
            <div v-if="results.channels.length > 0" class="results-list">
              <div
                v-for="channel in results.channels"
                :key="channel.id"
                class="result-item channel-item"
                @click="goToChannel(channel)"
              >
                <el-card shadow="hover">
                  <div class="result-content">
                    <el-avatar :size="56" :src="channel.icon">
                      {{ channel.name?.charAt(0) }}
                    </el-avatar>
                    <div class="result-info">
                      <h3 class="item-title">{{ channel.name }}</h3>
                      <p class="item-desc text-ellipsis-2">{{ channel.description }}</p>
                      <div class="item-stats">
                        <span>{{ channel.followerCount }} 关注</span>
                        <span>{{ channel.contentCount }} 内容</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
            <el-empty v-else description="暂无相关频道" />
          </el-tab-pane>

          <el-tab-pane label="图书馆" name="libraries">
            <div v-if="results.libraries.length > 0" class="results-list">
              <div
                v-for="library in results.libraries"
                :key="library.id"
                class="result-item library-item"
                @click="goToLibrary(library)"
              >
                <el-card shadow="hover">
                  <div class="result-content">
                    <img :src="library.coverImage" :alt="library.name" class="library-cover" />
                    <div class="result-info">
                      <h3 class="item-title">{{ library.name }}</h3>
                      <p class="item-city">
                        <el-icon><Location /></el-icon>
                        {{ library.city }}
                      </p>
                      <p class="item-address text-ellipsis">{{ library.address }}</p>
                      <div class="item-stats">
                        <el-rate :model-value="library.rating" disabled size="small" />
                        <span class="rating-text">{{ library.rating }}</span>
                        <span>{{ library.bookCount }} 藏书</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
            <el-empty v-else description="暂无相关图书馆" />
          </el-tab-pane>
        </el-tabs>
      </div>

      <div v-else-if="hasSearched && !loading" class="empty-state">
        <el-empty description="未找到相关内容，请尝试其他关键词" />
      </div>

      <div v-else class="suggestions">
        <el-card>
          <h3 class="suggestion-title">热门搜索</h3>
          <div class="hot-tags">
            <el-tag
              v-for="tag in hotTags"
              :key="tag"
              class="hot-tag"
              effect="plain"
              @click="searchKeyword(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';
import {
  Search,
  Location
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const keyword = ref(route.query.q || '');
const loading = ref(false);
const hasSearched = ref(false);
const activeTab = ref('books');

const results = ref({
  books: [],
  channels: [],
  libraries: []
});

const hotTags = ref([
  '文学', '小说', '历史', '科技', '哲学', '艺术', '经济', '管理', '心理学', '教育'
]);

const hasResults = computed(() => {
  return results.value.books.length > 0 || 
         results.value.channels.length > 0 || 
         results.value.libraries.length > 0;
});

const performSearch = async () => {
  if (!keyword.value.trim()) return;

  loading.value = true;
  hasSearched.value = true;

  try {
    const res = await api.get('/square/search', {
      params: {
        keyword: keyword.value
      }
    });
    
    results.value.books = res.data.books || [];
    results.value.channels = res.data.channels || [];
    results.value.libraries = res.data.libraries || [];
  } catch (error) {
    console.error('Failed to search:', error);
  } finally {
    loading.value = false;
  }
};

const searchKeyword = (tag) => {
  keyword.value = tag;
  performSearch();
};

const goToBook = (book) => {
  router.push(`/books/${book.id}`);
};

const goToChannel = (channel) => {
  router.push(`/channels/${channel.id}`);
};

const goToLibrary = (library) => {
  router.push(`/libraries/${library.id}`);
};

onMounted(() => {
  if (keyword.value.trim()) {
    performSearch();
  }
});
</script>

<style scoped>
.search-page {
  padding-bottom: 40px;
}

.search-header {
  text-align: center;
  margin-bottom: 32px;
}

.search-header h1 {
  font-size: 28px;
  margin-bottom: 24px;
  color: #303133;
}

.search-results {
  margin-top: 24px;
}

.result-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 0;
}

.result-item {
  cursor: pointer;
}

.result-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.result-info {
  flex: 1;
}

.book-cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
}

.library-cover {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.item-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 8px;
}

.item-meta,
.item-city,
.item-address {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.item-city {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.rating-text {
  color: #f7ba2a;
  font-weight: 600;
}

.empty-state {
  margin-top: 48px;
}

.suggestions {
  margin-top: 32px;
}

.suggestion-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hot-tag {
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
}
</style>
