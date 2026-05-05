<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">个人中心</h1>
    </div>

    <div class="grid">
      <div class="card">
        <h2 class="mb-24" style="font-size: 18px; font-weight: 600;">基本资料</h2>
        
        <div v-if="profileSuccess" class="alert alert-success">{{ profileSuccess }}</div>
        <div v-if="profileError" class="alert alert-error">{{ profileError }}</div>

        <form @submit.prevent="handleUpdateProfile">
          <div class="form-group">
            <label class="form-label">账号</label>
            <input
              :value="userStore.user?.account"
              type="text"
              class="form-input"
              disabled
            />
            <p class="form-error" style="color: var(--text-secondary);">账号不可修改</p>
          </div>

          <div class="form-group">
            <label class="form-label">昵称</label>
            <input
              v-model="profileForm.nickname"
              type="text"
              class="form-input"
              placeholder="请输入昵称"
            />
          </div>

          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              v-model="profileForm.email"
              type="email"
              class="form-input"
              placeholder="请输入邮箱"
            />
          </div>

          <div class="form-group">
            <label class="form-label">手机号</label>
            <input
              v-model="profileForm.phone"
              type="tel"
              class="form-input"
              placeholder="请输入手机号"
            />
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-primary" :disabled="profileLoading">
              {{ profileLoading ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card" style="margin-top: 24px;">
        <h2 class="mb-24" style="font-size: 18px; font-weight: 600;">修改密码</h2>
        
        <div v-if="passwordSuccess" class="alert alert-success">{{ passwordSuccess }}</div>
        <div v-if="passwordError" class="alert alert-error">{{ passwordError }}</div>

        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label class="form-label">原密码</label>
            <input
              v-model="passwordForm.oldPassword"
              type="password"
              class="form-input"
              placeholder="请输入原密码"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">新密码</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="form-input"
              placeholder="至少8位，包含大写字母、小写字母和数字"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input
              v-model="confirmNewPassword"
              type="password"
              class="form-input"
              placeholder="请再次输入新密码"
              required
            />
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-primary" :disabled="passwordLoading">
              {{ passwordLoading ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card" style="margin-top: 24px;">
        <h2 class="mb-24" style="font-size: 18px; font-weight: 600;">账号信息</h2>
        <table class="table">
          <tr>
            <td style="width: 120px; color: var(--text-secondary);">角色</td>
            <td>
              <span class="badge" :class="userStore.isAdmin ? 'badge-success' : 'badge-warning'">
                {{ userStore.isAdmin ? '管理员' : '普通用户' }}
              </span>
            </td>
          </tr>
          <tr>
            <td style="color: var(--text-secondary);">注册时间</td>
            <td>{{ formatDate(userStore.user?.createdAt) }}</td>
          </tr>
          <tr>
            <td style="color: var(--text-secondary);">最后登录</td>
            <td>{{ formatDate(userStore.user?.lastLoginAt) || '首次登录' }}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { put, post } from '@/utils/request';
import type { User, UpdateProfileRequest, ChangePasswordRequest } from '@/types';

const userStore = useUserStore();

const profileForm = ref<UpdateProfileRequest>({
  nickname: '',
  email: '',
  phone: '',
});

const profileLoading = ref(false);
const profileSuccess = ref('');
const profileError = ref('');

const passwordForm = ref<ChangePasswordRequest>({
  oldPassword: '',
  newPassword: '',
});

const confirmNewPassword = ref('');
const passwordLoading = ref(false);
const passwordSuccess = ref('');
const passwordError = ref('');

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function loadUserData() {
  if (userStore.user) {
    profileForm.value = {
      nickname: userStore.user.nickname || '',
      email: userStore.user.email || '',
      phone: userStore.user.phone || '',
    };
  }
}

watch(() => userStore.user, () => {
  loadUserData();
}, { immediate: true });

onMounted(() => {
  loadUserData();
});

async function handleUpdateProfile() {
  profileSuccess.value = '';
  profileError.value = '';
  profileLoading.value = true;

  try {
    const submitData = { ...profileForm.value };
    if (!submitData.email) submitData.email = undefined;
    if (!submitData.phone) submitData.phone = undefined;

    const response = await put<User>('/user/profile', submitData);
    
    if (response.success && response.data) {
      userStore.setUser(response.data);
      profileSuccess.value = '资料更新成功';
    } else {
      profileError.value = response.message;
    }
  } finally {
    profileLoading.value = false;
  }
}

async function handleChangePassword() {
  passwordSuccess.value = '';
  passwordError.value = '';

  if (passwordForm.value.newPassword !== confirmNewPassword.value) {
    passwordError.value = '两次输入的新密码不一致';
    return;
  }

  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = '密码长度至少为 8 位';
    return;
  }

  passwordLoading.value = true;

  try {
    const response = await post('/user/change-password', passwordForm.value);
    
    if (response.success) {
      passwordSuccess.value = '密码修改成功';
      passwordForm.value = { oldPassword: '', newPassword: '' };
      confirmNewPassword.value = '';
    } else {
      passwordError.value = response.message;
    }
  } finally {
    passwordLoading.value = false;
  }
}
</script>

<style scoped>
.grid {
  max-width: 600px;
}
</style>
