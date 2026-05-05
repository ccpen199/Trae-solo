<template>
  <div class="book-detail-page page-container" v-loading="loading">
    <div v-if="book" class="container">
      <div class="book-header">
        <el-row :gutter="24">
          <el-col :span="8">
            <img :src="book.coverImage" :alt="book.title" class="book-cover" />
          </el-col>
          <el-col :span="16">
            <div class="book-info">
              <h1 class="book-title">{{ book.title }}</h1>
              <p class="book-author">
                <span class="label">作者：</span>
                {{ book.author }}
              </p>
              <p class="book-publisher" v-if="book.publisher">
                <span class="label">出版社：</span>
                {{ book.publisher }}
              </p>
              <p class="book-isbn" v-if="book.isbn">
                <span class="label">ISBN：</span>
                {{ book.isbn }}
              </p>
              <p class="book-category">
                <span class="label">分类：</span>
                <el-tag size="small">{{ book.category || '综合' }}</el-tag>
              </p>
              <div class="book-rating">
                <el-rate :model-value="book.rating" disabled />
                <span class="rating-score">{{ book.rating }}</span>
                <span class="rating-count">({{ book.commentCount }} 人评价)</span>
              </div>
              <div class="book-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ book.favoriteCount }}</span>
                  <span class="stat-label">收藏</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ book.readingCount }}</span>
                  <span class="stat-label">在读</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ book.commentCount }}</span>
                  <span class="stat-label">评论</span>
                </div>
              </div>
              <div class="book-actions">
                <el-button
                  :type="isFavorited ? 'default' : 'primary'"
                  @click="toggleFavorite"
                >
                  <el-icon><Star /></el-icon>
                  {{ isFavorited ? '已收藏' : '加入收藏' }}
                </el-button>
                <el-button>
                  <el-icon><Share /></el-icon>
                  分享
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-card class="book-description">
        <template #header>
          <h3>内容简介</h3>
        </template>
        <p class="description-text">{{ book.description || '暂无简介' }}</p>
      </el-card>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="相关频道" name="channels">
          <div class="related-channels">
            <div
              v-for="channel in bookChannels"
              :key="channel.id"
              class="channel-item"
              @click="goToChannel(channel)"
            >
              <el-card shadow="hover">
                <div class="channel-header">
                  <el-avatar :size="48" :src="channel.icon">
                    {{ channel.name?.charAt(0) }}
                  </el-avatar>
                  <div class="channel-info">
                    <h3 class="channel-name">{{ channel.name }}</h3>
                    <p class="channel-desc text-ellipsis">{{ channel.description }}</p>
                    <p class="channel-stats">
                      {{ channel.followerCount }} 关注 · {{ channel.contentCount }} 内容
                    </p>
                  </div>
                </div>
              </el-card>
            </div>
            <el-empty v-if="bookChannels.length === 0" description="暂无相关频道" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="相关图书馆" name="libraries">
          <div class="related-libraries">
            <div
              v-for="library in bookLibraries"
              :key="library.id"
              class="library-item"
              @click="goToLibrary(library)"
            >
              <el-card shadow="hover">
                <div class="library-header">
                  <img :src="library.coverImage" :alt="library.name" class="library-cover" />
                  <div class="library-info">
                    <h3 class="library-name">{{ library.name }}</h3>
                    <p class="library-city">
                      <el-icon><Location /></el-icon>
                      {{ library.city }}
                    </p>
                    <p class="library-address text-ellipsis">{{ library.address }}</p>
                  </div>
                </div>
              </el-card>
            </div>
            <el-empty v-if="bookLibraries.length === 0" description="暂无相关图书馆" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="书籍评论" name="comments">
          <div class="comments-section">
            <el-card class="comment-input-card">
              <h4>发表我的书评</h4>
              <el-form :model="commentForm" label-width="80px">
                <el-form-item label="评分">
                  <el-rate v-model="commentForm.rating" :max="5" />
                </el-form-item>
                <el-form-item label="评论">
                  <el-input
                    v-model="commentForm.content"
                    type="textarea"
                    :rows="4"
                    placeholder="分享你的阅读感受..."
                    :disabled="!userStore.isLoggedIn"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    @click="submitComment"
                    :loading="submittingComment"
                    :disabled="!commentForm.content.trim() || !userStore.isLoggedIn"
                  >
                    发表评论
                  </el-button>
                  <span v-if="!userStore.isLoggedIn" class="login-hint">
                    请先<router-link to="/login">登录</router-link>后发表评论
                  </span>
                </el-form-item>
              </el-form>
            </el-card>

            <div class="comments-list">
              <div
                v-for="comment in bookComments"
                :key="comment.id"
                class="comment-item"
              >
                <el-card shadow="hover">
                  <div class="comment-header">
                    <el-avatar :size="48" :src="comment.user?.avatar">
                      {{ comment.user?.nickname?.charAt(0) }}
                    </el-avatar>
                    <div class="comment-user-info">
                      <span class="user-name">{{ comment.user?.nickname }}</span>
                      <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                    </div>
                    <div class="comment-rating">
                      <el-rate :model-value="comment.rating" disabled size="small" />
                      <span class="rating-value">{{ comment.rating }}分</span>
                    </div>
                  </div>
                  <p class="comment-content">{{ comment.content }}</p>
                  <div class="comment-footer">
                    <el-button type="text" size="small">
                      <el-icon><ChatDotRound /></el-icon>
                      {{ comment.replyCount }} 回复
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      :class="{ 'active': comment.isLiked }"
                      @click="toggleCommentLike(comment)"
                    >
                      <el-icon><Star /></el-icon>
                      {{ comment.likeCount }} 点赞
                    </el-button>
                  </div>
                </el-card>
              </div>
            </div>

            <el-pagination
              v-if="commentPagination.total > 0"
              v-model:current-page="commentPagination.page"
              v-model:page-size="commentPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="commentPagination.total"
              layout="total, sizes, prev, pager, next"
              @size-change="fetchBookComments"
              @current-change="fetchBookComments"
              class="pagination"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-empty v-else-if="!loading" description="书籍不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import api from '@/api';
