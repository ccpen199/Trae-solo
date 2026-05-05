<template>
  <div class="auth-page flex-center">
    <div class="card auth-card">
      <div class="text-center mb-24">
        <h1 class="page-title">用户注册</h1>
        <p class="mt-8" style="color: var(--text-secondary)">创建您的账号</p>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">账号 <span style="color: var(--error-color)">*</span></label>
          <input
            v-model="form.account"
            type="text"
            class="form-input"
            placeholder="3-20个字符，支持字母、数字、下划线"
            required
          />
          <p class="form-error" v-if="errors.account">{{ errors.account }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">昵称 <span style="color: var(--error-color)">*</span></label>
          <input
            v-model="form.nickname"
            type="text"
            class="form-input"
            placeholder="请输入昵称"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码 <span style="color: var(--error-color)">*</span></label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="至少8位，包含大写字母、小写字母和数字"
            required
          />
          <p class="form-error" v-if="errors.password">{{ errors.password }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">确认密码 <span style="color: var(--error-color)">*</span></label>
          <input
            v-model="confirmPassword"
            type="password"
            class="form-input"
            placeholder="请再次输入密码"
            required
          />
          <p class="form-error" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="请输入邮箱（选填）"
          />
        </div>

        <div class="form-group">
          <label class="form-label">手机号</label>
          <input
            v-model="form.phone"
            type="tel"
            class="form-input"
            placeholder="请输入手机号（选填）"
          />
        </div>

        <div class="form-group">
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </div>
      </form>

      <div class="text-center mt-16">
        <span style="color: var(--text-secondary)">已有账号？</span>
        <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { post } from '@/utils/request';
import type { RegisterRequest, LoginResponse } from '@/types';

const router = useRouter();
const userStore = useUserStore();

const form = ref<RegisterRequest>({
  account: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
});

const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const errors = reactive({
  account: '',
  password: '',
  confirmPassword: '',
});

function validateForm(): boolean {
  errors.account = '';
  errors.password = '';
  errors.confirmPassword = '';

  if (form.value.account.length < 3 || form.value.account.length > 20) {
    errors.account = '账号长度必须在 3-20 个字符之间';
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.value.account)) {
    errors.account = '账号只能包含字母、数字和下划线';
  }

  if (form.value.password.length < 8) {
    errors.password = '密码长度至少为 8 位';
  } else if (!/[A-Z]/.test(form.value.password)) {
    errors.password = '密码必须包含至少一个大写字母';
  } else if (!/[a-z]/.test(form.value.password)) {
    errors.password = '密码必须包含至少一个小写字母';
  } else if (!/\d/.test(form.value.password)) {
    errors.password = '密码必须包含至少一个数字';
  }

  if (form.value.password !== confirmPassword.value) {
    errors.confirmPassword = '两次输入的密码不一致';
  }

  return !errors.account && !errors.password && !errors.confirmPassword;
}

async function handleRegister() {
  if (!validateForm()) {
    return;
  }

  error.value = '';
  loading.value = true;

  try {
    const submitData = { ...form.value };
    if (!submitData.email) delete submitData.email;
    if (!submitData.phone) delete submitData.phone;

    const response = await post<LoginResponse>('/auth/register', submitData);
    
    if (response.success && response.data) {
      userStore.setToken(response.data.token);
      userStore.setUser(response.data.user);
      router.push('/login?registered=1');
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
  max-width: 450px;
}
</style>
