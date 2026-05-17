<template>
  <div class="page-container my-page">
    <div class="user-header">
      <div class="user-avatar">
        <van-icon name="user-o" size="36" />
      </div>
      <div class="user-info">
        <div class="user-name">{{ user?.nickname || '未登录' }}</div>
        <div class="user-phone">{{ user?.phone || '' }}</div>
      </div>
      <div class="edit-btn" @click="goToProfile">
        <van-icon name="edit" />
      </div>
    </div>
    
    <div class="stats-card card-shadow">
      <div class="stat-item" @click="goToBookings">
        <div class="stat-num">{{ stats.groupBookingCount + stats.coachBookingCount }}</div>
        <div class="stat-label">预约课程</div>
      </div>
      <div class="stat-item" @click="goToMyCards">
        <div class="stat-num">{{ stats.cardCount }}</div>
        <div class="stat-label">我的会员卡</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">¥{{ stats.totalSpent || 0 }}</div>
        <div class="stat-label">累计消费</div>
      </div>
    </div>
    
    <div class="menu-list card-shadow">
      <div class="menu-item" @click="goToBookings">
        <van-icon name="orders-o" color="#667eea" />
        <span>我的预约</span>
        <van-icon name="arrow" />
      </div>
      <div class="menu-item" @click="goToMyCards">
        <van-icon name="gift-o" color="#ff9800" />
        <span>我的会员卡</span>
        <van-icon name="arrow" />
      </div>
      <div class="menu-item">
        <van-icon name="coupon-o" color="#4caf50" />
        <span>我的优惠券</span>
        <van-icon name="arrow" />
      </div>
      <div class="menu-item" @click="goToProfile">
        <van-icon name="user-o" color="#2196f3" />
        <span>个人资料</span>
        <van-icon name="arrow" />
      </div>
    </div>
    
    <div class="menu-list card-shadow" v-if="isLoggedIn">
      <div class="menu-item logout" @click="handleLogout">
        <van-icon name="logout" color="#f44336" />
        <span>退出登录</span>
      </div>
    </div>
    
    <div class="login-prompt" v-if="!isLoggedIn" @click="goToLogin">
      <van-button type="primary" size="large" class="login-btn">
        立即登录
      </van-button>
    </div>
    
    <van-tabbar v-model:active="activeTabbar" active-color="#667eea">
      <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/group-classes" icon="orders-o">团课</van-tabbar-item>
      <van-tabbar-item to="/coaches" icon="user-o">私教</van-tabbar-item>
      <van-tabbar-item to="/cards" icon="gift-o">购卡</van-tabbar-item>
      <van-tabbar-item to="/my" icon="manager-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import request from '../../utils/request';

const router = useRouter();
const route = useRoute();
const activeTabbar = ref(route.path);
const user = ref(null);
const stats = ref({
  groupBookingCount: 0,
  coachBookingCount: 0,
  cardCount: 0,
  totalSpent: 0
});

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('fitlife_token');
});

async function fetchUserInfo() {
  if (!isLoggedIn.value) return;
  
  try {
    const res = await request.get('/user/profile');
    user.value = res.data;
  } catch (err) {
    console.error('获取用户信息失败:', err);
  }
}

async function fetchStats() {
  if (!isLoggedIn.value) return;
  
  try {
    const res = await request.get('/card/statistics');
    stats.value = res.data;
  } catch (err) {
    console.error('获取统计数据失败:', err);
  }
}

function goToLogin() {
  router.push('/login');
}

function goToProfile() {
  if (!isLoggedIn.value) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  router.push('/my/profile');
}

function goToBookings() {
  if (!isLoggedIn.value) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  router.push('/my/bookings');
}

function goToMyCards() {
  if (!isLoggedIn.value) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  router.push('/my/cards');
}

async function handleLogout() {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '确定要退出登录吗？'
    });
    
    localStorage.removeItem('fitlife_token');
    localStorage.removeItem('fitlife_user');
    user.value = null;
    showToast('已退出登录');
    router.push('/login');
  } catch (err) {
    if (err !== 'cancel') {
      console.error('退出失败:', err);
    }
  }
}

onMounted(() => {
  fetchUserInfo();
  fetchStats();
});
</script>

<style lang="less" scoped>
.my-page {
  background: #f5f7fa;
  
  .user-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 50px 20px 30px;
    display: flex;
    align-items: center;
    color: white;
    
    .user-avatar {
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }
    
    .user-info {
      flex: 1;
      
      .user-name {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .user-phone {
        font-size: 13px;
        opacity: 0.9;
      }
    }
    
    .edit-btn {
      padding: 8px;
    }
  }
  
  .stats-card {
    margin: -20px 16px 16px;
    display: flex;
    padding: 20px 0;
    position: relative;
    z-index: 1;
    
    .stat-item {
      flex: 1;
      text-align: center;
      
      .stat-num {
        font-size: 24px;
        font-weight: bold;
        color: #667eea;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #999;
      }
    }
  }
  
  .menu-list {
    margin: 0 16px 16px;
    padding: 0;
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #f5f5f5;
      font-size: 15px;
      color: #333;
      
      &:last-child {
        border-bottom: none;
      }
      
      .van-icon {
        margin-right: 12px;
        font-size: 20px;
      }
      
      span {
        flex: 1;
      }
      
      &.logout {
        color: #f44336;
        justify-content: center;
        
        .van-icon {
          margin-right: 8px;
        }
      }
    }
  }
  
  .login-prompt {
    padding: 30px 16px;
    
    .login-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 25px;
      height: 50px;
      font-size: 16px;
    }
  }
}
</style>
