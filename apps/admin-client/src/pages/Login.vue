<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Shield, Eye, EyeOff } from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';

const router = useRouter();
const adminStore = useAdminStore();

const employeeId = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMsg = ref('');

async function handleLogin() {
  if (!employeeId.value || !password.value) {
    errorMsg.value = '请输入工号和密码';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    await adminStore.login(employeeId.value, password.value);
    router.push('/');
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? '登录失败，请检查工号和密码';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-700 to-blue-900">
    <div class="w-full max-w-md mx-4">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
          <Shield class="w-9 h-9 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white">广西人社公共服务平台</h1>
        <p class="text-blue-200 mt-2 text-sm">管理后台</p>
      </div>

      <div class="bg-white rounded-xl shadow-2xl p-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">管理员登录</h2>

        <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleLogin">
          <div class="mb-5">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">工号</label>
            <input
              v-model="employeeId"
              type="text"
              placeholder="请输入工号"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>
      </div>

      <p class="text-center text-blue-300 text-xs mt-6">
        广西壮族自治区人力资源和社会保障厅 版权所有
      </p>
    </div>
  </div>
</template>
