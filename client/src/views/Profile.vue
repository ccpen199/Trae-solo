<template>
  <div class="profile page-container">
    <div class="profile-header" :class="{ 'logged-in': userStore.isLoggedIn }">
      <div v-if="userStore.isLoggedIn" class="user-info">
        <img :src="userStore.userInfo?.avatar" class="avatar" />
        <div class="user-detail">
          <div class="nickname">{{ userStore.userInfo?.nickname }}</div>
          <div class="username">@{{ userStore.userInfo?.username }}</div>
        </div>
        <div class="setting-btn" @click="goSetting">⚙️</div>
      </div>
      <div v-else class="guest-info" @click="goLogin">
        <div class="avatar-guest">👤</div>
        <div class="login-prompt">点我登录</div>
      </div>
    </div>

    <div v-if="userStore.isLoggedIn" class="stats-card card">
      <div class="stat-item" @click="goOrders(0)">
        <div class="stat-num">{{ profile?.orderCount || 0 }}</div>
        <div class="stat-label">全部订单</div>
      </div>
      <div class="stat-item" @click="goOrders(0)">
        <div class="stat-num">{{ profile?.favoriteCount || 0 }}</div>
        <div class="stat-label">我的收藏</div>
      </div>
      <div class="stat-item" @click="goCart">
        <div class="stat-num">{{ profile?.cartCount || 0 }}</div>
        <div class="stat-label">购物车</div>
      </div>
    </div>

    <div class="order-card card">
      <div class="card-header">
        <span class="card-title">我的订单</span>
        <span class="view-all" @click="goOrders()">查看全部 →</span>
      </div>
      <div class="order-status">
        <div class="status-item" @click="goOrders(0)">
          <span class="status-icon">💳</span>
          <span class="status-text">待付款</span>
        </div>
        <div class="status-item" @click="goOrders(1)">
          <span class="status-icon">📦</span>
          <span class="status-text">待发货</span>
        </div>
        <div class="status-item" @click="goOrders(2)">
          <span class="status-icon">🚚</span>
          <span class="status-text">待收货</span>
        </div>
        <div class="status-item" @click="goOrders(3)">
          <span class="status-icon">✅</span>
          <span class="status-text">已完成</span>
        </div>
        <div class="status-item" @click="goMessage">
          <span class="status-icon">💬</span>
          <span class="status-text">消息</span>
        </div>
      </div>
    </div>

    <div class="menu-card card">
      <div class="menu-item" @click="goFavorites">
        <span class="menu-icon">❤️</span>
        <span class="menu-text">我的收藏</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="goCart">
        <span class="menu-icon">🛒</span>
        <span class="menu-text">购物车</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="goOrders()">
        <span class="menu-icon">📋</span>
        <span class="menu-text">全部订单</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="goMessage">
        <span class="menu-icon">💬</span>
        <span class="menu-text">消息中心</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="goFollows">
        <span class="menu-icon">👥</span>
        <span class="menu-text">我的关注</span>
        <span class="menu-arrow">›</span>
      </div>
    </div>

    <div class="menu-card card">
      <div class="menu-item" @click="showAbout">
        <span class="menu-icon">ℹ️</span>
        <span class="menu-text">关于我们</span>
        <span class="menu-arrow">›</span>
      </div>
      <div class="menu-item" @click="showHelp">
        <span class="menu-icon">❓</span>
        <span class="menu-text">帮助中心</span>
        <span class="menu-arrow">›</span>
      </div>
    </div>

    <div v-if="userStore.isLoggedIn" class="logout-section">
      <button class="btn btn-outline logout-btn" @click="handleLogout">退出登录</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { userApi } from '../api';

const router = useRouter();
const userStore = useUserStore();
const showToast = inject('showToast');

const profile = ref(null);

const fetchProfile = async () => {
  if (!userStore.isLoggedIn) return;
  try {
    const res = await userApi.getProfile();
    if (res.code === 200) {
      profile.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const goLogin = () => {
  router.push('/login?redirect=/profile');
};

const goSetting = () => {
  showToast('设置功能开发中');
};

const goOrders = (status) => {
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  if (status !== undefined) {
    router.push(`/order?status=${status}`);
  } else {
    router.push('/order');
  }
};

const goCart = () => {
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  router.push('/cart');
};

const goFavorites = () => {
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  router.push('/favorites');
};

const goMessage = () => {
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  router.push('/message');
};

const goFollows = () => {
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  showToast('关注列表功能开发中');
};

const showAbout = () => {
  showToast('淘宝商城 v1.0.0');
};

const showHelp = () => {
  showToast('帮助中心功能开发中');
};

const handleLogout = () => {
  userStore.logout();
  showToast('已退出登录');
};

onMounted(() => {
  fetchProfile();
});

onActivated(() => {
  fetchProfile();
});
</script>

<style scoped>
.profile {
  background: #f5f5f5;
  padding-bottom: 70px;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 50px;
  color: #fff;
}

.profile-header.logged-in {
  background: linear-gradient(135deg, #ff5000 0%, #ff6b00 100%);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.user-detail {
  flex: 1;
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.username {
  font-size: 13px;
  opacity: 0.8;
}

.setting-btn {
  font-size: 24px;
  padding: 8px;
}

.guest-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-guest {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.login-prompt {
  font-size: 16px;
  font-weight: 500;
}

.stats-card {
  margin: -30px 16px 16px;
  padding: 20px 12px;
  display: flex;
  position: relative;
  z-index: 10;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-num {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.order-card, .menu-card {
  margin: 12px 16px;
  padding: 0;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.card-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.view-all {
  font-size: 13px;
  color: #999;
}

.order-status {
  display: flex;
  padding: 16px 8px;
}

.status-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 28px;
}

.status-text {
  font-size: 12px;
  color: #666;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 20px;
  margin-right: 12px;
}

.menu-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.menu-arrow {
  color: #ccc;
  font-size: 18px;
}

.logout-section {
  padding: 24px 16px;
}

.logout-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
}
</style>
