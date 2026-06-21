<template>
  <header class="bg-white shadow-sm border-b border-neutral-100 sticky top-0 z-50">
    <div class="container">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-8">
          <router-link to="/" class="flex items-center gap-2.5 shrink-0">
            <div class="w-10 h-10 bg-gov-gradient rounded-xl flex items-center justify-center">
              <Building2 class="w-5 h-5 text-white" />
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold text-neutral-800 leading-tight">抚州政务</span>
              <span class="text-xs text-neutral-500 leading-tight">民生服务门户</span>
            </div>
          </router-link>

          <nav class="hidden md:flex items-center gap-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="
                route.path === item.path || route.path.startsWith(item.path + '/')
                  ? 'text-gov-blue bg-gov-blue-50'
                  : 'text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50/50'
              "
            >
              {{ item.label }}
            </router-link>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <div class="hidden lg:flex items-center bg-neutral-100 rounded-full px-4 py-2 w-64">
            <Search class="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索服务、政策..."
              class="bg-transparent border-none outline-none text-sm ml-2 flex-1 placeholder:text-neutral-400"
              @keyup.enter="handleSearch"
            />
          </div>

          <button
            class="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            @click="showNotifications = !showNotifications"
          >
            <Bell class="w-5 h-5 text-neutral-600" />
            <span
              v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1.5 bg-accent-red text-white text-xs font-medium rounded-full flex items-center justify-center"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </button>

          <el-dropdown v-if="userStore.isLoggedIn" trigger="click" @command="handleUserCommand">
            <div class="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
              <div class="w-9 h-9 rounded-full bg-gov-gradient flex items-center justify-center text-white font-medium text-sm shrink-0">
                {{ userStore.userInfo?.realName?.charAt(0) || 'U' }}
              </div>
              <div class="hidden sm:flex flex-col text-left">
                <span class="text-sm font-medium text-neutral-800 leading-tight">
                  {{ userStore.userInfo?.realName }}
                </span>
                <span class="text-xs text-neutral-500 leading-tight flex items-center gap-1">
                  <BadgeCheck class="w-3 h-3" v-if="userStore.userInfo?.verified" />
                  已认证
                </span>
              </div>
              <ChevronDown class="w-4 h-4 text-neutral-400" />
            </div>
            <template #dropdown>
              <el-dropdown-menu class="w-56">
                <div class="px-4 py-3 border-b border-neutral-100">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gov-gradient flex items-center justify-center text-white font-semibold text-base shrink-0">
                      {{ userStore.userInfo?.realName?.charAt(0) || 'U' }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-semibold text-neutral-800 truncate">
                        {{ userStore.userInfo?.realName }}
                      </div>
                      <div class="text-xs text-neutral-500 truncate mt-0.5">
                        {{ userStore.userInfo?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}
                      </div>
                      <div class="flex items-center gap-1 mt-1">
                        <BadgeCheck class="w-3.5 h-3.5 text-accent-green" v-if="userStore.userInfo?.verified" />
                        <span class="text-xs" :class="userStore.userInfo?.verified ? 'text-accent-green' : 'text-neutral-400'">
                          {{ userStore.userInfo?.verified ? '已实名认证' : '未认证' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <el-dropdown-item command="dashboard" v-if="userStore.isCitizen">
                  <div class="flex items-center gap-2">
                    <LayoutDashboard class="w-4 h-4 text-gov-blue" />
                    <span class="font-medium">个人工作台</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="profile">
                  <div class="flex items-center gap-2">
                    <User class="w-4 h-4" />
                    个人中心
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="applications">
                  <div class="flex items-center gap-2">
                    <FileText class="w-4 h-4" />
                    我的办件
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="licenses">
                  <div class="flex items-center gap-2">
                    <CreditCard class="w-4 h-4" />
                    我的证照
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="messages">
                  <div class="flex items-center gap-2 justify-between flex-1">
                    <div class="flex items-center gap-2">
                      <Bell class="w-4 h-4" />
                      消息中心
                    </div>
                    <span v-if="unreadCount > 0" class="text-xs px-1.5 py-0.5 bg-accent-red text-white rounded-full">
                      {{ unreadCount > 99 ? '99+' : unreadCount }}
                    </span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided command="admin" v-if="userStore.isAdmin">
                  <div class="flex items-center gap-2">
                    <Settings class="w-4 h-4" />
                    管理后台
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

          <router-link
            v-else
            to="/login"
            class="flex items-center gap-2 px-4 py-2 bg-gov-gradient text-white rounded-lg text-sm font-medium hover:shadow-card-hover transition-all duration-200"
          >
            <LogIn class="w-4 h-4" />
            <span>登录</span>
          </router-link>
        </div>
      </div>
    </div>

    <el-drawer
      v-model="showNotifications"
      title="消息通知"
      direction="rtl"
      size="380px"
    >
      <div class="space-y-3">
        <div
          v-for="(item, index) in notifications"
          :key="index"
          class="p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              :class="{
                'bg-accent-green/10 text-accent-green': item.type === 'success',
                'bg-accent-orange/10 text-accent-orange': item.type === 'warning',
                'bg-gov-blue/10 text-gov-blue': item.type === 'info',
              }"
            >
              <CheckCircle v-if="item.type === 'success'" class="w-4 h-4" />
              <AlertCircle v-else-if="item.type === 'warning'" class="w-4 h-4" />
              <Info v-else class="w-4 h-4" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-neutral-800">{{ item.title }}</div>
              <div class="text-xs text-neutral-500 mt-0.5">{{ item.content }}</div>
              <div class="text-xs text-neutral-400 mt-1">{{ item.time }}</div>
            </div>
          </div>
        </div>
        <div v-if="notifications.length === 0" class="text-center py-8 text-neutral-400 text-sm">
          暂无消息通知
        </div>
      </div>
    </el-drawer>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Building2,
  Search,
  Bell,
  ChevronDown,
  User,
  FileText,
  CreditCard,
  LogOut,
  LogIn,
  Settings,
  BadgeCheck,
  CheckCircle,
  AlertCircle,
  Info,
  LayoutDashboard,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchKeyword = ref('')
const showNotifications = ref(false)

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const navItems = [
  { path: '/', label: '首页' },
  { path: '/services', label: '办事服务' },
  { path: '/tools', label: '便民工具' },
  { path: '/complaints', label: '投诉建议' },
]

const notifications = ref([
  {
    type: 'success',
    title: '办件已完成',
    content: '您申请的"社会保障卡补办"已完成办理',
    time: '10分钟前',
    read: false,
  },
  {
    type: 'info',
    title: '政策更新',
    content: '《抚州市住房公积金提取管理办法》已更新',
    time: '2小时前',
    read: false,
  },
  {
    type: 'warning',
    title: '证照即将过期',
    content: '您的驾驶证将于30天后到期，请及时办理换证',
    time: '昨天',
    read: false,
  },
])

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({ path: '/services', query: { keyword: searchKeyword.value } })
}

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'dashboard':
      router.push('/dashboard')
      break
    case 'profile':
      router.push('/profile')
      break
    case 'applications':
      router.push('/my-applications')
      break
    case 'licenses':
      router.push('/profile/licenses')
      break
    case 'messages':
      showNotifications.value = true
      break
    case 'admin':
      router.push('/admin')
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
          router.push('/')
        })
        .catch(() => {})
      break
  }
}
</script>
