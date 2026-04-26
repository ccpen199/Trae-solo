<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28"><Promotion /></el-icon>
        <span class="logo-text">农产品直采平台</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
        background-color="#001529"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        
        <el-menu-item v-if="userStore.isBuyer || userStore.isOperator" index="/orders">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        
        <el-menu-item v-if="userStore.isFarmer" index="/suborders">
          <el-icon><List /></el-icon>
          <span>子订单管理</span>
        </el-menu-item>
        
        <el-menu-item v-if="userStore.isOperator || userStore.isFinance" index="/quality">
          <el-icon><Checked /></el-icon>
          <span>质检管理</span>
        </el-menu-item>
        
        <el-menu-item index="/cold-chain">
          <el-icon><Monitor /></el-icon>
          <span>冷链监控</span>
        </el-menu-item>
        
        <el-menu-item v-if="userStore.isFinance || userStore.isOperator" index="/settlement">
          <el-icon><Money /></el-icon>
          <span>结算管理</span>
        </el-menu-item>
        
        <el-menu-item index="/account">
          <el-icon><User /></el-icon>
          <span>账户中心</span>
        </el-menu-item>
        
        <el-sub-menu v-if="userStore.isOperator || userStore.isFinance" index="audit">
          <template #title>
            <el-icon><DocumentCopy /></el-icon>
            <span>审计日志</span>
          </template>
          <el-menu-item index="/audit">日志列表</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu v-if="userStore.isOperator" index="users">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/users">用户列表</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="{ path: item.path }"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-badge :value="notificationStore.unreadCount" class="notification-badge">
            <el-icon class="header-icon" @click="showNotifications = true">
              <Bell />
            </el-icon>
          </el-badge>
          
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ userStore.userInfo?.realName?.[0] || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.userInfo?.realName }}</span>
              <span class="user-role">{{ roleText }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="account">账户中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
    
    <el-drawer
      v-model="showNotifications"
      title="消息通知"
      direction="rtl"
      size="400px"
    >
      <div class="notification-list">
        <div
          v-for="notification in notificationStore.notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.isRead }"
          @click="markAsRead(notification)"
        >
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-content">{{ notification.content }}</div>
          <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
        </div>
        <el-empty v-if="notificationStore.notifications.length === 0" description="暂无消息" />
      </div>
      <div class="notification-footer">
        <el-button type="primary" text @click="markAllAsRead">全部已读</el-button>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { Role } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const activeMenu = computed(() => route.path)
const showNotifications = ref(false)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title as string,
  }))
})

const roleText = computed(() => {
  const roleMap: Record<Role, string> = {
    [Role.BUYER]: '采购商',
    [Role.FARMER]: '农户',
    [Role.OPERATOR]: '平台运营',
    [Role.FINANCE]: '财务人员',
    [Role.STORAGE]: '收储机构',
  }
  return roleMap[userStore.userInfo?.role || Role.BUYER]
})

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/account')
      break
    case 'account':
      router.push('/account')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}

const markAsRead = (notification: any) => {
  if (!notification.isRead) {
    notificationStore.markAsRead(notification.id)
  }
}

const markAllAsRead = () => {
  notificationStore.markAllAsRead()
}

watch(showNotifications, (val) => {
  if (val) {
    notificationStore.fetchNotifications()
  }
})
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: #001529;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #409eff;
  }
}

.notification-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-avatar {
  background-color: #409eff;
  color: #fff;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.user-role {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.main-content {
  background-color: #f5f5f5;
  overflow-y: auto;
  padding: 20px;
}

.notification-list {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  
  &.unread {
    background-color: #fafafa;
  }
  
  &:hover {
    background-color: #f5f5f5;
  }
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.notification-content {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-footer {
  text-align: center;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
