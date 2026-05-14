<template>
  <div class="content-detail" v-if="content">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="header-title">内容详情</div>
      <div class="share-btn">分享</div>
    </div>

    <div class="scroll-content">
      <div class="author-card">
        <img :src="content.avatar" class="avatar" />
        <div class="author-info">
          <div class="nickname">{{ content.nickname }}</div>
          <div class="publish-time">{{ formatTime(content.created_at) }}</div>
        </div>
        <button 
          class="follow-btn" 
          :class="{ followed: content.isFollowing }"
          @click="toggleFollow"
        >
          {{ content.isFollowing ? '已关注' : '+ 关注' }}
        </button>
      </div>

      <div class="content-body">
        <h1 v-if="content.title" class="content-title">{{ content.title }}</h1>
        
        <div v-if="content.cover_image" class="content-media">
          <img :src="content.cover_image" :alt="content.title" />
          <span v-if="content.type === 'video'" class="video-tag">▶️ 视频</span>
        </div>

        <div class="content-text">{{ content.content }}</div>

        <div class="content-stats">
          <span>❤️ {{ content.likes }} 点赞</span>
          <span>💬 {{ content.comments }} 评论</span>
        </div>
      </div>

      <div v-if="content.relatedProducts?.length > 0" class="product-section card">
        <div class="section-title">🛒 推荐商品</div>
        <div class="product-list">
          <div 
            v-for="product in content.relatedProducts" 
            :key="product.id" 
            class="product-item"
            @click="goProduct(product.id)"
          >
            <img :src="product.cover_image" />
            <div class="product-info">
              <div class="product-name text-ellipsis">{{ product.title }}</div>
              <div class="product-price">¥{{ product.price }}</div>
            </div>
            <button class="buy-btn">去购买</button>
          </div>
        </div>
      </div>

      <div class="comments-section card">
        <div class="section-title">💬 评论 ({{ comments.length }})</div>
        
        <div v-if="comments.length > 0" class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <img :src="comment.avatar" class="comment-avatar" />
            <div class="comment-info">
              <div class="comment-header">
                <span class="comment-nickname">{{ comment.nickname }}</span>
                <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-comments">
          暂无评论，快来抢沙发吧~
        </div>
      </div>
    </div>

    <div class="bottom-bar safe-area-bottom">
      <div class="input-bar" @click="showCommentInput = true">
        <span class="placeholder">说点什么...</span>
      </div>
      <div class="action-btns">
        <div class="action-btn" @click="likeContent">
          <span class="icon">{{ content.isLiked ? '❤️' : '🤍' }}</span>
        </div>
        <div class="action-btn">
          <span class="icon">⭐</span>
        </div>
        <div class="action-btn">
          <span class="icon">🔗</span>
        </div>
      </div>
    </div>

    <div v-if="showCommentInput" class="comment-modal" @click="showCommentInput = false">
      <div class="comment-input-wrapper" @click.stop>
        <textarea 
          v-model="commentText" 
          placeholder="说点什么..."
          ref="commentInput"
        ></textarea>
        <div class="comment-actions">
          <button 
            class="send-btn"
            :disabled="!commentText.trim()"
            @click="submitComment"
          >发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contentApi } from '../api';
import { useUserStore } from '../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const showToast = inject('showToast');

const content = ref(null);
const comments = ref([]);
const showCommentInput = ref(false);
const commentText = ref('');
const commentInput = ref(null);

const fetchDetail = async () => {
  try {
    const res = await contentApi.getDetail(route.params.id);
    if (res.code === 200) {
      content.value = res.data;
      comments.value = res.data.comments || [];
    }
  } catch (e) {
    console.error(e);
  }
};

const goBack = () => {
  router.back();
};

const goProduct = (id) => {
  router.push(`/product/${id}`);
};

const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  
  try {
    const res = await contentApi.toggleFollow(content.value.user_id);
    if (res.code === 200) {
      content.value.isFollowing = res.data.isFollowing;
      showToast(res.data.isFollowing ? '关注成功' : '已取消关注');
    }
  } catch (e) {
    console.error(e);
  }
};

const likeContent = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  
  try {
    const res = await contentApi.likeContent(content.value.id);
    if (res.code === 200) {
      content.value.likes++;
      content.value.isLiked = true;
      showToast('点赞成功');
    }
  } catch (e) {
    console.error(e);
  }
};

const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  
  if (!commentText.value.trim()) return;
  
  try {
    const res = await contentApi.commentContent(content.value.id, {
      content: commentText.value.trim()
    });
    if (res.code === 200) {
      comments.value.unshift(res.data);
      content.value.comments++;
      commentText.value = '';
      showCommentInput.value = false;
      showToast('评论成功');
    }
  } catch (e) {
    console.error(e);
  }
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
.content-detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.back-btn {
  font-size: 20px;
  color: #333;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.share-btn {
  font-size: 14px;
  color: #666;
}

.scroll-content {
  padding-top: 52px;
}

.author-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
}

.author-info {
  flex: 1;
}

.nickname {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.publish-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.follow-btn {
  padding: 6px 16px;
  border-radius: 15px;
  font-size: 13px;
  border: none;
  background: #ff5000;
  color: #fff;
}

.follow-btn.followed {
  background: #f5f5f5;
  color: #999;
}

.content-body {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.content-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12px;
}

.content-media {
  position: relative;
  margin: 12px -16px;
  border-radius: 0;
  overflow: hidden;
}

.content-media img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}

.video-tag {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.content-text {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  margin-top: 12px;
  white-space: pre-wrap;
}

.content-stats {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  font-size: 13px;
  color: #999;
}

.product-section, .comments-section {
  margin: 12px;
  padding: 16px;
  overflow: hidden;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.product-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.product-price {
  font-size: 14px;
  color: #ff4d4f;
  font-weight: bold;
}

.buy-btn {
  padding: 6px 14px;
  border-radius: 15px;
  border: none;
  background: #ff5000;
  color: #fff;
  font-size: 12px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 10px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-info {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comment-nickname {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.comment-time {
  font-size: 11px;
  color: #999;
}

.comment-content {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.empty-comments {
  text-align: center;
  padding: 30px 20px;
  color: #999;
  font-size: 13px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #eee;
  z-index: 100;
}

.input-bar {
  flex: 1;
  background: #f5f5f5;
  border-radius: 18px;
  padding: 10px 16px;
  margin-right: 12px;
}

.placeholder {
  color: #999;
  font-size: 14px;
}

.action-btns {
  display: flex;
  gap: 16px;
}

.action-btn {
  font-size: 22px;
}

.comment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.comment-input-wrapper {
  background: #fff;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.comment-input-wrapper textarea {
  width: 100%;
  min-height: 100px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: none;
  outline: none;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.send-btn {
  padding: 8px 24px;
  border-radius: 18px;
  border: none;
  background: #ff5000;
  color: #fff;
  font-size: 14px;
}

.send-btn:disabled {
  opacity: 0.5;
}
</style>
