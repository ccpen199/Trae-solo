<template>
  <div class="article-detail" v-if="!loading && !error">
    <div class="article-header" v-if="article?.id">
      <div class="article-meta">
        <el-tag 
          v-for="tag in (article.tags || []).slice(0, 3)" 
          :key="tag" 
          size="small"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
        <span class="view-count">{{ article.views || 0 }} 阅读</span>
      </div>
      <h1 class="article-title">{{ article.title }}</h1>
      <div class="article-author" @click="goToUser(article.user_id)">
        <el-avatar :size="40" :src="article.author_avatar">
          {{ (article.author_name || '').charAt(0).toUpperCase() }}
        </el-avatar>
        <div class="author-info">
          <span class="author-name">{{ article.author_name || '匿名用户' }}</span>
          <span class="article-time">{{ formatTime(article.created_at) }}</span>
        </div>
      </div>
      <div class="article-content" v-html="article.content"></div>
      <div class="article-actions">
        <el-button 
          :type="article.isLiked ? 'primary' : 'default'" 
          @click="handleLike"
          :disabled="submitting"
        >
          <el-icon><thumb-up /></el-icon>
          点赞 {{ article.likes_count || 0 }}
        </el-button>
        <el-button 
          :type="article.isFavorited ? 'primary' : 'default'" 
          @click="handleFavorite"
          :disabled="submitting"
        >
          <el-icon><star /></el-icon>
          收藏
        </el-button>
        <el-button @click="showReportDialog = true">
          <el-icon><warning /></el-icon>
          举报
        </el-button>
      </div>
    </div>

    <div class="comments-section">
      <div class="section-header">
        <h2>{{ commentCount }} 条评论</h2>
      </div>

      <div class="comment-form" v-if="userStore.isLoggedIn">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
        />
        <div class="form-actions">
          <el-button 
            type="primary" 
            @click="submitComment"
            :loading="submittingComment"
          >
            发表评论
          </el-button>
        </div>
      </div>
      <div class="comment-form" v-else>
        <el-text type="info">
          <router-link to="/login">登录</router-link> 后可以发表评论
        </el-text>
      </div>

      <div class="comments-list">
        <div class="comment-item" v-for="comment in comments" :key="comment.id">
          <div class="comment-header">
            <el-avatar :size="32" :src="comment.author_avatar" @click="goToUser(comment.user_id)">
              {{ (comment.author_name || '').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="comment-meta">
              <span class="author-name" @click="goToUser(comment.user_id)">{{ comment.author_name || '匿名用户' }}</span>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            </div>
          </div>
          <div class="comment-body">{{ comment.content }}</div>
          <div class="comment-actions">
            <el-button 
              type="text" 
              @click="handleCommentLike(comment)"
            >
              <el-icon><thumb-up /></el-icon>
              {{ comment.likes_count || 0 }}
            </el-button>
          </div>
        </div>
        
        <el-empty v-if="comments.length === 0" description="暂无评论，快来发表第一条评论吧" />
        
        <div class="load-more" v-if="hasMoreComments">
          <el-button @click="loadMoreComments" :loading="loadingComments">加载更多</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showReportDialog" title="举报" width="400px">
      <el-radio-group v-model="reportReason">
        <el-radio label="spam">垃圾广告</el-radio>
        <el-radio label="inappropriate">内容不当</el-radio>
        <el-radio label="violent">暴力色情</el-radio>
        <el-radio label="other">其他</el-radio>
      </el-radio-group>
      <el-input
        v-model="reportDescription"
        type="textarea"
        :rows="2"
        placeholder="补充说明（可选）"
        style="margin-top: 16px"
      />
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReport" :loading="submitting">提交</el-button>
      </template>
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
import { ThumbUp, Star, Warning } from '@element-plus/icons-vue';
import { articleApi, commentApi } from '@/api';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const article = ref(null);
const comments = ref([]);
const commentCount = ref(0);
const commentPage = ref(1);
const hasMoreComments = ref(false);
const loadingComments = ref(false);
const commentContent = ref('');
const submittingComment = ref(false);
const submitting = ref(false);
const showReportDialog = ref(false);
const reportReason = ref('spam');
const reportDescription = ref('');

const articleId = computed(() => parseInt(route.params.id));

const loadArticle = async () => {
  loading.value = true;
  error.value = false;
  try {
    const response = await articleApi.getDetail(articleId.value);
    if (response.data?.success) {
      article.value = response.data.data || null;
      if (article.value) {
        loadComments();
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

const loadComments = async () => {
  commentPage.value = 1;
  comments.value = [];
  await fetchComments();
};

const fetchComments = async () => {
  loadingComments.value = true;
  try {
    const response = await commentApi.getList({
      targetType: 'article',
      targetId: articleId.value,
      page: commentPage.value,
      pageSize: 20
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      if (commentPage.value === 1) {
        comments.value = data.list || [];
      } else {
        comments.value = [...comments.value, ...(data.list || [])];
      }
      commentCount.value = data.total || 0;
      hasMoreComments.value = (commentPage.value * 20) < commentCount.value;
    }
  } catch (err) {
    ElMessage.error('加载评论失败');
  } finally {
    loadingComments.value = false;
  }
};

const loadMoreComments = () => {
  commentPage.value++;
  fetchComments();
};

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  submittingComment.value = true;
  try {
    const response = await commentApi.create({
      target_type: 'article',
      target_id: articleId.value,
      content: commentContent.value
    });
    if (response.data?.success) {
      ElMessage.success('评论发表成功');
      commentContent.value = '';
      loadComments();
    } else {
      ElMessage.error(response.data?.message || '发表失败');
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '发表失败');
  } finally {
    submittingComment.value = false;
  }
};

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  submitting.value = true;
  try {
    const response = await articleApi.like(articleId.value);
    if (response.data?.success) {
      article.value.is_liked = !article.value.is_liked;
      article.value.like_count += article.value.is_liked ? 1 : -1;
    }
  } catch (err) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  submitting.value = true;
  try {
    const response = await articleApi.favorite(articleId.value);
    if (response.data?.success) {
      article.value.is_favorited = !article.value.is_favorited;
      ElMessage.success(article.value.is_favorited ? '已收藏' : '已取消收藏');
    }
  } catch (err) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleCommentLike = async (comment) => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  try {
    const response = await commentApi.like(comment.id);
    if (response.data?.success) {
      comment.is_liked = !comment.is_liked;
      comment.like_count += comment.is_liked ? 1 : -1;
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

const submitReport = async () => {
  try {
    const response = await articleApi.report(articleId.value, {
      reason: reportReason.value,
      description: reportDescription.value
    });
    if (response.data?.success) {
      ElMessage.success('举报已提交');
      showReportDialog.value = false;
      reportReason.value = 'spam';
      reportDescription.value = '';
    }
  } catch (err) {
    ElMessage.error('举报失败');
  }
};

const goToUser = (userId) => {
  router.push(`/user/${userId}`);
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
  loadArticle();
};

watch(() => route.params.id, () => {
  loadArticle();
});

onMounted(() => {
  loadArticle();
});
</script>

<style scoped>
.article-detail {
  max-width: 800px;
  margin: 0 auto;
}

.article-header {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.view-count {
  color: #909399;
  font-size: 13px;
}

.article-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  line-height: 1.5;
}

.article-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  cursor: pointer;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-weight: 500;
  color: #303133;
}

.article-time {
  color: #909399;
  font-size: 13px;
}

.article-content {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 24px;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.article-content :deep(p) {
  margin-bottom: 16px;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 24px;
  margin-bottom: 16px;
}

.article-content :deep(li) {
  margin-bottom: 8px;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 16px 0;
  color: #606266;
  background: #f5f7fa;
  padding: 16px;
}

.article-content :deep(code) {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.article-content :deep(pre) {
  background: #282c34;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.article-content :deep(pre code) {
  background: none;
  color: #abb2bf;
}

.article-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.comments-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.section-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h2 {
  font-size: 18px;
  margin: 0;
}

.comment-form {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.form-actions {
  margin-top: 12px;
  text-align: right;
}

.comments-list {
  margin-top: 20px;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-time {
  color: #909399;
  font-size: 13px;
}

.comment-body {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.loading-container, .error-container {
  padding: 40px;
  text-align: center;
}
</style>
