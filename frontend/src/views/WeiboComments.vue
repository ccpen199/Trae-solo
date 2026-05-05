<template>
  <div class="weibo-comments-page page-container">
    <div class="container">
      <div class="page-header">
        <h1>微博评论</h1>
        <p>连接社交互动，分享阅读见解</p>
      </div>

      <el-card class="intro-card">
        <p>这里展示来自微博平台的社交评论，让站内阅读内容与外部社交互动形成连接。</p>
      </el-card>

      <div v-loading="loading" class="comments-section">
        <div class="comments-list">
          <div
            v-for="comment in weiboComments"
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
                  <span class="comment-source">
                    <el-icon><Share /></el-icon>
                    来自微博
                  </span>
                </div>
                <el-tag size="small" type="info">微博评论</el-tag>
              </div>
              <p class="comment-content">{{ comment.content }}</p>
              <div class="comment-meta">
                <div class="weibo-meta" v-if="comment.weiboId">
                  <span class="meta-item">
                    <el-icon><ChatDotRound /></el-icon>
                    微博ID: {{ comment.weiboId }}
                  </span>
                  <span class="meta-item" v-if="comment.weiboText">
                    原微博: {{ comment.weiboText.substring(0, 50) }}...
                  </span>
                </div>
              </div>
              <div class="comment-footer">
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                <div class="comment-actions">
                  <el-button type="text" size="small">
                    <el-icon><Share /></el-icon>
                    转发
                  </el-button>
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
              </div>
            </el-card>
          </div>
        </div>

        <el-empty v-if="!loading && weiboComments.length === 0" description="暂无微博评论" />

        <el-pagination
          v-if="pagination.total > 0"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchWeiboComments"
          @current-change="fetchWeiboComments"
          class="pagination"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import api from '@/api';
import {
  Share,
  ChatDotRound,
  Star
} from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const weiboComments = ref([]);
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const fetchWeiboComments = async () => {
  loading.value = true;
  try {
    const res = await api.get('/comments/weibo', {
      params: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize
      }
    });
    weiboComments.value = res.data.comments || [];
    pagination.value.total = res.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch weibo comments:', error);
  } finally {
    loading.value = false;
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
  fetchWeiboComments();
});
</script>

<style scoped>
.weibo-comments-page {
  padding-bottom: 40px;
}

.intro-card {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #e6f7ff, #f6ffed);
}

.intro-card p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.comments-section {
  margin-bottom: 24px;
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
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 600;
  color: #303133;
}

.comment-source {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-meta {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.weibo-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.comment-actions .active {
  color: #409eff !important;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
