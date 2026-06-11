<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">
        <van-icon name="manager-o" size="40" />
      </div>
      <h1>全国人社政务服务平台</h1>
      <p class="subtitle">National HRSS Government Service Platform</p>
    </div>

    <van-form @submit="onLogin">
      <van-cell-group inset>
        <van-field
          v-model="phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[{ required: true, message: '请输入手机号' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>

      <div v-if="loginError" class="login-error">
        <van-icon name="info-o" size="14" />
        <span>{{ loginError }}</span>
      </div>

      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit" size="large">
          登录
        </van-button>
      </div>

      <div class="gov-auth" @click="onGovAuth">
        <van-icon name="shield-o" size="18" />
        <span>国家政务服务平台统一认证登录</span>
      </div>

      <div class="test-account-section">
        <div class="test-account-title">测试账号（点击快速填入）</div>
        <div class="test-account-list">
          <div class="test-account-item" @click="fillAccount('13800138000', '123456')">
            <span class="account-name">张三</span>
            <span class="account-role">普通用户</span>
            <span class="account-phone">13800138000</span>
          </div>
          <div class="test-account-item" @click="fillAccount('admin', '123456')">
            <span class="account-name">系统管理员</span>
            <span class="account-role admin">管理员</span>
            <span class="account-phone">admin</span>
          </div>
          <div class="test-account-item" @click="fillAccount('platform', '123456')">
            <span class="account-name">平台运营</span>
            <span class="account-role platform">运营</span>
            <span class="account-phone">platform</span>
          </div>
          <div class="test-account-item" @click="fillAccount('ops', '123456')">
            <span class="account-name">运维工程师</span>
            <span class="account-role ops">运维</span>
            <span class="account-phone">ops</span>
          </div>
        </div>
        <div class="test-account-hint">密码统一为: 123456</div>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showDialog } from 'vant';
import { useUserStore } from '@/store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const phone = ref('');
const password = ref('');
const loginError = ref('');

onMounted(() => {
  if (userStore.token) {
    userStore.logout();
  }
  phone.value = '13800138000';
  password.value = '123456';
});

const fillAccount = (p, pass) => {
  phone.value = p;
  password.value = pass;
  loginError.value = '';
};

const getErrorType = (message) => {
  if (message?.includes('密码错误')) return 'password';
  if (message?.includes('用户不存在')) return 'user';
  if (message?.includes('权限不足')) return 'permission';
  if (message?.includes('二次验证')) return 'stepup';
  if (message?.includes('锁定')) return 'locked';
  return 'unknown';
};

const getErrorMessage = (type, message) => {
  const errors = {
    password: '密码错误，请重新输入',
    user: '账号不存在或已禁用',
    permission: '权限不足，请联系管理员',
    stepup: '需要二次验证，请先完成身份核验',
    locked: '账号已被锁定，请稍后重试',
  };
  return errors[type] || message || '登录失败，请重试';
};

const onLogin = async () => {
  loginError.value = '';
  const result = await userStore.login(phone.value, password.value);
  if (result.success) {
    showToast('登录成功');
    const redirect = route.query.redirect || '/';
    router.push(redirect);
  } else {
    const errorType = getErrorType(result.message);
    loginError.value = getErrorMessage(errorType, result.message);
    showToast(loginError.value);
  }
};

const onGovAuth = async () => {
  await showDialog({
    title: '国家政务服务平台认证',
    message: '将跳转到国家政务服务平台进行统一身份认证',
    confirmButtonText: '继续认证',
  });
  
  const result = await userStore.govAuth('demo_gov_token_' + Date.now(), '张三', '110101199001011234');
  if (result.success) {
    showToast('认证成功');
    router.push('/');
  } else {
    loginError.value = result.message || '认证失败';
    showToast(loginError.value);
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1989fa 0%, #f7f8fa 40%);
  padding-top: 60px;
  padding-bottom: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 70px;
  height: 70px;
  background: #fff;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto 16px;
  box-shadow: 0 4px 20px rgba(25, 137, 250, 0.3);
}

.login-header h1 {
  font-size: 20px;
  color: #fff;
  margin-bottom: 6px;
  font-weight: 600;
}

.subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.login-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 16px 8px;
  padding: 10px;
  background: #feebeb;
  color: #ee0a24;
  border-radius: 8px;
  font-size: 13px;
}

.gov-auth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  color: #1989fa;
  font-size: 14px;
}

.test-account-section {
  margin: 24px 16px 0;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.test-account-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
  text-align: center;
}

.test-account-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.test-account-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.test-account-item:active {
  background: #e8f3ff;
  border-color: #1989fa;
  transform: scale(0.98);
}

.account-name {
  font-size: 13px;
  font-weight: 600;
  color: #323233;
}

.account-role {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e5f1ff;
  color: #1989fa;
}

.account-role.admin {
  background: #fef0f0;
  color: #ee0a24;
}

.account-role.platform {
  background: #fff7e6;
  color: #ff976a;
}

.account-role.ops {
  background: #e8f7ee;
  color: #07c160;
}

.account-phone {
  font-size: 11px;
  color: #969799;
  font-family: monospace;
}

.test-account-hint {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #969799;
}
</style>
