<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <div class="user-info" v-if="userStore.isLoggedIn" @click="goLogin">
          <div class="avatar">
            <img :src="userStore.userInfo?.avatar || defaultAvatar" alt="头像" />
          </div>
          <div class="info-text">
            <div class="nickname">{{ userStore.userInfo?.nickname || '用户' + userStore.userInfo?.phone?.slice(-4) }}</div>
            <div class="phone">{{ userStore.userInfo?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '' }}</div>
          </div>
          <van-icon name="arrow" size="14" color="#fff" />
        </div>
        <div class="login-prompt" v-else @click="goLogin">
          <div class="avatar-placeholder">
            <van-icon name="user-o" size="32" color="#fff" />
          </div>
          <div class="login-text">点击登录</div>
        </div>
      </div>
    </div>

    <div class="user-assets" v-if="userStore.isLoggedIn">
      <div class="assets-item" @click="goWallet">
        <div class="assets-value">¥{{ userStore.userInfo?.balance || 0 }}</div>
        <div class="assets-label">钱包余额</div>
      </div>
      <div class="assets-item" @click="goCoupons">
        <div class="assets-value">{{ couponCount }}</div>
        <div class="assets-label">优惠券</div>
      </div>
      <div class="assets-item" @click="goPointsExchange">
        <div class="assets-value">{{ userStore.userInfo?.points || 0 }}</div>
        <div class="assets-label">积分</div>
      </div>
      <div class="assets-item" @click="goPointsExchange">
        <div class="assets-value">{{ userStore.userInfo?.yijie_coins || 0 }}</div>
        <div class="assets-label">易捷币</div>
      </div>
    </div>

    <div class="order-section" v-if="userStore.isLoggedIn">
      <div class="section-header" @click="goOrders">
        <span class="section-title">我的订单</span>
        <span class="section-more">
          全部订单
          <van-icon name="arrow" size="12" color="#969799" />
        </span>
      </div>
      <div class="order-tabs">
        <div class="tab-item" @click="goOrders('pending')">
          <van-icon name="pending-payment" size="24" color="#ff9f43" />
          <span class="tab-text">待支付</span>
        </div>
        <div class="tab-item" @click="goOrders('processing')">
          <van-icon name="notes-o" size="24" color="#4ecdc4" />
          <span class="tab-text">进行中</span>
        </div>
        <div class="tab-item" @click="goOrders('completed')">
          <van-icon name="checked" size="24" color="#56ab2f" />
          <span class="tab-text">已完成</span>
        </div>
        <div class="tab-item" @click="goOrders('refund')">
          <van-icon name="logistics" size="24" color="#ff6b6b" />
          <span class="tab-text">退款/售后</span>
        </div>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-group">
        <div class="menu-item" @click="goFuelOrders">
          <div class="menu-left">
            <van-icon name="new-fire-o" size="20" color="#ff9f43" />
            <span class="menu-text">加油记录</span>
          </div>
          <van-icon name="arrow" size="14" color="#969799" />
        </div>
        <div class="menu-item" @click="goFavorites">
          <div class="menu-left">
            <van-icon name="star-o" size="20" color="#ff6b6b" />
            <span class="menu-text">我的收藏</span>
          </div>
          <van-icon name="arrow" size="14" color="#969799" />
        </div>
        <div class="menu-item" @click="goVehicles">
          <div class="menu-left">
            <van-icon name="car" size="20" color="#1989fa" />
            <span class="menu-text">车牌管理</span>
          </div>
          <van-icon name="arrow" size="14" color="#969799" />
        </div>
      </div>

      <div class="menu-group">
        <div class="menu-item" @click="goInvite">
          <div class="menu-left">
            <van-icon name="gift-o" size="20" color="#f5576c" />
            <span class="menu-text">推荐有奖</span>
          </div>
          <van-icon name="arrow" size="14" color="#969799" />
        </div>
        <div class="menu-item" @click="goCoupons">
          <div class="menu-left">
            <van-icon name="new-coupon-o" size="20" color="#56ab2f" />
            <span class="menu-text">优惠券</span>
          </div>
          <van-icon name="arrow" size="14" color="#969799" />
        </div>
        <div class="menu-item" @click="goPointsExchange">
          <div class="menu-left">
            <van-icon name="gold-coin-o" size="20" color="#ffc107" />
            <span class="menu-text">积分兑换</span>
          </div>
          <van-icon name="arrow" size="14" color="#969799" />
        </div>
      </div>

      <div class="menu-group" v-if="userStore.isLoggedIn">
        <div class="menu-item" @click="goSettings">
          <div class="menu-left">
            <van-icon name="setting-o" size="20" color="#646566" />
            <span class="menu-text">设置</span>
          </div>
          <van-icon name="arrow" size="14" color="#969799" />
        </div>
        <div class="menu-item" @click="handleLogout">
          <div class="menu-left">
            <van-icon name="sign-out" size="20" color="#ee0a24" />
            <span class="menu-text">退出登录</span>
          </div>
          <van-icon name="arrow" size="14" color="#969799" />
        </div>
      </div>
    </div>

    <van-tabbar v-model="activeTab" class="tab-bar">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" :badge="cartCount" to="/cart">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>

    <van-dialog
      v-model:show="showLogoutDialog"
      title="提示"
      message="确定要退出登录吗？"
      show-cancel-button
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getCart } from '../../api/product'
import { getCoupons } from '../../api/user'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(3)
const cartCount = ref(0)
const couponCount = ref(0)
const showLogoutDialog = ref(false)
const defaultAvatar = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20placeholder%20blue&image_size=square'

