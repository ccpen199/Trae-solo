<template>
  <div class="product-detail" v-if="product">
    <div class="back-header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">商品详情</span>
      <span class="share-btn">分享</span>
    </div>

    <div class="scroll-content">
      <div class="product-gallery">
        <img :src="product.cover_image" :alt="product.title" />
      </div>

      <div class="product-info card">
        <div class="price-row">
          <span class="price">¥{{ product.price }}</span>
          <span v-if="product.original_price" class="price-old">¥{{ product.original_price }}</span>
        </div>
        <h1 class="product-title">{{ product.title }}</h1>
        <div class="product-meta">
          <span>销量 {{ product.sales }}</span>
          <span>库存 {{ product.stock }}</span>
        </div>
      </div>

      <div class="shop-info card">
        <div class="shop-header">
          <div class="shop-avatar">🏪</div>
          <div class="shop-detail">
            <div class="shop-name">{{ product.shop_name }}</div>
            <div class="shop-desc">官方认证 · 品质保障</div>
          </div>
          <button class="btn btn-outline" @click="goChat">联系客服</button>
        </div>
      </div>

      <div class="tab-nav">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'detail' }"
          @click="activeTab = 'detail'"
        >商品</div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'comments' }"
          @click="activeTab = 'comments'"
        >评价 ({{ comments.length }})</div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'recommend' }"
          @click="activeTab = 'recommend'"
        >推荐</div>
      </div>

      <div v-if="activeTab === 'detail'" class="tab-content">
        <div class="detail-desc card">
          <h3>商品详情</h3>
          <p>{{ product.description }}</p>
          <div v-if="product.images" class="detail-images">
            <img v-for="(img, idx) in productImages" :key="idx" :src="img" />
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'comments'" class="tab-content">
        <div v-if="comments.length > 0" class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item card">
            <div class="comment-header">
              <img :src="comment.avatar" class="avatar" />
              <div class="user-info">
                <div class="nickname">{{ comment.nickname }}</div>
                <div class="rating">
                  <span v-for="i in 5" :key="i">⭐</span>
                </div>
              </div>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <div class="comment-time">{{ formatTime(comment.created_at) }}</div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="icon">💬</div>
          <div>暂无评价</div>
        </div>
      </div>

      <div v-if="activeTab === 'recommend'" class="tab-content">
        <div class="product-grid">
          <ProductCard 
            v-for="item in relatedProducts" 
            :key="item.id" 
            :product="item"
            @click="goDetail(item.id)"
          />
        </div>
      </div>
    </div>

    <div class="bottom-bar safe-area-bottom">
      <div class="action-left">
        <div class="action-item" @click="goHome">
          <span>🏠</span>
          <span>首页</span>
        </div>
        <div class="action-item" @click="toggleFavorite">
          <span>{{ product.isFavorite ? '❤️' : '🤍' }}</span>
          <span>收藏</span>
        </div>
        <div class="action-item" @click="goCart">
          <span>🛒</span>
          <span>购物车</span>
        </div>
      </div>
      <div class="action-right">
        <button class="btn-cart" @click="addToCart">加入购物车</button>
        <button class="btn-buy" @click="buyNow">立即购买</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { productApi, orderApi } from '../api';
import { useUserStore } from '../stores/user';
import ProductCard from '../components/ProductCard.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const showToast = inject('showToast');

const product = ref(null);
const comments = ref([]);
const relatedProducts = ref([]);
const activeTab = ref('detail');

const productImages = computed(() => {
  if (!product.value?.images) return [];
  return product.value.images.split(',').map(s => s.trim()).filter(Boolean);
});

const fetchProductDetail = async () => {
  try {
    const res = await productApi.getDetail(route.params.id);
    if (res.code === 200) {
      product.value = res.data;
      comments.value = res.data.comments || [];
      relatedProducts.value = res.data.relatedProducts || [];
    }
  } catch (e) {
    console.error(e);
  }
};

const goBack = () => {
  router.back();
};

const goHome = () => {
  router.push('/');
};

const goCart = () => {
  router.push('/cart');
};

const goChat = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  router.push(`/chat/${product.value?.shop_id || 1}`);
};

const goDetail = (id) => {
  if (id === parseInt(route.params.id)) return;
  router.push(`/product/${id}`);
  product.value = null;
  fetchProductDetail();
};

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  
  try {
    const res = await productApi.toggleFavorite(route.params.id);
    if (res.code === 200) {
      product.value.isFavorite = res.data.isFavorite;
      showToast(res.data.isFavorite ? '收藏成功' : '已取消收藏');
    }
  } catch (e) {
    console.error(e);
  }
};

const addToCart = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  
  try {
    const res = await orderApi.addToCart({
      productId: product.value.id,
      quantity: 1
    });
    if (res.code === 200) {
      showToast('已加入购物车');
    }
  } catch (e) {
    console.error(e);
    showToast(e.response?.data?.message || '添加失败');
  }
};

const buyNow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  
  try {
    const res = await orderApi.createOrder({
      items: [{ productId: product.value.id, quantity: 1 }],
      address: '北京市朝阳区xxx路xxx号',
      phone: '13800138000',
      receiver: '收货人'
    });
    if (res.code === 200) {
      showToast('下单成功');
      router.push(`/order/${res.data.orderId}`);
    }
  } catch (e) {
    console.error(e);
    showToast(e.response?.data?.message || '下单失败');
  }
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

onMounted(() => {
  fetchProductDetail();
});
</script>

<style scoped>
.product-detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.back-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
  border-bottom: 1px solid #eee;
}

.back-btn {
  font-size: 20px;
  color: #333;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.share-btn {
  font-size: 14px;
  color: #666;
}

.scroll-content {
  padding-top: 44px;
}

.product-gallery {
  width: 100%;
  background: #fff;
}

.product-gallery img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.product-info {
  padding: 16px;
  margin-bottom: 12px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.price {
  font-size: 24px;
  color: #ff4d4f;
  font-weight: bold;
}

.price-old {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.product-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  margin-bottom: 10px;
}

.product-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #999;
}

.shop-info {
  padding: 16px;
  margin-bottom: 12px;
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shop-avatar {
  width: 48px;
  height: 48px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.shop-detail {
  flex: 1;
}

.shop-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.shop-desc {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.tab-nav {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 44px;
  z-index: 99;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #ff5000;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: #ff5000;
}

.tab-content {
  padding: 12px;
}

.detail-desc {
  padding: 16px;
}

.detail-desc h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.detail-desc p {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}

.detail-images {
  margin-top: 16px;
}

.detail-images img {
  width: 100%;
  margin-bottom: 12px;
  border-radius: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  padding: 16px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 14px;
  color: #333;
}

.rating {
  font-size: 12px;
  margin-top: 2px;
}

.comment-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.comment-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #eee;
  z-index: 100;
}

.action-left {
  display: flex;
  gap: 20px;
  margin-right: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  color: #666;
}

.action-item span:first-child {
  font-size: 20px;
  margin-bottom: 2px;
}

.action-right {
  flex: 1;
  display: flex;
  gap: 10px;
}

.btn-cart, .btn-buy {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cart {
  background: #ffe8d9;
  color: #ff5000;
}

.btn-buy {
  background: linear-gradient(to right, #ff5000, #ff6b00);
  color: #fff;
}
</style>
