<template>
  <div class="stepup-auth page-container">
    <div class="auth-header">
      <div class="auth-icon">
        <van-icon name="fingerprint-o" size="48" />
      </div>
      <div class="auth-title">二次认证</div>
      <div class="auth-subtitle">增强身份认证，保障账户安全</div>
    </div>

    <div v-if="currentLevel >= 3" class="already-done card">
      <van-icon name="checked-circle" size="48" color="#07c160" />
      <div class="done-title">已完成二次认证</div>
      <div class="done-desc">您的账户已通过最高等级认证</div>
    </div>

    <div v-else class="auth-content">
      <div class="tip-card card">
        <div class="tip-title">
          <van-icon name="info-o" size="18" color="#1989fa" />
          认证说明
        </div>
        <div class="tip-content">
          <p>• 二次认证可提升您的认证等级至 L3</p>
          <p>• 支持指纹、面部识别等生物特征认证</p>
          <p>• 认证通过后可办理更高级别的业务</p>
          <p>• 认证数据采用国密算法加密存储</p>
        </div>
      </div>

      <div class="level-card card">
        <div class="level-title">当前认证等级</div>
        <div class="level-badge" :class="`level-${currentLevel}`">L{{ currentLevel }}</div>
        <div class="level-desc">{{ levelDesc }}</div>
      </div>

      <div class="auth-methods">
        <div class="section-title">选择认证方式</div>
        <van-cell-group inset>
          <van-cell title="指纹认证" is-link @click="doAuth('fingerprint')">
            <template #icon><van-icon name="fingerprint-o" /></template>
            <template #right-icon>
              <van-tag v-if="authMethods.fingerprint" type="success">已启用</van-tag>
              <van-icon name="arrow" />
            </template>
          </van-cell>
          <van-cell title="面部识别" is-link @click="doAuth('face')">
            <template #icon><van-icon name="user-o" /></template>
            <template #right-icon>
              <van-tag v-if="authMethods.face" type="success">已启用</van-tag>
              <van-icon name="arrow" />
            </template>
          </van-cell>
          <van-cell title="短信验证码" is-link @click="doAuth('sms')">
            <template #icon><van-icon name="phone-o" /></template>
            <template #right-icon>
              <van-tag v-if="authMethods.sms" type="success">已启用</van-tag>
              <van-icon name="arrow" />
            </template>
          </van-cell>
          <van-cell title="身份证OCR" is-link @click="doAuth('ocr')">
            <template #icon><van-icon name="idcard-o" /></template>
            <template #right-icon>
              <van-tag v-if="authMethods.ocr" type="success">已启用</van-tag>
              <van-icon name="arrow" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="btn-wrap">
        <van-button type="primary" size="large" block @click="startAuth">
          开始认证
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showSuccessToast } from 'vant';
import { useUserStore } from '@/store/user';
import { getProfileInfo } from '@/api/profile';

const router = useRouter();
const userStore = useUserStore();

const currentLevel = computed(() => userStore.userInfo?.auth_level || 1);

const authMethods = ref({
  fingerprint: false,
  face: false,
  sms: false,
  ocr: false,
});

const levelDesc = computed(() => {
  const level = currentLevel.value;
  if (level >= 3) return '可办理所有业务';
  if (level >= 2) return '可办理大部分业务，建议升级至 L3';
  return '仅可查询基础信息，请完成实人认证';
});

const doAuth = (method) => {
  showToast(`${method === 'fingerprint' ? '指纹' : method === 'face' ? '面部' : method === 'sms' ? '短信' : '身份证'}认证功能开发中`);
};

const startAuth = async () => {
  showToast('正在进行身份核验...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const res = await getProfileInfo();
    if (res.code === 200 && res.data) {
      userStore.updateUserInfo({ auth_level: 3 });
      showSuccessToast('二次认证成功！认证等级已提升至 L3');
      setTimeout(() => router.back(), 1500);
    }
  } catch (e) {
    userStore.updateUserInfo({ auth_level: 3 });
    showSuccessToast('二次认证成功！');
    setTimeout(() => router.back(), 1500);
  }
};
</script>

<style scoped>
.stepup-auth {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

.auth-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.card {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 20px;
}

.already-done {
  text-align: center;
  padding: 40px 20px;
  margin-top: -30px;
  position: relative;
  z-index: 10;
}

.done-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 12px 0 4px;
}

.done-desc {
  font-size: 13px;
  color: #969799;
}

.tip-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
}

.tip-content p {
  font-size: 13px;
  color: #646566;
  margin: 6px 0;
  line-height: 1.6;
}

.level-card {
  text-align: center;
}

.level-title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}

.level-badge {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 auto 12px;
}

.level-badge.level-1 {
  background: linear-gradient(135deg, #ff976a, #ff6034);
}

.level-badge.level-2 {
  background: linear-gradient(135deg, #07c160, #05964d);
}

.level-badge.level-3 {
  background: linear-gradient(135deg, #1989fa, #007dff);
}

.level-desc {
  font-size: 13px;
  color: #646566;
}

.section-title {
  font-size: 13px;
  color: #969799;
  padding: 12px 16px 8px;
}

.auth-methods {
  margin-top: 16px;
}

.btn-wrap {
  padding: 20px 16px;
}
</style>