const goLogin = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
}

const goWallet = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/wallet')
}

const goCoupons = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/coupons')
}

const goPointsExchange = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/points-exchange')
}

const goOrders = (status) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (status) {
    router.push({ path: '/orders', query: { status } })
  } else {
    router.push('/orders')
  }
}

const goFuelOrders = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  showToast('加油记录页面开发中')
}

const goFavorites = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  showToast('我的收藏页面开发中')
}

const goVehicles = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  showToast('车牌管理页面开发中')
}

const goInvite = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/invite')
}

const goSettings = () => {
  showToast('设置页面开发中')
}

const handleLogout = () => {
  showLogoutDialog.value = true
}

const confirmLogout = () => {
  userStore.logout()
  showToast('已退出登录')
}

const fetchCartCount = async () => {
  if (!userStore.isLoggedIn) {
    cartCount.value = 0
    return
  }
  try {
    const res = await getCart()
    cartCount.value = res.data.total_count || 0
  } catch (error) {
    console.error('获取购物车数量失败:', error)
  }
}

const fetchCouponCount = async () => {
  if (!userStore.isLoggedIn) {
    couponCount.value = 0
    return
  }
  try {
    const res = await getCoupons({ status: 'unused' })
    couponCount.value = res.data.total || 0
  } catch (error) {
    console.error('获取优惠券数量失败:', error)
  }
}

onMounted(() => {
  fetchCartCount()
  fetchCouponCount()
})

onActivated(() => {
  fetchCartCount()
  fetchCouponCount()
})
</script>

<style lang="less" scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.profile-header {
  position: relative;
  padding: 20px 16px 60px;
  background: linear-gradient(180deg, #1989fa, #409eff);

  .header-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: #f5f5f5;
    border-radius: 40px 40px 0 0;
  }

  .header-content {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;

      .avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, 0.5);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .info-text {
        flex: 1;
        margin-left: 16px;

        .nickname {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }

        .phone {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }

    .login-prompt {
      display: flex;
      align-items: center;
      cursor: pointer;

      .avatar-placeholder {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .login-text {
        margin-left: 16px;
        font-size: 18px;
        font-weight: 600;
        color: #fff;
      }
    }
  }
}

.user-assets {
  display: flex;
  background: #fff;
  margin: -40px 12px 12px;
  padding: 16px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .assets-item {
    flex: 1;
    text-align: center;
    cursor: pointer;

    .assets-value {
      font-size: 18px;
      font-weight: 600;
      color: #323233;
      margin-bottom: 4px;
    }

    .assets-label {
      font-size: 12px;
      color: #969799;
    }
  }
}

.order-section {
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px;
  border-radius: 12px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    cursor: pointer;

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #323233;
    }

    .section-more {
      font-size: 13px;
      color: #969799;
    }
  }

  .order-tabs {
    display: flex;
    justify-content: space-around;

    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;

      .tab-text {
        margin-top: 8px;
        font-size: 12px;
        color: #646566;
      }
    }
  }
}

.menu-section {
  background: #fff;
  margin: 0 12px;
  border-radius: 12px;

  .menu-group {
    padding: 0 16px;
    border-bottom: 8px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #f7f8fa;
      cursor: pointer;

      &:last-child {
        border-bottom: none;
      }

      .menu-left {
        display: flex;
        align-items: center;

        .menu-text {
          margin-left: 12px;
          font-size: 14px;
          color: #323233;
        }
      }
    }
  }
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
