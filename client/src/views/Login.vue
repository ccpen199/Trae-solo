<template>
  <div class="container" style="max-width: 400px; padding-top: 60px;">
    <div class="card" style="padding: 32px;">
      <h2 style="text-align: center; margin-bottom: 32px; font-size: 24px; font-weight: 700;">登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
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
        <div style="margin-bottom: 16px; text-align: center; color: #999; font-size: 14px;">
          还没有账号？
          <router-link to="/register" style="color: #667eea; text-decoration: none;">立即注册</router-link>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const form = ref({
  username: '',
  password: '',
});
const loading = ref(false);

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    alert('请输入用户名和密码');
    return;
  }

  loading.value = true;
  try {
    await userStore.login(form.value.username, form.value.password);
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (error: any) {
    alert(error.response?.data?.message || '登录失败');
  } finally {
    loading.value = false;
  }
};
</script>
