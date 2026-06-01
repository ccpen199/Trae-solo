<template>
  <div class="login">
    <div class="logo-area">
      <div class="logo">🏨</div>
      <div class="title">柚诚小栈</div>
      <div class="subtitle">优质民宿预订平台</div>
    </div>

    <div class="form-area">
      <van-field v-model="nickname" label="昵称" placeholder="请输入昵称" />
      <van-field v-model="avatar" label="头像" placeholder="请输入头像URL" />
      <van-field v-model="location" label="位置" placeholder="请输入您的位置" />
    </div>

    <div class="btn-area">
      <van-button type="primary" block round size="large" @click="handleLogin" :loading="loading">
        微信一键登录
      </van-button>
      <div class="tip">登录即表示同意用户协议和隐私政策</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { showToast } from 'vant';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const nickname = ref('游客');
const avatar = ref('');
const location = ref('北京市');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  try {
    await userStore.login({
      code: 'mock_code_' + Date.now(),
      nickname: nickname.value,
      avatar: avatar.value || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      location: location.value
    });
    showToast('登录成功');
    const redirect = route.query.redirect || '/home';
    router.replace(decodeURIComponent(redirect));
  } catch (e) {
    showToast('登录失败，请重试');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (localStorage.getItem('token')) {
    router.replace('/home');
  }
});
</script>

<style scoped lang="less">
.login {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
  padding: 60px 30px 30px;
}

.logo-area {
  text-align: center;
  color: #fff;
  margin-bottom: 40px;
}

.logo {
  font-size: 80px;
  margin-bottom: 10px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.form-area {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.btn-area {
  .tip {
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 15px;
  }
}
</style>
