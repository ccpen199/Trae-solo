<template>
  <div class="search" v-if="!loading">
    <div class="search-header">
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索问题、文章、用户"
          clearable
          size="large"
          @keyup.enter="handleSearch"
          @clear="handleClear"
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div class="search-tabs" v-if="results.total > 0">
      <el-radio-group v-model="activeType" size="small">
        <el-radio-button label="all">全部 ({{ results.total }})</el-radio-button>
        <el-radio-button label="question">问题 ({{ results.questionsTotal || 0 }})</el-radio-button>
        <el-radio-button label="article">文章 ({{ results.articlesTotal || 0 }})</el-radio-button>
        <el-radio-button label="user">用户 ({{ results.usersTotal || 0 }})</el-radio-button>
      </el-radio-group>
    </div>

    <div class="search-results" v-if="!searching && !hasSearched">
      <el-empty description="输入关键词开始搜索" />
    </div>

    <div class="search-results" v-if="searching">
      <el-skeleton :count="5" animated />
    </div>

    <div class="search-results" v-if="!searching && hasSearched">
      <div class="results-section" v-if="activeType === 'all' || activeType === 'question'">
        <h3 class="section-title" v-if="activeType === 'all' && results.questions?.length > 0">
          问题
        </h3>
        <div class="result-item question-item" v-for="item in results.questions" :key="item.id" @click="goToQuestion(item.id)">
          <h4 class="item-title" v-html="highlight(item.title, keyword)"></h4>
          <div class="item-summary" v-if="item.summary">
            <span v-html="highlight(item.summary, keyword)"></span>
          </div>
          <div class="item-meta">
            <span>{{ item.author_username }}</span>
            <span>{{ item.answer_count || 0 }} 回答</span>
            <span>{{ item.view_count || 0 }} 浏览</span>
            <span>{{ formatTime(item.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="results-section" v-if="activeType === 'all' || activeType === 'article'">
        <h3 class="section-title" v-if="activeType === 'all' && results.articles?.length > 0">
          文章
        </h3>
        <div class="result-item article-item" v-for="item in results.articles" :key="item.id" @click="goToArticle(item.id)">
          <h4 class="item-title" v-html="highlight(item.title, keyword)"></h4>
          <div class="item-summary" v-if="item.summary">
            <span v-html="highlight(item.summary, keyword)"></span>
          </div>
          <div class="item-meta">
            <span>{{ item.author_username }}</span>
            <span>{{ item.view_count || 0 }} 阅读</span>
            <span>{{ item.like_count || 0 }} 点赞</span>
            <span>{{ formatTime(item.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="results-section" v-if="activeType === 'all' || activeType === 'user'">
        <h3 class="section-title" v-if="activeType === 'all' && results.users?.length > 0">
          用户
        </h3>
        <div class="result-item user-item" v-for="item in results.users" :key="item.id" @click="goToUser(item.id)">
          <el-avatar :size="48" :src="item.avatar">
            {{ (item.username || '').charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="user-info">
            <h4 class="item-title" v-html="highlight(item.username, keyword)"></h4>
            <div class="user-meta" v-if="item.bio || item.company">
              <span v-if="item.bio">{{ item.bio }}</span>
              <span v-if="item.bio && item.company">·</span>
              <span v-if="item.company">{{ item.company }}</span>
            </div>
            <div class="user-stats">
              <span>{{ item.question_count || 0 }} 提问</span>
              <span>{{ item.answer_count || 0 }} 回答</span>
              <span>{{ item.article_count || 0 }} 文章</span>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="results.total === 0" description="未找到相关内容" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { searchApi } from '@/api';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const keyword = ref('');
const activeType = ref('all');
const searching = ref(false);
const hasSearched = ref(false);

const results = reactive({
  total: 0,
  questions: [],
  articles: [],
  users: [],
  questionsTotal: 0,
  articlesTotal: 0,
  usersTotal: 0
});

const handleSearch = async () => {
  if (!keyword.value.trim()) {
    return;
  }
  
  searching.value = true;
  hasSearched.value = true;
  
  try {
    const response = await searchApi.search({
      q: keyword.value.trim(),
      type: activeType.value === 'all' ? undefined : activeType.value
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      results.questions = data.questions || [];
      results.articles = data.articles || [];
      results.users = data.users || [];
      results.questionsTotal = data.questionsTotal || 0;
      results.articlesTotal = data.articlesTotal || 0;
      results.usersTotal = data.usersTotal || 0;
      results.total = results.questionsTotal + results.articlesTotal + results.usersTotal;
    }
  } catch (err) {
    console.error('Search error:', err);
  } finally {
    searching.value = false;
  }
};

const handleClear = () => {
  keyword.value = '';
  hasSearched.value = false;
  results.total = 0;
  results.questions = [];
  results.articles = [];
  results.users = [];
};

const highlight = (text, keyword) => {
  if (!text || !keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<span style="color: #409eff; font-weight: 500;">$1</span>');
};

const goToQuestion = (id) => {
  router.push(`/questions/${id}`);
};

const goToArticle = (id) => {
  router.push(`/articles/${id}`);
};

const goToUser = (id) => {
  router.push(`/user/${id}`);
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000) return '今天';
  if (diff < 172800000) return '昨天';
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return date.toLocaleDateString();
};

onMounted(() => {
  const queryKeyword = route.query.q;
  if (queryKeyword) {
    keyword.value = queryKeyword;
    handleSearch();
  }
  loading.value = false;
});
</script>

<style scoped>
.search {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.search-header {
  margin-bottom: 24px;
}

.search-bar {
  max-width: 600px;
  margin: 0 auto;
}

.search-tabs {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-results {
  min-height: 400px;
}

.results-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  color: #909399;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.result-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.result-item:hover {
  background: #f9f9f9;
}

.result-item:last-child {
  border-bottom: none;
}

.user-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.user-info {
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #303133;
}

.result-item:hover .item-title {
  color: #409eff;
}

.item-summary {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.6;
}

.item-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 13px;
}

.user-meta {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.user-stats {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 13px;
}
</style>
