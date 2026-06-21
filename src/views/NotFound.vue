<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-4">
    <div class="text-center">
      <div class="text-8xl font-bold text-gov-blue/20 mb-4">404</div>
      <h1 class="text-2xl font-bold text-neutral-800 mb-2">页面不存在</h1>
      <p class="text-neutral-500 mb-8">您访问的页面可能已被删除或不存在</p>
      <router-link to="/" class="btn-primary inline-flex items-center gap-2">
        <Home class="w-4 h-4" />
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Home } from 'lucide-vue-next'
</script>
