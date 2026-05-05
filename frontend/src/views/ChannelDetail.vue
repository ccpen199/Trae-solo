<template>
  <div class="channel-detail-page page-container" v-loading="loading">
    <div v-if="channel" class="container">
      <div class="channel-header">
        <div class="header-bg" :style="{ backgroundImage: `url(${channel.coverImage})` }"></div>
        <div class="header-content">
          <el-avatar :size="100" :src="channel.icon">
            {{ channel.name?.charAt(0) }}
          </el-avatar>
          <div class="channel-info">
            <h1 class="channel-name">{{ channel.name }}</h1>
            <p class="channel-desc">{{ channel.description }}</p>
            <div class="channel-meta">
              <span class="stat">
                <el-icon><User /></el-icon>
                {{ channel.followerCount }} 关注
              </span>
              <span class="stat">
                <el-icon><Document /></el-icon>
                {{ channel.contentCount }} 内容
              </span>
              <span class="stat">
                <el-icon><Star /></el-icon>
                {{ channel.bookCount }} 书籍
              </span>
            </div>
            <div class="channel-tags">
              <el-tag v-for="tag in channel.tags" :key="tag" size="small">
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <div class="header-actions">
            <el-button
              :type="isFollowed ? 'default' : 'primary'"
              @click="toggleFollow"
            >
              <el-icon v-if="isFollowed"><Minus /></el-icon>
              <el-icon v-else><Plus /></el-icon>
              {{ isFollowed ? '已关注' : '关注' }}
            </el-button>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="频道书籍" name="books">
          <div class="books-grid">
            <div
              v-for="book in channelBooks"
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
          <el-pagination
            v-if="bookPagination.total > 0"
            v-model:current-page="bookPagination.page"
            v-model:page-size="bookPagination.pageSize"
            :page-sizes="[8, 16, 24]"
            :total="bookPagination.total"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchChannelBooks"
            @current-change="fetchChannelBooks"
            class="pagination"
          />
        </el-tab-pane>

        <el-tab-pane label="频道评论" name="comments">
          <div class="comments-section">
            <el-card class="comment-input-card">
              <el-input
                v-model="commentContent"
                type="textarea"
                :rows="3"
                placeholder="分享你的想法..."
                :disabled="!userStore.isLoggedIn"
              />
              <div class="comment-actions">
                <el-button
                  type="primary"
                  @click="submitComment"
                  :loading="submittingComment"
                  :disabled="!commentContent.trim() || !userStore.isLoggedIn"
                >
                  发表评论
                </el-button>
                <span v-if="!userStore.isLoggedIn" class="login-hint">
                  请先<router-link to="/login">登录</router-link>后发表评论
                </span>
              </div>
            </el-card>

            <div class="comments-list">
              <div
                v-for="comment in channelComments"
                :key="comment.id"
                class="comment-item"
              >
                <el-card shadow="hover">
                  <div class="comment-header">
                    <el-avatar :size="40" :src="comment.user?.avatar">
                      {{ comment.user?.nickname?.charAt(0) }}
                    </el-avatar>
                    <div class="comment-user-info">
                      <span class="user-name">{{ comment.user?.nickname }}</span>
                      <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                    </div>
                  </div>
                  <p class="comment-content">{{ comment.content }}</p>
                  <div class="comment-footer">
                    <el-button type="text" size="small">
                      <el-icon><ChatDotRound /></el-icon>
                      {{ comment.replyCount }}
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      :class="{ 'active': comment.isLiked }"
                      @click="toggleCommentLike(comment)"
                    >
                      <el-icon><Star /></el-icon>
                      {{ comment.likeCount }}
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
              @size-change="fetchChannelComments"
              @current-change="fetchChannelComments"
              class="pagination"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-empty v-else-if="!loading" description="频道不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import api from '@/api';
import {
  User,
  Document,
  Star,
  Minus,
  Plus,
  ChatDotRound
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loading = ref(true);
const channel = ref(null);
const isFollowed = ref(false);
const activeTab = ref('books');

const channelBooks = ref([]);
const bookPagination = ref({
  page: 1,
  pageSize: 8,
  total: 0
});

const channelComments = ref([]);
const commentPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});
const commentContent = ref('');
const submittingComment = ref(false);

const channelId = computed(() => route.params.id);

const fetchChannel = async () => {
  try {
    const res = await api.get(`/channels/${channelId.value}`);
    channel.value = res.data;
    isFollowed.value = res.data.isFollowed || false;
  } catch (error) {
    console.error('Failed to fetch channel:', error);
    ElMessage.error('获取频道信息失败');
  } finally {
    loading.value = false;
  }
};

const fetchChannelBooks = async () => {
  try {
    const res = await api.get(`/channels/${channelId.value}/books`, {
      params: {
        page: bookPagination.value.page,
        pageSize: bookPagination.value.pageSize
      }
    });
    channelBooks.value = res.data.books || [];
    bookPagination.value.total = res.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch channel books:', error);
  }
};

const fetchChannelComments = async () => {
  try {
    const res = await api.get(`/channels/${channelId.value}/comments`, {
      params: {
        page: commentPagination.value.page,
        pageSize: commentPagination.value.pageSize
      }
    });
    channelComments.value = res.data.comments || [];
    commentPagination.value.total = res.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch channel comments:', error);
  }
};

const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  try {
    if (isFollowed.value) {
      await api.delete(`/channels/${channelId.value}/follow`);
      isFollowed.value = false;
      ElMessage.success('已取消关注');
    } else {
      await api.post(`/channels/${channelId.value}/follow`);
      isFollowed.value = true;
      ElMessage.success('关注成功');
    }
  } catch (error) {
    console.error('Failed to toggle follow:', error);
    ElMessage.error('操作失败');
  }
};

const submitComment = async () => {
  if (!commentContent.value.trim() || !userStore.isLoggedIn) return;

  submittingComment.value = true;
  try {
    await api.post(`/channels/${channelId.value}/comments`, {
      content: commentContent.value
    });
    commentContent.value = '';
    ElMessage.success('评论发表成功');
    fetchChannelComments();
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
    fetchChannelBooks();
  } else if (newTab === 'comments') {
    fetchChannelComments();
  }
});

watch(channelId, () => {
  loading.value = true;
  fetchChannel();
  activeTab.value = 'books';
});

onMounted(() => {
  fetchChannel();
  fetchChannelBooks();
});
</script>

<style scoped>
.channel-detail-page {
  padding-bottom: 40px;
}

.channel-header {
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

.channel-info {
  flex: 1;
}

.channel-name {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 12px;
}

.channel-desc {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 16px;
  line-height: 1.6;
}

.channel-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.channel-meta .stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.85;
}

.channel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px 0;
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

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.comment-input-card {
  margin-bottom: 20px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.login-hint {
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
</style>
