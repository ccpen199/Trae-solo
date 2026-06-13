<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { LogOut, User, Shield } from 'lucide-vue-next';

const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logout();
};
</script>

<template>
  <div class="page-gradient-bg zhuangjin-pattern min-h-screen flex flex-col">
    <header
      class="bg-gov-gradient text-white shadow-lg sticky top-0 z-50"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <router-link to="/" class="flex items-center gap-3 no-underline">
            <Shield class="w-8 h-8" />
            <div>
              <h1 class="text-lg font-bold leading-tight">广西人社公共服务平台</h1>
              <p class="text-xs text-blue-200 leading-tight">可信数字政务</p>
            </div>
          </router-link>

          <div v-if="authStore.isAuthenticated" class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm">
              <User class="w-4 h-4" />
              <span>{{ authStore.userInfo?.nameMasked }}</span>
            </div>
            <div class="h-4 w-px bg-blue-300" />
            <button
              class="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors"
              @click="handleLogout"
            >
              <LogOut class="w-4 h-4" />
              <span>退出</span>
            </button>
          </div>

          <router-link
            v-else
            to="/"
            class="text-sm text-blue-200 hover:text-white transition-colors"
          >
            登录
          </router-link>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="bg-white/60 border-t border-primary-100 py-4 text-center text-xs text-gray-400">
      <p>广西壮族自治区人力资源和社会保障厅 版权所有</p>
      <p class="mt-1">桂ICP备XXXXXXXX号-1</p>
    </footer>
  </div>
</template>
