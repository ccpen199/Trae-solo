<template>
  <div class="min-h-screen bg-pdd-bg">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 border-b flex items-center">
      <button @click="$router.back()" class="text-xl">←</button>
      <h1 class="flex-1 text-center font-medium">设置</h1>
      <div class="w-6"></div>
    </div>

    <div class="bg-white mt-2">
      <div class="p-3 flex items-center justify-between border-b">
        <span class="text-gray-700">账号与安全</span>
        <span class="text-gray-400">›</span>
      </div>
      <div class="p-3 flex items-center justify-between border-b">
        <span class="text-gray-700">消息通知</span>
        <span class="text-gray-400">›</span>
      </div>
      <div class="p-3 flex items-center justify-between border-b">
        <span class="text-gray-700">隐私设置</span>
        <span class="text-gray-400">›</span>
      </div>
      <div class="p-3 flex items-center justify-between border-b">
        <span class="text-gray-700">通用设置</span>
        <span class="text-gray-400">›</span>
      </div>
    </div>

    <div class="bg-white mt-2">
      <div class="p-3 flex items-center justify-between border-b">
        <span class="text-gray-700">关于拼多多</span>
        <span class="text-gray-400">›</span>
      </div>
      <div class="p-3 flex items-center justify-between border-b">
        <span class="text-gray-700">帮助中心</span>
        <span class="text-gray-400">›</span>
      </div>
      <div class="p-3 flex items-center justify-between">
        <span class="text-gray-700">意见反馈</span>
        <span class="text-gray-400">›</span>
      </div>
    </div>

    <div class="bg-white mt-2">
      <div class="p-3 flex items-center justify-between border-b">
        <span class="text-gray-700">清除缓存</span>
        <span class="text-gray-400">12.5MB</span>
      </div>
    </div>

    <div class="px-3 mt-4">
      <button
        v-if="userStore.isLoggedIn"
        @click="doLogout"
        class="w-full py-3 bg-white text-red-500 rounded-lg font-medium"
      >
        退出登录
      </button>
    </div>

    <div class="text-center text-gray-400 text-xs mt-6">
      版本 1.0.0
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToast } from '../stores/toast'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

function doLogout() {
  userStore.logout()
  toast.success('已退出登录')
  router.push('/')
}
</script>
