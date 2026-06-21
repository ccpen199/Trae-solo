<template>
  <header class="h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0">
    <div class="flex items-center gap-4">
      <button
        class="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        @click="$emit('toggle-sidebar')"
      >
        <PanelLeft class="w-5 h-5" />
      </button>

      <div class="flex items-center gap-2 text-sm">
        <router-link to="/" class="text-neutral-400 hover:text-white transition-colors">
          前台首页
        </router-link>
        <ChevronRight class="w-4 h-4 text-neutral-600" />
        <span class="text-white font-medium">{{ pageTitle }}</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="hidden md:flex items-center bg-neutral-800 rounded-lg px-3 py-1.5 w-56">
        <Search class="w-4 h-4 text-neutral-500 shrink-0" />
        <input
          type="text"
          placeholder="搜索..."
          class="bg-transparent border-none outline-none text-sm ml-2 flex-1 text-white placeholder:text-neutral-500"
        />
      </div>

      <button class="relative p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full"></span>
      </button>

      <button
        class="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        @click="toggleFullscreen"
      >
        <Maximize2 v-if="!isFullscreen" class="w-5 h-5" />
        <Minimize2 v-else class="w-5 h-5" />
      </button>

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
          <div class="w-8 h-8 rounded-full bg-gov-gradient flex items-center justify-center text-white font-medium text-sm shrink-0">
            {{ userStore.userInfo?.realName?.charAt(0) || 'A' }}
          </div>
          <div class="hidden sm:flex flex-col text-left">
            <span class="text-sm font-medium text-white leading-tight">
              {{ userStore.userInfo?.realName || '管理员' }}
            </span>
            <span class="text-xs text-neutral-500 leading-tight">
              {{ userStore.isAdmin ? '系统管理员' : '普通用户' }}
            </span>
          </div>
          <ChevronDown class="w-4 h-4 text-neutral-500" />
        </div>
        <template #dropdown>
          <el-dropdown-menu class="w-48">
            <el-dropdown-item command="profile">
              <div class="flex items-center gap-2">
                <User class="w-4 h-4" />
                个人设置
              </div>
            </el-dropdown-item>
            <el-dropdown-item command="home">
              <div class="flex items-center gap-2">
                <Home class="w-4 h-4" />
                返回前台
              </div>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <div class="flex items-center gap-2 text-accent-red">
                <LogOut class="w-4 h-4" />
                退出登录
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  PanelLeft,
  Search,
  Bell,
  Maximize2,
  Minimize2,
  User,
  Home,
  LogOut,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isFullscreen = ref(false)

const pageTitle = computed(() => {
  return route.meta.title || '管理后台'
})

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'home':
      router.push('/')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          userStore.logout()
          ElMessage.success('已退出登录')
          router.push('/login')
        })
        .catch(() => {})
      break
  }
}
</script>
