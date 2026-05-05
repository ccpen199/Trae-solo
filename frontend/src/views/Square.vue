<template>
  <div class="square-page page-container">
    <div class="container">
      <div class="square-banner">
        <div class="banner-content">
          <h1>探索阅读的无限可能</h1>
          <p>发现好书、参与讨论、分享阅读心得</p>
          <div class="banner-actions">
            <el-button type="primary" size="large" @click="goToChannels">
              <el-icon><Collection /></el-icon>
              浏览频道
            </el-button>
            <el-button size="large" @click="goToBooks">
              <el-icon><Reading /></el-icon>
              发现好书
            </el-button>
          </div>
        </div>
      </div>

      <div class="trending-topics" v-if="topics.length">
        <h2 class="section-title">热门话题</h2>
        <div class="topic-list">
          <el-tag
            v-for="topic in topics"
            :key="topic.id"
            :type="topic.hot ? 'danger' : ''"
            class="topic-tag"
            effect="plain"
          >
            {{ topic.name }}
            <span class="topic-count">({{ topic.count }})</span>
            <el-icon v-if="topic.hot" class="hot-icon"><Star /></el-icon>
          </el-tag>
        </div>
      </div>

      <el-row :gutter="24">
        <el-col :span="16">
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">热门书籍</h2>
              <router-link to="/books" class="see-more">查看更多 →</router-link>
            </div>
            <div v-loading="loading.books" class="books-grid">
              <div
                v-for="book in hotBooks"
                :key="book.id"
                class="book-item"
                @click="goToBook(book)"
              >
                <el-card class="book-card" shadow="hover">
                  <img :src="book.coverImage" :alt="book.title" class="book-cover" />
                  <div class="book-info">
                    <h3 class="book-title text-ellipsis">{{ book.title }}</h3>
                    <p class="book-author text-ellipsis">{{ book.author }}</p>
                    <div class="book-stats">
                      <el-rate
                        :model-value="book.rating"
                        disabled
                        :max="5"
                        size="small"
                      />
                      <span class="rating-text">{{ book.rating }}</span>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h2 class="section-title">最新评论</h2>
            </div>
            <div v-loading="loading.comments" class="comments-list">
              <div
                v-for="comment in recentComments"
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
                    <div class="comment-rating" v-if="comment.rating">
                      <el-rate :model-value="comment.rating" disabled size="small" />
                    </div>
                  </div>
                  <p class="comment-content">{{ comment.content }}</p>
                  <div class="comment-footer">
                    <el-button type="text" size="small">
                      <el-icon><ChatDotRound /></el-icon>
                      {{ comment.replyCount }}
                    </el-button>
                    <el-button type="text" size="small">
                      <el-icon><Star /></el-icon>
                      {{ comment.likeCount }}
                    </el-button>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :span="8">
          <div class="section">
            <h2 class="section-title">精选频道</h2>
            <div v-loading="loading.channels" class="channel-list">
              <div
                v-for="channel in featuredChannels"
                :key="channel.id"
                class="channel-item"
                @click="goToChannel(channel)"
              >
                <el-card shadow="hover">
                  <div class="channel-header">
                    <el-avatar :size="48" :src="channel.icon" class="channel-icon">
                      {{ channel.name?.charAt(0) }}
                    </el-avatar>
                    <div class="channel-info">
                      <h3 class="channel-name">{{ channel.name }}</h3>
                      <p class="channel-stats">
                        <span>{{ channel.followerCount }} 关注</span>
                        <span>{{ channel.contentCount }} 内容</span>
                      </p>
                    </div>
                  </div>
                  <p class="channel-desc text-ellipsis-2">{{ channel.description }}</p>
                  <div class="channel-tags">
                    <el-tag v-for="tag in channel.tags?.slice(0, 3)" :key="tag" size="small">
                      {{ tag }}
                    </el-tag>
                  </div>
                </el-card>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">推荐图书馆</h2>
            <div v-loading="loading.libraries" class="library-list">
              <div
                v-for="library in featuredLibraries"
                :key="library.id"
                class="library-item"
                @click="goToLibrary(library)"
              >
                <el-card shadow="hover">
                  <div class="library-header">
                    <img :src="library.coverImage" :alt="library.name" class="library-cover" />
                    <div class="library-info">
                      <h3 class="library-name text-ellipsis">{{ library.name }}</h3>
                      <p class="library-city">
                        <el-icon><Location /></el-icon>
                        {{ library.city }}
                      </p>
                      <div class="library-rating">
                        <el-rate :model-value="library.rating" disabled size="small" />
                        <span class="rating-text">{{ library.rating }}</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import {
  Collection,
  Reading,
  Star,
  ChatDotRound,
  Location
} from '@element-plus/icons-vue';

const router = useRouter();

const loading = ref({
  books: true,
  comments: true,
  channels: true,
  libraries: true
});

const hotBooks = ref([]);
const featuredChannels = ref([]);
const featuredLibraries = ref([]);
const recentComments = ref([]);
const topics = ref([]);

const fetchSquareData = async () => {
  try {
    const res = await api.get('/square/data');
    
    hotBooks.value = res.data.books?.hot || [];
    featuredChannels.value = res.data.channels?.featured || [];
    featuredLibraries.value = res.data.libraries?.featured || [];
    recentComments.value = res.data.comments?.recent || [];
  } catch (error) {
    console.error('Failed to fetch square data:', error);
  } finally {
    loading.value.books = false;
    loading.value.comments = false;
    loading.value.channels = false;
    loading.value.libraries = false;
  }
};

const fetchTopics = async () => {
  try {
    const res = await api.get('/square/topics');
    topics.value = res.data.topics || [];
  } catch (error) {
    console.error('Failed to fetch topics:', error);
  }
};

const goToChannels = () => {
  router.push('/channels');
};

const goToBooks = () => {
  router.push('/books');
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

onMounted(() => {
  fetchSquareData();
  fetchTopics();
});
</script>

<style scoped>
.square-page {
  padding-bottom: 40px;
}

.square-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 48px;
  margin-bottom: 24px;
  color: #fff;
  text-align: center;
}

.banner-content h1 {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 12px;
}

.banner-content p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 24px;
}

.banner-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.trending-topics {
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.topic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.topic-tag {
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
}

.topic-count {
  margin-left: 4px;
  color: #909399;
}

.hot-icon {
  margin-left: 4px;
  color: #f56c6c;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.see-more {
  font-size: 14px;
  color: #409eff;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.book-item {
  cursor: pointer;
}

.book-card {
  height: 100%;
}

.book-cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
}

.book-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
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
  gap: 8px;
}

.rating-text {
  font-size: 12px;
  color: #f7ba2a;
  font-weight: 600;
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
  margin-left: auto;
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

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.channel-item {
  cursor: pointer;
}

.channel-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.channel-icon {
  background: linear-gradient(135deg, #409eff, #67c23a);
}

.channel-info {
  flex: 1;
}

.channel-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.channel-stats {
  font-size: 12px;
  color: #909399;
}

.channel-stats span {
  margin-right: 12px;
}

.channel-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.5;
}

.channel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.library-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.library-item {
  cursor: pointer;
}

.library-header {
  display: flex;
  gap: 12px;
}

.library-cover {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.library-info {
  flex: 1;
}

.library-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.library-city {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.library-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
