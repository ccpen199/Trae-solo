<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Loader2 } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref('');

onMounted(async () => {
  const code = route.query.code as string;
  const state = route.query.state as string;

  if (!code || !state) {
    error.value = '缺少认证参数，请重新登录';
    loading.value = false;
    return;
  }

  try {
    await authStore.callback(code, state);
    router.push({ name: 'Dashboard' });
  } catch (e: any) {
    error.value = e?.response?.data?.message || '认证失败，请重试';
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center">
      <div v-if="loading" class="space-y-4">
        <Loader2 class="w-12 h-12 text-primary animate-spin mx-auto" />
        <p class="text-gray-600">正在完成桂事通认证...</p>
      </div>

      <div v-else-if="error" class="space-y-4">
        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <span class="text-2xl text-danger">✕</span>
        </div>
        <p class="text-gray-800 font-medium">认证失败</p>
        <p class="text-sm text-gray-500">{{ error }}</p>
        <button
          class="btn-primary mt-4"
          @click="authStore.login()"
        >
          重新登录
        </button>
      </div>
    </div>
  </div>
</template>
