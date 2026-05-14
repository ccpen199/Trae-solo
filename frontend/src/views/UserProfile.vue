<template>
  <div class="user-profile" v-if="!loading && !error">
    <div class="profile-header" v-if="user?.id">
      <div class="profile-info">
        <el-avatar :size="80" :src="user.avatar">
          {{ (user.username || '').charAt(0).toUpperCase() }}
        </el-avatar>
        <div class="user-info">
          <h2 class="username">{{ user.username }}</h2>
          <p class="bio" v-if="user.bio">{{ user.bio }}</p>
          <div class="user-meta">
            <span v-if="user.company">{{ user.company }}</span>
            <span v-if="user.company && user.title">·</span>
            <span v-if="user.title">{{ user.title }}</span>
          </div>
        </div>
      </div>
      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">{{ stats.questions || 0 }}</span>
          <span class="stat-label">提问</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.answers || 0 }}</span>
          <span class="stat-label">回答</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.articles || 0 }}</span>
          <span class="stat-label">文章</span>
        </div>
        <div class="stat-item" @click="showFollowers = true" style="cursor: pointer">
          <span class="stat-value">{{ stats.followers || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-item" @click="showFollowing = true" style="cursor: pointer">
          <span class="stat-value">{{ stats.following || 0 }}</span>
          <span class="stat-label">关注</span>
        </div>
      </div>
      <div class="profile-actions" v-if="userStore.isLoggedIn && userStore.user?.id !== user.id">
        <el-button 
          :type="isFollowing ? 'default' : 'primary'" 
          @click="handleFollow"
          :loading="submitting"
        >
          {{ isFollowing ? '取消关注' : '关注' }}
        </el-button>
      </div>
    </div>

    <div class="profile-content">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="提问" name="questions">
          <div class="content-list">
            <div class="content-item" v-for="item in questions" :key="item.id" @click="goToQuestion(item.id)">
              <h3 class="item-title">{{ item.title }}</h3>
              <div class="item-meta">
                <span>{{ item.answer_count || 0 }} 回答</span>
                <span>{{ item.view_count || 0 }} 浏览</span>
                <span>{{ formatTime(item.created_at) }}</span>
              </div>
            </div>
            <el-empty v-if="questions.length === 0" description="暂无提问" />
            <div class="load-more" v-if="hasMoreQuestions">
              <el-button @click="loadMoreQuestions" :loading="loadingQuestions">加载更多</el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="回答" name="answers">
          <div class="content-list">
            <div class="content-item" v-for="item in answers" :key="item.id">
              <div class="answer-question" @click="goToQuestion(item.question_id)">
                <h3 class="item-title">{{ item.question_title || '问题' }}</h3>
              </div>
              <div class="answer-preview" v-html="item.content"></div>
              <div class="item-meta">
                <span>{{ item.like_count || 0 }} 赞同</span>
                <span>{{ formatTime(item.created_at) }}</span>
              </div>
            </div>
            <el-empty v-if="answers.length === 0" description="暂无回答" />
            <div class="load-more" v-if="hasMoreAnswers">
              <el-button @click="loadMoreAnswers" :loading="loadingAnswers">加载更多</el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="文章" name="articles">
          <div class="content-list">
            <div class="content-item" v-for="item in articles" :key="item.id" @click="goToArticle(item.id)">
              <h3 class="item-title">{{ item.title }}</h3>
              <div class="item-summary" v-if="item.summary">{{ item.summary }}</div>
              <div class="item-meta">
                <span>{{ item.view_count || 0 }} 阅读</span>
                <span>{{ item.like_count || 0 }} 点赞</span>
                <span>{{ formatTime(item.created_at) }}</span>
              </div>
            </div>
            <el-empty v-if="articles.length === 0" description="暂无文章" />
            <div class="load-more" v-if="hasMoreArticles">
              <el-button @click="loadMoreArticles" :loading="loadingArticles">加载更多</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showFollowers" title="粉丝" width="500px">
      <div class="follow-list">
        <div class="follow-item" v-for="item in followers" :key="item.id" @click="goToUser(item.id)">
          <el-avatar :size="40" :src="item.avatar">
            {{ (item.username || '').charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="follow-name">{{ item.username }}</span>
        </div>
        <el-empty v-if="followers.length === 0" description="暂无粉丝" />
      </div>
    </el-dialog>

    <el-dialog v-model="showFollowing" title="关注" width="500px">
      <div class="follow-list">
        <div class="follow-item" v-for="item in following" :key="item.id" @click="goToUser(item.id)">
          <el-avatar :size="40" :src="item.avatar">
            {{ (item.username || '').charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="follow-name">{{ item.username }}</span>
        </div>
        <el-empty v-if="following.length === 0" description="暂无关注" />
      </div>
    </el-dialog>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { userApi, followApi, activityApi } from '@/api';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const user = ref(null);
const isFollowing = ref(false);
const stats = ref({ questions: 0, answers: 0, articles: 0, followers: 0, following: 0 });
const activeTab = ref('questions');
const submitting = ref(false);

const questions = ref([]);
const questionPage = ref(1);
const hasMoreQuestions = ref(false);
const loadingQuestions = ref(false);

const answers = ref([]);
const answerPage = ref(1);
const hasMoreAnswers = ref(false);
const loadingAnswers = ref(false);

const articles = ref([]);
const articlePage = ref(1);
const hasMoreArticles = ref(false);
const loadingArticles = ref(false);

const showFollowers = ref(false);
const showFollowing = ref(false);
const followers = ref([]);
const following = ref([]);

const userId = computed(() => parseInt(route.params.id));

const loadUser = async () => {
  loading.value = true;
  error.value = false;
  try {
    const response = await userApi.getUser(userId.value);
    if (response.data?.success) {
      user.value = response.data.data || null;
      stats.value = response.data.data?.stats || stats.value;
      isFollowing.value = response.data.data?.is_following || false;
      if (user.value) {
        loadQuestions();
      }
    } else {
      error.value = true;
      errorMessage.value = response.data?.message || '加载失败';
    }
  } catch (err) {
    error.value = true;
    errorMessage.value = err.response?.data?.message || '网络错误，请重试';
  } finally {
    loading.value = false;
  }
};

const loadQuestions = async () => {
  questionPage.value = 1;
  questions.value = [];
  await fetchQuestions();
};

const fetchQuestions = async () => {
  loadingQuestions.value = true;
  try {
    const response = await activityApi.getMyQuestions({
      user_id: userId.value,
      page: questionPage.value,
      page_size: 10
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      if (questionPage.value === 1) {
        questions.value = data.items || [];
      } else {
        questions.value = [...questions.value, ...(data.items || [])];
      }
      hasMoreQuestions.value = (questionPage.value * 10) < (data.total || 0);
    }
  } catch (err) {
    console.error('Load questions error:', err);
  } finally {
    loadingQuestions.value = false;
  }
};

const loadMoreQuestions = () => {
  questionPage.value++;
  fetchQuestions();
};

const loadAnswers = async () => {
  answerPage.value = 1;
  answers.value = [];
  await fetchAnswers();
};

const fetchAnswers = async () => {
  loadingAnswers.value = true;
  try {
    const response = await activityApi.getMyAnswers({
      user_id: userId.value,
      page: answerPage.value,
      page_size: 10
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      if (answerPage.value === 1) {
        answers.value = data.items || [];
      } else {
        answers.value = [...answers.value, ...(data.items || [])];
      }
      hasMoreAnswers.value = (answerPage.value * 10) < (data.total || 0);
    }
  } catch (err) {
    console.error('Load answers error:', err);
  } finally {
    loadingAnswers.value = false;
  }
};

const loadMoreAnswers = () => {
  answerPage.value++;
  fetchAnswers();
};

const loadArticles = async () => {
  articlePage.value = 1;
  articles.value = [];
  await fetchArticles();
};

const fetchArticles = async () => {
  loadingArticles.value = true;
  try {
    const response = await activityApi.getMyArticles({
      user_id: userId.value,
      page: articlePage.value,
      page_size: 10
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      if (articlePage.value === 1) {
        articles.value = data.items || [];
      } else {
        articles.value = [...articles.value, ...(data.items || [])];
      }
      hasMoreArticles.value = (articlePage.value * 10) < (data.total || 0);
    }
  } catch (err) {
    console.error('Load articles error:', err);
  } finally {
    loadingArticles.value = false;
  }
};

const loadMoreArticles = () => {
  articlePage.value++;
  fetchArticles();
};

const loadFollowers = async () => {
  try {
    const response = await followApi.getFollowers(userId.value, { page_size: 50 });
    if (response.data?.success) {
      followers.value = response.data.data?.items || [];
    }
  } catch (err) {
    console.error('Load followers error:', err);
  }
};

const loadFollowing = async () => {
  try {
    const response = await followApi.getFollowing(userId.value, { page_size: 50 });
    if (response.data?.success) {
      following.value = response.data.data?.items || [];
    }
  } catch (err) {
    console.error('Load following error:', err);
  }
};

const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  submitting.value = true;
  try {
    const response = await followApi.toggle(userId.value);
    if (response.data?.success) {
      isFollowing.value = !isFollowing.value;
      stats.value.followers += isFollowing.value ? 1 : -1;
    }
  } catch (err) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

watch(showFollowers, (val) => {
  if (val) loadFollowers();
});

watch(showFollowing, (val) => {
  if (val) loadFollowing();
});

watch(activeTab, (val) => {
  if (val === 'answers' && answers.value.length === 0) loadAnswers();
  if (val === 'articles' && articles.value.length === 0) loadArticles();
});

const goToQuestion = (id) => {
  router.push(`/questions/${id}`);
};

const goToArticle = (id) => {
  router.push(`/articles/${id}`);
};

const goToUser = (id) => {
  showFollowers.value = false;
  showFollowing.value = false;
  router.push(`/user/${id}`);
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return date.toLocaleDateString();
};

const retry = () => {
  loadUser();
};

watch(() => route.params.id, () => {
  loadUser();
});

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.user-profile {
  max-width: 800px;
  margin: 0 auto;
}

.profile-header {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.profile-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.bio {
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.user-meta {
  color: #909399;
  font-size: 13px;
}

.profile-stats {
  display: flex;
  gap: 32px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.profile-actions {
  margin-top: 16px;
}

.profile-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.profile-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px 0;
}

.content-list {
  min-height: 200px;
}

.content-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.content-item:hover .item-title {
  color: #409eff;
}

.content-item:last-child {
  border-bottom: none;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #303133;
  transition: color 0.2s;
}

.item-summary {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.6;
}

.item-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 13px;
}

.answer-question {
  margin-bottom: 8px;
}

.answer-question:hover .item-title {
  color: #409eff;
}

.answer-preview {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  max-height: 60px;
  overflow: hidden;
  line-height: 1.6;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.follow-list {
  max-height: 400px;
  overflow-y: auto;
}

.follow-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.follow-item:last-child {
  border-bottom: none;
}

.follow-item:hover .follow-name {
  color: #409eff;
}

.follow-name {
  font-weight: 500;
  transition: color 0.2s;
}

.loading-container, .error-container {
  padding: 40px;
  text-align: center;
}
</style>