import {
  Star,
  Share,
  Location,
  ChatDotRound
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loading = ref(true);
const book = ref(null);
const isFavorited = ref(false);
const activeTab = ref('comments');

const bookChannels = ref([]);
const bookLibraries = ref([]);
const bookComments = ref([]);
const commentPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const commentForm = ref({
  content: '',
  rating: 0
});
const submittingComment = ref(false);

const bookId = computed(() => route.params.id);

const fetchBook = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/books/${bookId.value}`);
    book.value = res.data;
    isFavorited.value = res.data.isFavorited || false;
  } catch (error) {
    console.error('Failed to fetch book:', error);
    ElMessage.error('获取书籍信息失败');
  } finally {
    loading.value = false;
  }
};

const fetchBookChannels = async () => {
  try {
    const res = await api.get(`/books/${bookId.value}/channels`);
    bookChannels.value = res.data.channels || [];
  } catch (error) {
    console.error('Failed to fetch book channels:', error);
  }
};

const fetchBookLibraries = async () => {
  try {
    const res = await api.get(`/books/${bookId.value}/libraries`);
    bookLibraries.value = res.data.libraries || [];
  } catch (error) {
    console.error('Failed to fetch book libraries:', error);
  }
};

const fetchBookComments = async () => {
  try {
    const res = await api.get(`/books/${bookId.value}/comments`, {
      params: {
        page: commentPagination.value.page,
        pageSize: commentPagination.value.pageSize
      }
    });
    bookComments.value = res.data.comments || [];
    commentPagination.value.total = res.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch book comments:', error);
  }
};

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  try {
    if (isFavorited.value) {
      await api.delete(`/books/${bookId.value}/favorite`);
      isFavorited.value = false;
      ElMessage.success('已取消收藏');
    } else {
      await api.post(`/books/${bookId.value}/favorite`);
      isFavorited.value = true;
      ElMessage.success('收藏成功');
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    ElMessage.error('操作失败');
  }
};

const submitComment = async () => {
  if (!commentForm.value.content.trim() || !userStore.isLoggedIn) return;

  submittingComment.value = true;
  try {
    await api.post(`/books/${bookId.value}/comments`, {
      content: commentForm.value.content,
      rating: commentForm.value.rating || undefined
    });
    commentForm.value = { content: '', rating: 0 };
    ElMessage.success('评论发表成功');
    fetchBookComments();
    fetchBook();
  } catch (error) {
    console.error('Failed to submit comment:', error);
    ElMessage.error('评论发表失败');
  } finally {
    submittingComment.value = false;
  }
};

const toggleCommentLike = async (comment) => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  try {
    if (comment.isLiked) {
      await api.delete(`/comments/${comment.id}/like`);
      comment.isLiked = false;
      comment.likeCount--;
    } else {
      await api.post(`/comments/${comment.id}/like`);
      comment.isLiked = true;
      comment.likeCount++;
    }
  } catch (error) {
    console.error('Failed to toggle like:', error);
  }
};

const goToChannel = (channel) => {
  router.push(`/channels/${channel.id}`);
};

const goToLibrary = (library) => {
  router.push(`/libraries/${library.id}`);
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  
  return d.toLocaleDateString('zh-CN');
};

watch(activeTab, (newTab) => {
  if (newTab === 'channels') {
    fetchBookChannels();
  } else if (newTab === 'libraries') {
    fetchBookLibraries();
  } else if (newTab === 'comments') {
    fetchBookComments();
  }
});

watch(bookId, () => {
  loading.value = true;
  fetchBook();
  activeTab.value = 'comments';
});

onMounted(() => {
  fetchBook();
  fetchBookComments();
});
</script>

<style scoped>
.book-detail-page {
  padding-bottom: 40px;
}

.book-header {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.book-cover {
  width: 100%;
  max-width: 240px;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.book-info {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.book-author,
.book-publisher,
.book-isbn,
.book-category {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.book-author .label,
.book-publisher .label,
.book-isbn .label,
.book-category .label {
  color: #909399;
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.rating-score {
  font-size: 24px;
  font-weight: 600;
  color: #f7ba2a;
}

.rating-count {
  font-size: 14px;
  color: #909399;
}

.book-stats {
  display: flex;
  gap: 40px;
  margin: 16px 0;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.book-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.book-description {
  margin-bottom: 24px;
}

.book-description h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.description-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.detail-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
}

.related-channels,
.related-libraries {
  padding: 20px 0;
}

.channel-item,
.library-item {
  cursor: pointer;
  margin-bottom: 16px;
}

.channel-header,
.library-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.channel-info,
.library-info {
  flex: 1;
}

.channel-name,
.library-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.channel-desc,
.library-address {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.channel-stats,
.library-city {
  font-size: 12px;
  color: #909399;
}

.library-city {
  display: flex;
  align-items: center;
  gap: 4px;
}

.library-cover {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.comments-section {
  padding: 20px 0;
}

.comment-input-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.login-hint {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  cursor: pointer;
}

.comment-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #303133;
  display: block;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-value {
  font-size: 13px;
  color: #f7ba2a;
  font-weight: 600;
}

.comment-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-footer {
  display: flex;
  gap: 16px;
}

.comment-footer .active {
  color: #409eff !important;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
