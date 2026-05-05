<template>
  <div class="profile-page page-container">
    <div class="profile-header" v-if="userStore.isLoggedIn">
      <div class="user-info flex">
        <van-image 
          :src="userStore.userInfo.avatar || 'https://img01.yzcdn.cn/vant/cat.jpeg'"
          round
          width="64"
          height="64"
        />
        <div class="user-detail flex-1">
          <div class="nickname">{{ userStore.userInfo.nickname || userStore.userInfo.phone }}</div>
          <div class="member-badge" v-if="userStore.userInfo.vip_type === 1">
            <van-icon name="gift-o" /> 优享会员
          </div>
          <div class="member-badge normal" v-else>
            普通会员
          </div>
        </div>
        <van-icon name="arrow" color="#fff" />
      </div>
      
      <div class="member-rights" v-if="userStore.userInfo.vip_type === 1">
        <div class="rights-item">
          <div class="rights-value">{{ userStore.userInfo.points || 0 }}</div>
          <div class="rights-label">积分</div>
        </div>
        <div class="rights-item">
          <div class="rights-value">会员价</div>
          <div class="rights-label">专享优惠</div>
        </div>
        <div class="rights-item">
          <div class="rights-value">积分加倍</div>
          <div class="rights-label">购物特权</div>
        </div>
      </div>
      
      <van-button 
        v-if="userStore.userInfo.vip_type !== 1"
        type="warning"
        round
        size="large"
        class="become-vip-btn"
        @click="becomeVip"
      >
        开通优享会员
      </van-button>
    </div>
    
    <div class="profile-header login-btn-section" v-else @click="goLogin">
      <div class="login-placeholder flex">
        <van-icon name="user-o" size="32" color="#fff" />
        <div class="login-text">点击登录</div>
      </div>
    </div>
    
    <div class="order-section bg-white rounded-8 mt-12 mx-12">
      <div class="section-header flex-between" @click="goOrders">
        <span class="title">我的订单</span>
        <span class="more">
          全部订单
          <van-icon name="arrow" />
        </span>
      </div>
      <div class="order-menus">
        <div class="menu-item" @click="goOrdersWithStatus(0)">
          <van-icon name="pending-payment" size="24" />
          <span class="menu-text">待支付</span>
        </div>
        <div class="menu-item" @click="goOrdersWithStatus(2)">
          <van-icon name="deliver" size="24" />
          <span class="menu-text">配送中</span>
        </div>
        <div class="menu-item" @click="goOrdersWithStatus(3)">
          <van-icon name="description" size="24" />
          <span class="menu-text">已完成</span>
        </div>
        <div class="menu-item">
          <van-icon name="after-sale" size="24" />
          <span class="menu-text">售后</span>
        </div>
      </div>
    </div>
    
    <div class="service-section bg-white rounded-8 mt-12 mx-12">
      <div class="section-header">
        <span class="title">我的服务</span>
      </div>
      <div class="service-menus">
        <div class="service-item" @click="goAddress">
          <van-icon name="location" size="22" color="#FF4D4F" />
          <span class="service-text">收货地址</span>
        </div>
        <div class="service-item" @click="checkLoginThenGo('/message')">
          <van-icon name="chat" size="22" color="#1890FF" />
          <span class="service-text">消息中心</span>
        </div>
        <div class="service-item" @click="checkLoginThenGo('/coupon')">
          <van-icon name="coupon" size="22" color="#FAAD14" />
          <span class="service-text">我的优惠券</span>
        </div>
        <div class="service-item" @click="checkLoginThenGo('/points')">
          <van-icon name="gold-coin-o" size="22" color="#FFD700" />
          <span class="service-text">积分商城</span>
        </div>
        <div class="service-item" @click="checkLoginThenGo('/invite')">
          <van-icon name="friends" size="22" color="#52C41A" />
          <span class="service-text">邀请有礼</span>
        </div>
        <div class="service-item" @click="checkLoginThenGo('/help')">
          <van-icon name="service" size="22" color="#FF6B35" />
          <span class="service-text">帮助中心</span>
        </div>
        <div class="service-item" @click="checkLoginThenGo('/customer')">
          <van-icon name="phone" size="22" color="#722ED1" />
          <span class="service-text">
            专属客服
            <span class="vip-tag" v-if="userStore.userInfo.vip_type === 1">VIP</span>
          </span>
        </div>
        <div class="service-item" @click="checkLoginThenGo('/community')">
          <van-icon name="apps-o" size="22" color="#13C2C2" />
          <span class="service-text">吃什么社区</span>
        </div>
      </div>
    </div>
    
    <van-cell-group v-if="userStore.isLoggedIn" class="setting-group mt-12 mx-12">
      <van-cell title="设置" is-link @click="goSettings" />
      <van-cell title="关于我们" is-link />
    </van-cell-group>
    
    <van-button 
      v-if="userStore.isLoggedIn"
      type="danger"
      plain
      round
      block
      class="logout-btn"
      @click="handleLogout"
    >
      退出登录
    </van-button>
    
    <van-tabbar v-model:active="activeTab">
      <van-tabbar-item icon="home-o" @click="router.push('/')">首页</van-tabbar-item>
      <van-tabbar-item icon="search" @click="router.push('/search')">搜索</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" @click="router.push('/cart')">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { useUserStore } from '@/stores/user';
