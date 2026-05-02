<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">✈️</div>
        <h1>航空货运管理系统</h1>
        <p>Air Cargo Management System</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            placeholder="请输入用户名"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="loginForm.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            required
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
          <button
            type="button"
            class="password-toggle"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading">登录中...</span>
          <span v-else>登 录</span>
        </button>
      </form>

      <div class="login-footer">
        <h4>测试账号 (密码: 123456)</h4>
        <div class="user-list">
          <div class="user-item" v-for="user in testUsers" :key="user.username" @click="quickLogin(user)">
            <span class="user-role">{{ user.roleDisplay }}</span>
            <span class="user-name">{{ user.username }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { systemApi } from '@/api';
import { User, UserRole } from '@/types';

const router = useRouter();

const loginForm = reactive({
  username: '',
  password: '',
});

const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

const testUsers: Array<{ username: string; role: UserRole; roleDisplay: string }> = [
  { username: 'admin', role: UserRole.ADMIN, roleDisplay: '管理员' },
  { username: 'forwarder', role: UserRole.FORWARDER, roleDisplay: '货代' },
  { username: 'airline', role: UserRole.AIRLINE, roleDisplay: '航司' },
  { username: 'warehouse', role: UserRole.WAREHOUSE, roleDisplay: '仓库' },
  { username: 'security', role: UserRole.SECURITY, roleDisplay: '安检' },
  { username: 'consignee', role: UserRole.CONSIGNEE, roleDisplay: '收货人' },
];

function quickLogin(user: { username: string; role: UserRole; roleDisplay: string }) {
  loginForm.username = user.username;
  loginForm.password = '123456';
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    error.value = '请输入用户名和密码';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const result = await systemApi.login(loginForm.username, loginForm.password);

    if (result && result.token) {
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('current_user', JSON.stringify(result.user));

      window.dispatchEvent(new CustomEvent('auth-login', { detail: result.user }));

      router.push('/dashboard');
    } else {
      error.value = '登录失败，请检查用户名和密码';
    }
  } catch (e: any) {
    error.value = e.message || '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    router.push('/dashboard');
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  font-size: 48px;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
}

.login-header p {
  color: #8c8c8c;
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input::placeholder {
  color: #bfbfbf;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 38px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.error-message {
  background: #fff1f0;
  color: #ff4d4f;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  border: 1px solid #ffa39e;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 24px;
}

.login-footer h4 {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0 0 12px 0;
  font-weight: 400;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid #f0f0f0;
}

.user-item:hover {
  background: #f5f5f5;
  border-color: #667eea;
}

.user-role {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
  margin-bottom: 4px;
}

.user-name {
  font-size: 13px;
  color: #262626;
  font-weight: 500;
}
</style>
