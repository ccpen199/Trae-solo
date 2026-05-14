<template>
  <div class="page-container">
    <div class="home-layout">
      <div class="main-content">
        <div class="card">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h2 style="margin: 0;">
              提问
              <el-tag v-if="currentCategory" type="info" size="small" class="ml-2">
                {{ currentCategory?.name }}
              </el-tag>
            </h2>
            <el-button type="primary" @click="router.push('/questions/new')" v-if="userStore.isLoggedIn">
              <el-icon><Edit /></el-icon>
              发起提问
            </el-button>
          </div>

          <div class="filters mb-20">
            <el-select
              v-model="selectedCategory"
              placeholder="选择分类"
              clearable
              size="small"
              style="width: 180px;"
              @change="onCategoryChange"
            >
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.name"
                :value="String(cat.id)"
              />
            </el-select>
          </div>

          <el-tabs v-model="activeSort" class="content-tabs">
            <el-tab-pane label="最新" name="new" />
            <el-tab-pane label="热门" name="hot" />
            <el-tab-pane label="精选" name="recommended" />
          </el-tabs>

          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>

          <div v-else-if="error" class="error-container">
            <el-empty description="加载失败">
              <el-button type="primary" @click="fetchData">重试</el-button>
            </el-empty>
          </div>

          <div v-else-if="list.length === 0" class="empty-container">
            <el-empty description="暂无提问" />
          </div>

          <div v-else class="content-list">
            <div
              v-for="item in list"
              :key="item.id"
              class="list-item pointer"
              @click="router.push(`/questions/${item.id}`)"
            >
              <div class="item-header">
                <el-tag type="warning" size="small">提问</el-tag>
                <span class="text-muted" style="margin-left: 8px;">
                  {{ item.category_name || '未分类' }}
                </span>
                <span
                  v-if="item.tags?.length"
                  class="ml-8"
                >
                  <span
                    v-for="tag in item.tags.slice(0, 3)"
                    :key="tag"
                    class="tag-item"
                  >{{ tag }}</span>
                </span>
              </div>
              <h3 class="item-title ellipsis-1">{{ item.title }}</h3>
              <p class="item-excerpt ellipsis-2" v-if="item.content">
                {{ item.content }}
              </p>
              <div class="item-meta">
                <div class="flex-center flex-gap-12">
                  <el-avatar :size="24" :src="item.author_avatar">
                    {{ item.author_name?.[0] }}
                  </el-avatar>
                  <span class="text-muted">{{ item.author_name }}</span>
                  <span class="text-muted">{{ formatTime(item.created_at) }}</span>
                </div>
                <div class="flex-center flex-gap-12 text-muted">
                  <span><el-icon><View /></el-icon> {{ item.views || 0 }}</span>
                  <span><el-icon><ChatDotRound /></el-icon> {{ item.answers_count || 0 }}</span>
                  <span><el-icon><Star /></el-icon> {{ item.likes_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="total > list.length" style="text-align: center; margin-top: 20px;">
            <el-button :loading="loadingMore" @click="loadMore">
              加载更多
            </el-button>
          </div>
        </div>
      </div>

      <div class="sidebar">
        <div class="card sidebar-card">
          <h3 class="sidebar-title">快捷操作</h3>
          <div class="quick-actions">
            <el-button type="primary" style="width: 100%;" @click="router.push('/questions/new')">
              <el-icon><Edit /></el-icon>
              发起提问
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { View, ChatDotRound, Star, Edit } from '@element-plus/icons-vue';
import { questionApi, categoryApi } from '@/api';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const activeSort = ref('new');
const selectedCategory = ref('');
const loading = ref(true);
const loadingMore = ref(false);
const error = ref(false);
const list = ref([]);
const page = ref(1);
const total = ref(0);
const pageSize = 20;

const categories = ref([]);

const currentCategory = computed(() => {
  if (!selectedCategory.value) return null;
  return categories.value.find(c => String(c.id) === selectedCategory.value);
});

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString();
};

const fetchCategories = async () => {
  try {
    const res = await categoryApi.getList();
    categories.value = res.data?.list || [];
  } catch (error) {
    console.error('Fetch categories error:', error);
  }
};

const fetchData = async (reset = true) => {
  if (reset) {
    page.value = 1;
    list.value = [];
  }
  
  try {
    if (reset) {
      loading.value = true;
    } else {
      loadingMore.value = true;
    }
    error.value = false;

    const params = {
      page: page.value,
      pageSize,
      sort: activeSort.value
    };

    if (selectedCategory.value) {
      params.categoryId = selectedCategory.value;
    }

    const res = await questionApi.getList(params);
    list.value = reset ? (res.data?.list || []) : [...list.value, ...(res.data?.list || [])];
    total.value = res.data?.total || 0;
  } catch (err) {
    error.value = true;
    console.error('Fetch data error:', err);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const loadMore = () => {
  page.value++;
  fetchData(false);
};

const onCategoryChange = () => {
  router.push({ query: { ...route.query, categoryId: selectedCategory.value || undefined } });
};

watch(activeSort, () => {
  fetchData(true);
});

watch(() => route.query.categoryId, (val) => {
  selectedCategory.value = val ? String(val) : '';
  fetchData(true);
}, { immediate: true });

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.home-layout {
  display: flex;
  gap: 24px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
}

.ml-2 {
  margin-left: 8px;
}

.ml-8 {
  margin-left: 8px;
}

.filters {
  display: flex;
  gap: 12px;
}

.content-tabs {
  margin-bottom: 16px;
}

.content-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.content-list {
  margin-top: -8px;
}

.item-header {
  margin-bottom: 8px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.item-title:hover {
  color: #409eff;
}

.item-excerpt {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.sidebar-card {
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .home-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
}
</style>