import request from '@/utils/axios';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref(3);

const goLogin = () => {
  router.push('/login');
};

const goOrders = () => {
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  router.push('/order');
};

const goOrdersWithStatus = (status) => {
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  router.push('/order');
};

const goAddress = () => {
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  router.push('/address');
};

const goSettings = () => {
  router.push('/settings');
};

const checkLoginThenGo = (path) => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录');
    goLogin();
    return;
  }
  router.push(path);
};

const becomeVip = async () => {
  try {
    await showConfirmDialog({
      title: '开通优享会员',
      message: '确认开通优享会员，享受会员价、积分加倍等特权？'
    });
    
    const res = await request.post('/user/become-vip');
    userStore.setUserInfo(res.data);
    showToast('开通成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('开通会员失败:', error);
      showToast('开通失败');
    }
  }
};

const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要退出登录吗？'
    });
    
    userStore.logout();
    showToast('已退出登录');
    router.push('/');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出登录失败:', error);
    }
  }
};
</script>

<style lang="less" scoped>
.profile-page {
  padding-bottom: 50px;
  background: #f5f5f5;
}

.profile-header {
  background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
  padding: 44px 16px 24px;
  
  .user-info {
    align-items: center;
    gap: 12px;
    
    .user-detail {
      .nickname {
        font-size: 18px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 6px;
      }
      
      .member-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: rgba(255, 215, 0, 0.2);
        border-radius: 4px;
        font-size: 12px;
        color: #FFD700;
        
        &.normal {
          background: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }
  
  .member-rights {
    display: flex;
    margin-top: 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px;
    
    .rights-item {
      flex: 1;
      text-align: center;
      
      .rights-value {
        font-size: 16px;
        font-weight: 600;
        color: #FFD700;
        margin-bottom: 4px;
      }
      
      .rights-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
  
  .become-vip-btn {
    width: 100%;
    margin-top: 16px;
    height: 44px;
    font-size: 15px;
    font-weight: 600;
  }
  
  &.login-btn-section {
    min-height: 120px;
    display: flex;
    align-items: center;
    
    .login-placeholder {
      align-items: center;
      gap: 12px;
      
      .login-text {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
      }
    }
  }
}

.section-header {
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  
  .title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }
  
  .more {
    font-size: 13px;
    color: #999;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.order-menus {
  display: flex;
  padding: 16px 0;
  
  .menu-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    
    .menu-text {
      font-size: 12px;
      color: #666;
    }
  }
}

.service-menus {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 0;
  
  .service-item {
    width: 25%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    
    .service-text {
      font-size: 12px;
      color: #333;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      
      .vip-tag {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: #fff;
        font-size: 10px;
        padding: 1px 4px;
        border-radius: 2px;
      }
    }
  }
}

.setting-group {
  border-radius: 8px;
  overflow: hidden;
}

.logout-btn {
  margin: 24px 16px;
  height: 44px;
}

:deep(.van-tabbar) {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
</style>
