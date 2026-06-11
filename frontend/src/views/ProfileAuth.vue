<template>
  <div class="profile-auth page-container">
    <div class="auth-header">
      <div class="auth-icon">
        <van-icon name="idcard-o" size="48" />
      </div>
      <div class="auth-title">电子社保卡</div>
      <div class="auth-subtitle">国家政务服务平台统一签发</div>
    </div>

    <div class="card-section">
      <div class="card-bg">
        <div class="card-top">
          <div class="card-logo">
            <van-icon name="shield-o" size="24" />
            <span>电子社保卡</span>
          </div>
          <div class="card-level">{{ authLevelText }}</div>
        </div>
        <div class="card-info">
          <div class="card-name">{{ userStore.userInfo?.real_name }}</div>
          <div class="card-id">{{ maskedIdCard }}</div>
        </div>
        <div class="card-bottom">
          <div class="card-item">
            <div class="item-label">社会保障号</div>
            <div class="item-value">{{ userStore.userInfo?.id_card || '**** **** **** ****' }}</div>
          </div>
          <div class="card-item">
            <div class="item-label">发卡地区</div>
            <div class="item-value">{{ userStore.userInfo?.province || '北京市' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="auth-status card">
      <div class="status-item">
        <van-icon name="checked" size="20" color="#07c160" />
        <div class="status-text">
          <div class="status-title">实名认证</div>
          <div class="status-desc">已通过国家政务平台认证</div>
        </div>
        <van-tag type="success">已完成</van-tag>
      </div>
      <div class="status-divider"></div>
      <div class="status-item">
        <van-icon :name="authStatus === 'stepup' ? 'checked' : 'circle-o'" size="20" :color="authStatus === 'stepup' ? '#07c160' : '#c8c9cc'" />
        <div class="status-text">
          <div class="status-title">二次认证</div>
          <div class="status-desc">指纹/面部识别增强认证</div>
        </div>
        <van-tag :type="authStatus === 'stepup' ? 'success' : 'warning'" @click="router.push('/profile/stepup')">
          {{ authStatus === 'stepup' ? '已完成' : '去认证' }}
        </van-tag>
      </div>
    </div>

    <div class="menu-section">
      <div class="section-title">卡服务</div>
      <van-cell-group inset>
        <van-cell title="修改密码" is-link @click="showToast('功能开发中')">
          <template #icon><van-icon name="lock" /></template>
        </van-cell>
        <van-cell title="挂失补办" is-link @click="showToast('功能开发中')">
          <template #icon><van-icon name="orders-o" /></template>
        </van-cell>
        <van-cell title="使用记录" is-link @click="router.push('/profile/records')">
          <template #icon><van-icon name="bar-chart-o" /></template>
        </van-cell>
        <van-cell title="领卡状态" is-link @click="showToast('功能开发中')">
          <template #icon><van-icon name="card-o" /></template>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const maskedIdCard = computed(() => {
  const id = userStore.userInfo?.id_card;
  if (!id) return '**** **** **** ****';
  return id.slice(0, 4) + ' **** **** ' + id.slice(-4);
});

const authLevelText = computed(() => {
  const level = userStore.userInfo?.auth_level || 1;
  return level >= 2 ? 'L2 实人认证' : 'L1 基础认证';
});

const authStatus = computed(() => {
  const level = userStore.userInfo?.auth_level || 1;
  if (level >= 3) return 'stepup';
  return 'basic';
});
</script>

<style scoped>
.profile-auth {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

.auth-header {
  background: linear-gradient(135deg, #1989fa 0%, #007dff 100%);
  padding: 40px 20px;
  text-align: center;
  color: #fff;
}

.auth-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.auth-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
}

.auth-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.card-section {
  margin: -30px 16px 16px;
  position: relative;
  z-index: 10;
}

.card-bg {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 16px;
  padding: 20px;
  color: #333;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.card-level {
  background: rgba(0, 0, 0, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.card-info {
  margin-bottom: 24px;
}

.card-name {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 4px;
}

.card-id {
  font-size: 14px;
  opacity: 0.8;
  letter-spacing: 2px;
}

.card-bottom {
  display: flex;
  gap: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.card-item {
  flex: 1;
}

.item-label {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.item-value {
  font-size: 14px;
  font-weight: 500;
}

.auth-status {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.status-divider {
  height: 1px;
  background: #ebedf0;
}

.status-text {
  flex: 1;
}

.status-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 2px;
}

.status-desc {
  font-size: 12px;
  color: #969799;
}

.section-title {
  font-size: 13px;
  color: #969799;
  padding: 12px 16px 8px;
}

.menu-section {
  margin-bottom: 16px;
}
</style>
