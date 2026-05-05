<template>
  <div class="auth-page flex-center">
    <div class="card auth-card">
      <div class="text-center mb-24">
        <h1 class="page-title">用户登录</h1>
        <p class="mt-8" style="color: var(--text-secondary)">欢迎回来</p>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">账号 / 邮箱 / 手机号</label>
          <input
            v-model="form.account"
            type="text"
            class="form-input"
            placeholder="请输入账号、邮箱或手机号"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            required
          />
        </div>

        <div class="form-group">
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
      </form>

      <div class="text-center mt-16">
        <span style="color: var(--text-secondary)">还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>

      <div class="text-center mt-16" style="color: var(--text-secondary); font-size: 12px;">
        默认管理员账号: admin / Admin@123
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { post } from '@/utils/request';
import type { LoginRequest, LoginResponse } from '@/types';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const form = ref<LoginRequest>({
  account: '',
  password: '',
});

const loading = ref(false);
const error = ref('');
const success = ref('');

if (route.query.registered === '1') {
  success.value = '注册成功，请登录';
}

async function handleLogin() {
  error.value = '';
  success.value = '';
  loading.value = true;

  try {
    const response = await post<LoginResponse>('/auth/login', form.value);
    
    if (response.success && response.data) {
      userStore.setToken(response.data.token);
      userStore.setUser(response.data.user);
      
      const redirect = route.query.redirect as string;
      router.push(redirect || '/profile');
    } else {
      error.value = response.message;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 48px);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
}
</style>
