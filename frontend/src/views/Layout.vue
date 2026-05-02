<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon size="28"><Document /></el-icon>
        <span>日志分析平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>首页概览</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>主单台账</span>
        </el-menu-item>
        <el-menu-item index="/orders/create">
          <el-icon><Plus /></el-icon>
          <span>新建日志采集</span>
        </el-menu-item>
        <el-menu-item index="/messages">
          <el-icon><Bell /></el-icon>
          <span>消息通知</span>
          <el-badge :value="unreadCount" :max="99" class="badge" v-if="unreadCount > 0" />
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-icon><User /></el-icon>
              <span>{{ userStore.userInfo?.name }}</span>
              <el-tag :type="getRoleTagType(userStore.userInfo?.role)" size="small">
                {{ userStore.userInfo?.roleLabel }}
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getUnreadCount } from '@/api/messages'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const unreadCount = computed(() => userStore.userInfo?.unreadCount || 0)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title
  }))
})

const getRoleTagType = (role) => {
  const types = {
    developer: 'primary',
    operator: 'success',
    security: 'warning',
    analyst: 'info',
    admin: 'danger'
  }
  return types[role] || 'info'
}

const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    userStore.updateUnreadCount(res.data.count)
  } catch (e) {
    console.error('获取未读消息数失败:', e)
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    router.push('/login')
    userStore.logout()
  }
}

onMounted(() => {
  fetchUnreadCount()
})

watch(() => route.path, () => {
  fetchUnreadCount()
})
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5b;
  gap: 10px;
}

.el-menu {
  border-right: none;
}

.badge {
  margin-left: 10px;
}

.header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.breadcrumb {
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.user-dropdown:hover {
  color: #409EFF;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
