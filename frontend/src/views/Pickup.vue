<template>
  <div class="pickup">
    <van-nav-bar title="自提码" left-arrow @click-left="goBack" fixed placeholder />

    <div class="pickup-card" v-if="pickupInfo">
      <div class="qrcode-area">
        <div class="qrcode-placeholder">
          <van-icon name="qr" size="80" />
        </div>
        <div class="qrcode-tip">向店员出示二维码</div>
      </div>

      <div class="code-area">
        <div class="code-label">自提码</div>
        <div class="code-value">{{ pickupInfo.pickupCode }}</div>
      </div>

      <div class="order-info">
        <div class="info-item">
          <span class="label">订单号</span>
          <span class="value">{{ pickupInfo.orderNo }}</span>
        </div>
      </div>

      <div class="notice">
        <div class="notice-title">温馨提示</div>
        <ul class="notice-list">
          <li>请在有效期内到店使用</li>
          <li>到店后出示此二维码或自提码</li>
          <li>如有问题请联系客服</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import request from '@/utils/request';

const router = useRouter();
const route = useRoute();
const pickupInfo = ref(null);

const getPickupInfo = async () => {
  const id = route.params.id;
  try {
    const res = await request.get(`/orders/${id}/pickup`);
    pickupInfo.value = res;
  } catch (e) {
    console.error('获取自提码失败', e);
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  getPickupInfo();
});
</script>

<style scoped lang="less">
.pickup {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 10px;
}

.pickup-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.qrcode-area {
  padding: 40px 20px 20px;
  text-align: center;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
}

.qrcode-placeholder {
  width: 160px;
  height: 160px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff6b35;
}

.qrcode-tip {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-top: 15px;
}

.code-area {
  padding: 25px 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.code-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.code-value {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  letter-spacing: 4px;
}

.order-info {
  padding: 15px 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;

  .label {
    color: #666;
  }

  .value {
    color: #333;
    font-family: monospace;
  }
}

.notice {
  padding: 20px;
  background: #fff8f5;
}

.notice-title {
  font-size: 15px;
  font-weight: 600;
  color: #ff6b35;
  margin-bottom: 10px;
}

.notice-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}
</style>
