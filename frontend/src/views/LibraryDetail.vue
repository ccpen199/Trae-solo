<template>
  <div class="library-detail-page page-container" v-loading="loading">
    <div v-if="library" class="container">
      <div class="library-header">
        <div class="header-bg" :style="{ backgroundImage: `url(${library.coverImage})` }"></div>
        <div class="header-content">
          <img :src="library.coverImage" :alt="library.name" class="library-cover" />
          <div class="library-info">
            <h1 class="library-name">{{ library.name }}</h1>
            <p class="library-city">
              <el-icon><Location /></el-icon>
              {{ library.city }}
            </p>
            <p class="library-address">{{ library.address }}</p>
            <div class="library-rating">
              <el-rate :model-value="library.rating" disabled />
              <span class="rating-score">{{ library.rating }}</span>
              <span class="rating-count">({{ library.commentCount }} 人评价)</span>
            </div>
            <div class="library-stats">
              <div class="stat-item">
                <span class="stat-value">{{ library.bookCount }}</span>
                <span class="stat-label">藏书</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ library.followerCount }}</span>
                <span class="stat-label">关注</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ library.commentCount }}</span>
                <span class="stat-label">评论</span>
              </div>
            </div>
            <div class="library-actions">
              <el-button
                :type="isFollowed ? 'default' : 'primary'"
                @click="toggleFollow"
              >
                <el-icon><Plus /></el-icon>
                {{ isFollowed ? '已关注' : '关注图书馆' }}
              </el-button>
              <el-button>
                <el-icon><Share /></el-icon>
                分享
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-card class="library-description" v-if="library.description">
        <template #header>
          <h3>图书馆简介</h3>
        </template>
        <p class="description-text">{{ library.description }}</p>
      </el-card>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="馆藏书籍" name="books">
          <div class="library-books">
            <div v-if="libraryBooks.length > 0" class="books-grid">
              <div
                v-for="book in libraryBooks"
                :key="book.id"
                class="book-item"
                @click="goToBook(book)"
              >
                <el-card shadow="hover">
                  <img :src="book.coverImage" :alt="book.title" class="book-cover" />
                  <h3 class="book-title text-ellipsis">{{ book.title }}</h3>
                  <p class="book-author text-ellipsis">{{ book.author }}</p>
                  <div class="book-stats">
                    <el-rate :model-value="book.rating" disabled size="small" />
                    <span class="rating-text">{{ book.rating }}</span>
                  </div>
                </el-card>
              </div>
            </div>
            <el-empty v-else description="暂无馆藏书籍" />

            <el-pagination
              v-if="bookPagination.total > 0"
              v-model:current-page="bookPagination.page"
              v-model:page-size="bookPagination.pageSize"
              :page-sizes="[8, 16, 24]"
              :total="bookPagination.total"
              layout="total, sizes, prev, pager, next"
              @size-change="fetchLibraryBooks"
              @current-change="fetchLibraryBooks"
              class="pagination"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="图书馆评论" name="comments">
          <div class="comments-section">
            <el-card class="comment-input-card">
              <h4>发表评论</h4>
              <el-form :model="commentForm" label-width="80px">
                <el-form-item label="评分">
                  <el-rate v-model="commentForm.rating" :max="5" />
                </el-form-item>
                <el-form-item label="评论">
                  <el-input
                    v-model="commentForm.content"
                    type="textarea"
                    :rows="3"
                    placeholder="分享你的评价..."
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
                v-for="comment in libraryComments"
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
                    <div class="comment-rating" v-if="comment.rating">
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
              @size-change="fetchLibraryComments"
              @current-change="fetchLibraryComments"
              class="pagination"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-empty v-else-if="!loading" description="图书馆不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import api from '@/api';
import {
  Location,
  Plus,
  Share,
  ChatDotRound,
  Star
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loading = ref(true);
const library = ref(null);
const isFollowed = ref(false);
const activeTab = ref('books');

const libraryBooks = ref([]);
const bookPagination = ref({
  page: 1,
  pageSize: 8,
  total: 0
});

const libraryComments = ref([]);
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

const libraryId = computed(() => route.params.id);

const fetchLibrary = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/libraries/${libraryId.value}`);
    library.value = res.data;
    isFollowed.value = res.data.isFollowed || false;
  } catch (error) {
    console.error('Failed to fetch library:', error);
    ElMessage.error('获取图书馆信息失败');
  } finally {
    loading.value = false;
  }
};

const fetchLibraryBooks = async () => {
  try {
    const res = await api.get(`/libraries/${libraryId.value}/books`, {
      params: {
        page: bookPagination.value.page,
        pageSize: bookPagination.value.pageSize
      }
    });
    libraryBooks.value = res.data.books || [];
    bookPagination.value.total = res.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch library books:', error);
  }
};

const fetchLibraryComments = async () => {
  try {
    const res = await api.get(`/libraries/${libraryId.value}/comments`, {
      params: {
        page: commentPagination.value.page,
        pageSize: commentPagination.value.pageSize
      }
    });
    libraryComments.value = res.data.comments || [];
    commentPagination.value.total = res.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch library comments:', error);
  }
};

const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  try {
    if (isFollowed.value) {
      await api.delete(`/libraries/${libraryId.value}/follow`);
      isFollowed.value = false;
      ElMessage.success('已取消关注');
    } else {
      await api.post(`/libraries/${libraryId.value}/follow`);
      isFollowed.value = true;
      ElMessage.success('关注成功');
    }
  } catch (error) {
    console.error('Failed to toggle follow:', error);
    ElMessage.error('操作失败');
  }
};

const submitComment = async () => {
  if (!commentForm.value.content.trim() || !userStore.isLoggedIn) return;

  submittingComment.value = true;
  try {
    await api.post(`/libraries/${libraryId.value}/comments`, {
      content: commentForm.value.content,
      rating: commentForm.value.rating || undefined
    });
    commentForm.value = { content: '', rating: 0 };
    ElMessage.success('评论发表成功');
    fetchLibraryComments();
    fetchLibrary();
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

const goToBook = (book) => {
  router.push(`/books/${book.id}`);
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
  if (newTab === 'books') {
    fetchLibraryBooks();
  } else if (newTab === 'comments') {
    fetchLibraryComments();
  }
});

watch(libraryId, () => {
  loading.value = true;
  fetchLibrary();
  activeTab.value = 'books';
});

onMounted(() => {
  fetchLibrary();
  fetchLibraryBooks();
});
</script>

<style scoped>
.library-detail-page {
  padding-bottom: 40px;
}

.library-header {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
}

.header-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(8px);
  transform: scale(1.1);
}

.header-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
}

.header-content {
  position: relative;
  z-index: 1;
  padding: 40px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  color: #fff;
}

.library-cover {
  width: 240px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.library-info {
  flex: 1;
}

.library-name {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 12px;
}

.library-city {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 6px;
}

.library-address {
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 16px;
}

.library-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.rating-score {
  font-size: 24px;
  font-weight: 600;
  color: #f7ba2a;
}

.rating-count {
  font-size: 14px;
  opacity: 0.8;
}

.library-stats {
  display: flex;
  gap: 40px;
  margin: 16px 0;
  padding: 16px 0;
  border-top: 1px solid rgba(255,255,255,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-label {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 4px;
}

.library-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.library-description {
  margin-bottom: 24px;
}

.library-description h3 {
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

.library-books {
  padding: 20px 0;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.book-item {
  cursor: pointer;
}

.book-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
}

.book-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.book-author {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.book-stats {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-text {
  font-size: 12px;
  color: #f7ba2a;
  font-weight: 600;
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
