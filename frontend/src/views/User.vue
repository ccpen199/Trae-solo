<template>
  <div class="user">
    <div class="user-header">
      <div class="avatar-wrapper">
        <img :src="userInfo.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'" alt="avatar" class="avatar" />
      </div>
      <div class="user-info">
        <div class="nickname">{{ userInfo.nickname || '游客' }}</div>
        <div class="location">{{ userInfo.location || '北京市' }}</div>
      </div>
    </div>

    <van-cell-group inset class="order-group">
      <van-cell title="我的订单" is-link @click="goOrders">
        <template #right-icon>
          <span class="more-text">查看全部</span>
        </template>
      </van-cell>
      <div class="order-tabs">
        <div class="order-tab" @click="goOrders(1)">
          <van-icon name="pending-payment" size="24" />
          <span>待付款</span>
        </div>
        <div class="order-tab" @click="goOrders(2)">
          <van-icon name="todo-list" size="24" />
          <span>待消费</span>
        </div>
        <div class="order-tab" @click="goOrders(5)">
          <van-icon name="orders-o" size="24" />
          <span>已完成</span>
        </div>
        <div class="order-tab" @click="goCoupons">
          <van-icon name="coupon-o" size="24" />
          <span>优惠券</span>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group inset class="menu-group">
      <van-cell title="我的信息" is-link @click="editInfo" />
      <van-cell title="收货地址" is-link />
      <van-cell title="联系客服" is-link />
      <van-cell title="关于我们" is-link />
    </van-cell-group>

    <div class="logout-btn" v-if="localStorage.getItem('token')" @click="logout">
      <van-button block type="danger" plain>退出登录</van-button>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { showToast } from 'vant';
import TabBar from '@/components/TabBar.vue';

const router = useRouter();
const userStore = useUserStore();
const userInfo = ref({});

const getUserInfo = async () => {
  if (!localStorage.getItem('token')) {
    router.push('/login');
    return;
  }
  try {
    const res = await userStore.getUserInfo();
    userInfo.value = res;
  } catch (e) {
    console.error('获取用户信息失败', e);
  }
};

const goOrders = (status) => {
  if (!localStorage.getItem('token')) {
    router.push('/login');
    return;
  }
  router.push(status ? `/orders?status=${status}` : '/orders');
};

const goCoupons = () => {
  router.push('/coupons');
};

const editInfo = () => {
  showToast('功能开发中');
};

const logout = () => {
  userStore.logout();
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  showToast('已退出登录');
  router.replace('/login');
};

onMounted(() => {
  getUserInfo();
});
</script>

<style scoped lang="less">
.user {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.user-header {
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
  padding: 40px 20px 30px;
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  margin-right: 15px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.user-info {
  color: #fff;
}

.nickname {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.location {
  font-size: 13px;
  opacity: 0.9;
}

.order-group {
  margin-top: 10px;
}

.more-text {
  font-size: 13px;
  color: #999;
}

.order-tabs {
  display: flex;
  padding: 15px 0;
}

.order-tab {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: #666;

  .van-icon {
    display: block;
    margin-bottom: 5px;
    color: #333;
  }
}

.menu-group {
  margin-top: 10px;
}

.logout-btn {
  padding: 20px 15px;
}
</style>
