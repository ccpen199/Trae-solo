<template>
  <div class="coupons">
    <van-nav-bar title="优惠券" left-arrow @click-left="goBack" fixed placeholder />

    <van-tabs v-model:active="activeTab">
      <van-tab title="可使用" name="0" />
      <van-tab title="已使用" name="1" />
      <van-tab title="已过期" name="2" />
    </van-tabs>

    <div class="coupon-list">
      <div class="coupon-item" v-for="coupon in coupons" :key="coupon.id">
        <div class="coupon-left">
          <div class="coupon-value">
            <span class="symbol">¥</span>{{ coupon.value }}
          </div>
          <div class="coupon-condition">满{{ coupon.min_amount }}可用</div>
        </div>
        <div class="coupon-right">
          <div class="coupon-name">{{ coupon.name }}</div>
          <div class="coupon-time">有效期至长期有效</div>
          <van-button type="primary" size="small" plain v-if="activeTab === '0'" @click="useCoupon">
            去使用
          </van-button>
        </div>
      </div>
    </div>

    <div class="empty" v-if="coupons.length === 0">
      <van-empty description="暂无优惠券" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import request from '@/utils/request';

const router = useRouter();
const activeTab = ref('0');
const coupons = ref([]);

const getCoupons = async () => {
  try {
    const statusMap = { '0': 0, '1': 1, '2': 2 };
    const res = await request.get('/user/coupons', { 
      params: { status: statusMap[activeTab.value] } 
    });
    coupons.value = res || [];
  } catch (e) {
    console.error('获取优惠券失败', e);
  }
};

const useCoupon = () => {
  router.push('/home');
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  getCoupons();
});
</script>

<style scoped lang="less">
.coupons {
  min-height: 100vh;
  background: #f5f5f5;
}

.coupon-list {
  padding: 10px;
}

.coupon-item {
  display: flex;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.coupon-left {
  width: 100px;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
  color: #fff;
  padding: 15px 10px;
  text-align: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f5f5f5;
  }
}

.coupon-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  .symbol {
    font-size: 14px;
  }
}

.coupon-condition {
  font-size: 11px;
  opacity: 0.9;
  margin-top: 5px;
}

.coupon-right {
  flex: 1;
  padding: 15px;
  position: relative;
}

.coupon-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 5px;
}

.coupon-time {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.empty {
  padding-top: 100px;
}
</style>
