<template>
  <div class="product-detail-page">
    <header class="page-header">
      <div class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </div>
      <h1 class="page-title">商品详情</h1>
      <div class="share-btn">
        <span class="share-icon">📤</span>
      </div>
    </header>

    <div class="content" v-if="!loading && product">
      <div class="product-image-section">
        <div class="main-image">
          <img :src="product.image" :alt="product.title">
          <div class="live-badge" v-if="product.is_live" @click="goToLive">
            <span class="live-dot"></span>
            直播中
            <span class="live-arrow">→</span>
          </div>
        </div>
      </div>

      <div class="product-info-section">
        <div class="ranking-badge" v-if="product.ranking_info" @click="goToRanking">
          🏆 入选{{ product.ranking_info.ranking_name }} · 第{{ product.ranking_info.rank }}名
        </div>

        <div class="product-title">{{ product.title }}</div>

        <div class="product-price">
          <span class="price-label">¥</span>
          <span class="price-value">{{ product.price }}</span>
        </div>

        <div class="sales-info">
          <span class="sales-badge">📦 近7日售出 {{ product.recent_sales }} 件</span>
        </div>
      </div>

      <div class="comments-section" v-if="product.hot_comments && product.hot_comments.length > 0">
        <div class="section-header" @click="showCommentsModal = true">
          <span class="section-title">💬 热门评论</span>
          <span class="view-all">查看全部 ></span>
        </div>

        <div class="comments-list">
          <div
            class="comment-item"
            v-for="comment in product.hot_comments.slice(0, 3)"
            :key="comment.id"
          >
            <div class="comment-header">
              <div class="user-info">
                <div class="user-avatar" v-if="comment.user_avatar">
                  <img :src="comment.user_avatar" alt="">
                </div>
                <div class="user-avatar default" v-else>
                  {{ comment.user_name.charAt(0) }}
                </div>
                <span class="user-name">{{ comment.user_name }}</span>
              </div>
              <div class="hot-tag" v-if="comment.is_hot">🔥 热评</div>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <div class="comment-footer">
              <div class="rating">
                <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= comment.rating }">★</span>
              </div>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-section">
        <button class="buy-btn">立即购买</button>
      </div>
    </div>

    <div class="loading" v-else>
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div class="modal-overlay" v-if="showCommentsModal" @click="showCommentsModal = false">
      <div class="comments-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-title">全部评论</span>
          <span class="modal-close" @click="showCommentsModal = false">✕</span>
        </div>
        <div class="modal-content" v-if="!commentsLoading">
          <div class="comments-list">
            <div
              class="comment-item"
              v-for="comment in allComments"
              :key="comment.id"
            >
              <div class="comment-header">
                <div class="user-info">
                  <div class="user-avatar default">
                    {{ comment.user_name.charAt(0) }}
                  </div>
                  <span class="user-name">{{ comment.user_name }}</span>
                </div>
                <div class="hot-tag" v-if="comment.is_hot">🔥 热评</div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              <div class="comment-footer">
                <div class="rating">
                  <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= comment.rating }">★</span>
                </div>
              </div>
            </div>
          </div>
          <div class="empty" v-if="allComments.length === 0">
            <div class="empty-icon">💬</div>
            <p>暂无评论</p>
          </div>
        </div>
        <div class="loading" v-else>
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { productsAPI } from '../api';

const route = useRoute();
const router = useRouter();

const product = ref(null);
const loading = ref(false);
const showCommentsModal = ref(false);
const allComments = ref([]);
const commentsLoading = ref(false);

const loadProduct = async () => {
  loading.value = true;
  
  try {
    const id = route.params.id;
    const res = await productsAPI.getProduct(id);
    
    if (res.success) {
      product.value = res.data;
    }
  } catch (error) {
    console.error('加载商品详情失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadComments = async () => {
  if (!product.value) return;
  
  commentsLoading.value = true;
  
  try {
    const res = await productsAPI.getComments(product.value.id);
    if (res.success) {
      allComments.value = res.data.comments;
    }
  } catch (error) {
    console.error('加载评论失败:', error);
  } finally {
    commentsLoading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const goToRanking = () => {
  if (product.value?.ranking_info) {
    router.push(`/ranking/${product.value.ranking_info.ranking_id}`);
  }
};

const goToLive = () => {
  alert('正在跳转直播间...');
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
  
  return date.toLocaleDateString();
};

onMounted(() => {
  loadProduct();
});

showCommentsModal.value = false;
</script>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  background-color: var(--bg-secondary);
  padding-bottom: 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-primary);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .share-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border-radius: 50%;
  cursor: pointer;
}

.back-icon, .share-icon {
  font-size: 18px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.content {
  padding-bottom: 16px;
}

.product-image-section {
  background-color: var(--bg-primary);
  padding: 0;
}

.main-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: var(--error-color);
  color: white;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  cursor: pointer;
}

.live-dot {
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
  margin-right: 8px;
  animation: pulse 1s infinite;
}

.live-arrow {
  margin-left: 4px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.product-info-section {
  background-color: var(--bg-primary);
  padding: 20px 16px;
  margin-top: 1px;
}

.ranking-badge {
  display: inline-block;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fff1f0, #ffe4e1);
  color: var(--error-color);
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  margin-bottom: 12px;
  cursor: pointer;
}

.product-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 12px;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
}

.price-label {
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-color);
}

.price-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--primary-color);
  margin-left: 2px;
}

.sales-info {
  margin-bottom: 8px;
}

.sales-badge {
  display: inline-block;
  padding: 6px 12px;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  border-radius: 12px;
}

.comments-section {
  background-color: var(--bg-primary);
  margin-top: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

.view-all {
  font-size: 14px;
  color: var(--text-muted);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.comment-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar.default {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-light);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.hot-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #fff1f0;
  color: var(--error-color);
  font-size: 11px;
  border-radius: 4px;
}

.comment-content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 8px;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 12px;
  color: var(--border-color);
}

.star.filled {
  color: var(--warning-color);
}

.comment-time {
  font-size: 12px;
  color: var(--text-muted);
}

.action-section {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 750px;
  background-color: var(--bg-primary);
  padding: 12px 16px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 12px;
}

.buy-btn {
  flex: 1;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-radius: 24px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.comments-modal {
  width: 100%;
  max-width: 750px;
  max-height: 70vh;
  background-color: var(--bg-primary);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

.modal-close {
  font-size: 20px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.modal-content .comment-item {
  border-bottom: 1px solid var(--border-color);
}

.modal-content .comment-item:last-child {
  border-bottom: none;
}
</style>
