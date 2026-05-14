<template>
  <div class="page-container">
    <div class="home-layout">
      <div class="main-content">
        <div class="card">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h2 style="margin: 0;">推荐内容</h2>
            <el-radio-group v-model="activeTab" size="small">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="question">提问</el-radio-button>
              <el-radio-button value="article">文章</el-radio-button>
            </el-radio-group>
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
            <el-empty description="暂无内容" />
          </div>

          <div v-else class="content-list">
            <div
              v-for="item in list"
              :key="`${item.result_type || (item.question_title ? 'question' : 'article')}-${item.id}`"
              class="list-item pointer"
              @click="goToDetail(item)"
            >
              <div class="item-header">
                <el-tag
                  v-if="item.result_type === 'question' || item.question_title"
                  type="warning"
                  size="small"
                >
                  提问
                </el-tag>
                <el-tag v-else type="success" size="small">
                  文章
                </el-tag>
                <span class="text-muted" style="margin-left: 8px;">
                  {{ item.category_name || '未分类' }}
                </span>
              </div>
              <h3 class="item-title ellipsis-1">{{ item.title }}</h3>
              <p class="item-excerpt ellipsis-2" v-if="item.summary || item.content">
                {{ item.summary || item.content }}
              </p>
              <div class="item-meta">
                <div class="flex-center flex-gap-12">
                  <el-avatar :size="24" :src="item.author_avatar">
                    {{ item.author_name && item.author_name[0] }}
                  </el-avatar>
                  <span class="text-muted">{{ item.author_name }}</span>
                </div>
                <div class="flex-center flex-gap-12 text-muted">
                  <span><el-icon><View /></el-icon> {{ item.views || 0 }}</span>
                  <span v-if="item.answers_count !== undefined">
                    <el-icon><ChatDotRound /></el-icon> {{ item.answers_count || 0 }}
                  </span>
                  <span v-else>
                    <el-icon><ChatDotRound /></el-icon> {{ item.comments_count || 0 }}
                  </span>
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
        <div class="card sidebar-card" v-if="!userStore.isLoggedIn">
          <h3 class="sidebar-title">加入社区</h3>
          <p class="sidebar-desc">
            与产品、市场、运营人群一起学习交流，获取行业资讯。
          </p>
          <div style="margin-top: 16px;">
            <el-button type="primary" style="width: 100%;" @click="router.push('/register')">
              立即注册
            </el-button>
            <el-button style="width: 100%; margin-top: 8px;" @click="router.push('/login')">
              登录账号
            </el-button>
          </div>
        </div>

        <div class="card sidebar-card" v-else>
          <div class="flex-center flex-gap-12">
            <el-avatar :size="56" :src="userStore.user?.avatar">
              {{ (userStore.user?.nickname || userStore.user?.username)?.[0] }}
            </el-avatar>
            <div>
              <div class="username">{{ userStore.user?.nickname || userStore.user?.username }}</div>
              <div class="text-muted" style="font-size: 12px;">
                @{{ userStore.user?.username }}
              </div>
            </div>
          </div>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-value">{{ userStore.user?.following || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ userStore.user?.followers || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ userStore.user?.favorites || 0 }}</span>
              <span class="stat-label">收藏</span>
            </div>
          </div>
        </div>

        <div class="card sidebar-card">
          <div class="flex-between" style="margin-bottom: 12px;">
            <h3 class="sidebar-title" style="margin: 0;">分类</h3>
          </div>
          <el-skeleton v-if="categoriesLoading" :rows="3" animated />
          <div v-else class="category-list">
            <div
              v-for="cat in categories"
              :key="cat.id"
              class="category-item pointer"
              @click="filterByCategory(cat.id)"
            >
              <span>{{ cat.name }}</span>
              <span class="text-muted">{{ cat.question_count + cat.article_count }}</span>
            </div>
          </div>
        </div>

        <div class="card sidebar-card">
          <h3 class="sidebar-title">快捷操作</h3>
          <div class="quick-actions">
            <el-button type="primary" style="width: 100%;" @click="router.push('/questions/new')">
              <el-icon><Edit /></el-icon>
              发起提问
            </el-button>
            <el-button style="width: 100%; margin-top: 8px;" @click="router.push('/articles/new')">
              <el-icon><Document /></el-icon>
              发布文章
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { View, ChatDotRound, Star, Edit, Document } from '@element-plus/icons-vue';
import { questionApi, articleApi, categoryApi } from '@/api';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('all');
const activeSort = ref('new');
const loading = ref(true);
const loadingMore = ref(false);
const error = ref(false);
const list = ref([]);
const page = ref(1);
const total = ref(0);
const pageSize = 20;

const categories = ref([]);
const categoriesLoading = ref(true);

const fetchCategories = async () => {
  try {
    categoriesLoading.value = true;
    const res = await categoryApi.getList();
    categories.value = res.data?.list || [];
  } catch (error) {
    console.error('Fetch categories error:', error);
  } finally {
    categoriesLoading.value = false;
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

    let res;
    const params = {
      page: page.value,
      pageSize,
      sort: activeSort.value
    };

    if (activeTab.value === 'all' || activeTab.value === 'question') {
      res = await questionApi.getList(params);
    } else {
      res = await articleApi.getList(params);
    }

    if (activeTab.value === 'all') {
      const articleRes = await articleApi.getList(params);
      const questions = (res.data?.list || []).map((q) => ({ ...q, result_type: 'question' }));
      const articles = (articleRes.data?.list || []).map((a) => ({ ...a, result_type: 'article' }));
      
      const merged = [...questions, ...articles].sort((a, b) => {
        if (activeSort.value === 'new') {
          return (b.created_at || 0) - (a.created_at || 0);
        }
        return (b.views || 0) - (a.views || 0);
      }).slice(0, pageSize);

      list.value = reset ? merged : [...list.value, ...merged];
      total.value = (res.data?.total || 0) + (articleRes.data?.total || 0);
    } else {
      list.value = reset ? (res.data?.list || []) : [...list.value, ...(res.data?.list || [])];
      total.value = res.data?.total || 0;
    }
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

const goToDetail = (item) => {
  const type = item.result_type || (item.question_title ? 'question' : 'article');
  if (type === 'question') {
    router.push(`/questions/${item.id}`);
  } else {
    router.push(`/articles/${item.id}`);
  }
};

const filterByCategory = (categoryId) => {
  router.push({
    path: activeTab.value === 'article' ? '/articles' : '/questions',
    query: { categoryId }
  });
};

watch([activeTab, activeSort], () => {
  fetchData(true);
});

onMounted(() => {
  fetchData();
  fetchCategories();
  if (userStore.isLoggedIn) {
    userStore.fetchUserInfo();
  }
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

.sidebar-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.username {
  font-weight: 600;
  color: #303133;
}

.user-stats {
  display: flex;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.category-item:hover {
  background: #f5f7fa;
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
