<template>
  <div class="container" style="max-width: 400px; padding-top: 60px;">
    <div class="card" style="padding: 32px;">
      <h2 style="text-align: center; margin-bottom: 32px; font-size: 24px; font-weight: 700;">注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名（3-20个字符）"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input
            v-model="form.nickname"
            type="text"
            class="form-input"
            placeholder="请输入昵称（可选）"
          />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="请输入密码（6-32个字符）"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            placeholder="请再次输入密码"
            required
          />
        </div>
        <div style="margin-bottom: 16px; text-align: center; color: #999; font-size: 14px;">
          已有账号？
          <router-link to="/login" style="color: #667eea; text-decoration: none;">立即登录</router-link>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const form = ref({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
});
const loading = ref(false);

const handleRegister = async () => {
  if (!form.value.username || !form.value.password) {
    alert('请填写用户名和密码');
    return;
  }

  if (form.value.password !== form.value.confirmPassword) {
    alert('两次密码输入不一致');
    return;
  }

  if (form.value.username.length < 3 || form.value.username.length > 20) {
    alert('用户名长度应为3-20个字符');
    return;
  }

  if (form.value.password.length < 6 || form.value.password.length > 32) {
    alert('密码长度应为6-32个字符');
    return;
  }

  loading.value = true;
  try {
    await userStore.register(
      form.value.username,
      form.value.password,
      form.value.nickname || undefined
    );
    alert('注册成功，请登录');
    router.push('/login');
  } catch (error: any) {
    alert(error.response?.data?.message || '注册失败');
  } finally {
    loading.value = false;
  }
};
</script>
