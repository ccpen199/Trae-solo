<template>
  <div class="content page-container">
    <div class="header">
      <div class="header-title">微淘</div>
      <div class="publish-btn" @click="goPublish">✏️</div>
    </div>

    <div class="tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab" 
        :class="{ active: activeTab === tab.value }"
        @click="changeTab(tab.value)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div v-if="contents.length > 0" class="content-list">
      <div 
        v-for="item in contents" 
        :key="item.id" 
        class="content-card card"
        @click="goDetail(item.id)"
      >
        <div class="content-header">
          <img :src="item.avatar" class="avatar" />
          <div class="user-info">
            <div class="nickname">{{ item.nickname }}</div>
            <div class="publish-time">{{ formatTime(item.created_at) }}</div>
          </div>
          <button 
            class="follow-btn" 
            :class="{ followed: item.isFollowing }"
            @click.stop="toggleFollow(item)"
          >
            {{ item.isFollowing ? '已关注' : '+ 关注' }}
          </button>
        </div>

        <div class="content-body">
          <h3 v-if="item.title" class="content-title">{{ item.title }}</h3>
          <p class="content-text">{{ item.content }}</p>
          
          <div v-if="item.cover_image" class="content-media">
            <img :src="item.cover_image" :alt="item.title" />
            <span v-if="item.type === 'video'" class="video-tag">▶️ 视频</span>
          </div>
        </div>

        <div v-if="item.relatedProducts?.length > 0" class="product-section">
          <div class="product-header">
            <span>🛒 推荐商品</span>
          </div>
          <div class="product-list">
            <div 
              v-for="product in item.relatedProducts.slice(0, 3)" 
              :key="product.id" 
              class="product-item"
              @click.stop="goProduct(product.id)"
            >
              <img :src="product.cover_image" />
              <div class="product-info">
                <div class="product-name text-ellipsis">{{ product.title }}</div>
                <div class="product-price">¥{{ product.price }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-footer">
          <div class="action-item" @click.stop="likeContent(item)">
            <span class="icon">{{ item.isLiked ? '❤️' : '🤍' }}</span>
            <span class="count">{{ item.likes }}</span>
          </div>
          <div class="action-item">
            <span class="icon">💬</span>
            <span class="count">{{ item.comments }}</span>
          </div>
          <div class="action-item">
            <span class="icon">🔗</span>
            <span class="count">分享</span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!hasMore" class="no-more">没有更多了</div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <div class="icon">📖</div>
      <div class="text">暂无内容</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue';
import { useRouter } from 'vue-router';
import { contentApi } from '../api';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const showToast = inject('showToast');

const activeTab = ref('all');
const contents = ref([]);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);
const hasMore = ref(true);

const tabs = computed(() => [
  { label: '推荐', value: 'all' },
  { label: '关注', value: 'follow' },
  { label: '视频', value: 'video' },
  { label: '图文', value: 'article' }
]);

const fetchContents = async (refresh = false) => {
  if (loading.value || (!hasMore.value && !refresh)) return;
  
  loading.value = true;
  
  if (refresh) {
    page.value = 1;
    contents.value = [];
    hasMore.value = true;
  }
  
  try {
    const params = {
      page: page.value,
      pageSize
    };
    
    if (activeTab.value === 'video' || activeTab.value === 'article') {
      params.type = activeTab.value;
    }
    
    const res = await contentApi.getList(params);
    if (res.code === 200) {
      if (refresh) {
        contents.value = res.data.list;
      } else {
        contents.value = [...contents.value, ...res.data.list];
      }
      
      hasMore.value = res.data.list.length >= pageSize;
      if (hasMore.value) {
        page.value++;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const changeTab = (value) => {
  activeTab.value = value;
  fetchContents(true);
};

const goDetail = (id) => {
  router.push(`/content/${id}`);
};

const goProduct = (id) => {
  router.push(`/product/${id}`);
};

const goPublish = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/content');
    return;
  }
  showToast('发布功能开发中');
};

const toggleFollow = async (item) => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/content');
    return;
  }
  
  try {
    const res = await contentApi.toggleFollow(item.user_id);
    if (res.code === 200) {
      item.isFollowing = res.data.isFollowing;
      showToast(res.data.isFollowing ? '关注成功' : '已取消关注');
    }
  } catch (e) {
    console.error(e);
  }
};

const likeContent = async (item) => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/content');
    return;
  }
  
  try {
    const res = await contentApi.likeContent(item.id);
    if (res.code === 200) {
      item.likes++;
      item.isLiked = true;
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
  
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight || window.innerHeight;
  
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    fetchContents();
  }
};

onMounted(() => {
  fetchContents(true);
  window.addEventListener('scroll', handleScroll);
});

onActivated(() => {
  fetchContents(true);
});
</script>

<style scoped>
.content {
  background: #f5f5f5;
  padding-bottom: 70px;
}

.header {
  position: sticky;
  top: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.publish-btn {
  font-size: 20px;
  padding: 4px;
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 52px;
  z-index: 99;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 14px;
  color: #666;
}

.tab.active {
  color: #ff5000;
  font-weight: bold;
}

.content-list {
  padding: 12px;
}

.content-card {
  margin-bottom: 12px;
  overflow: hidden;
}

.content-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.publish-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.follow-btn {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  border: none;
  background: #ff5000;
  color: #fff;
}

.follow-btn.followed {
  background: #f5f5f5;
  color: #999;
}

.content-body {
  padding: 0 16px 12px;
}

.content-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.5;
}

.content-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-media {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.content-media img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.video-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.product-section {
  padding: 12px 16px;
  background: #fafafa;
}

.product-header {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.product-list {
  display: flex;
  gap: 10px;
}

.product-item {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.product-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.product-info {
  padding: 8px;
}

.product-name {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
}

.product-price {
  font-size: 13px;
  color: #ff4d4f;
  font-weight: bold;
}

.content-footer {
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid #f5f5f5;
}

.action-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.action-item .icon {
  font-size: 18px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-state .icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state .text {
  color: #999;
  font-size: 14px;
}

.loading, .no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
