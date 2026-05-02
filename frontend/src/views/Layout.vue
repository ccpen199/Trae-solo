<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <el-icon :size="24" color="#409eff"><Document /></el-icon>
        <span class="logo-text">低代码表单</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="layout-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/forms">
          <el-icon><Collection /></el-icon>
          <span>表单列表</span>
        </el-menu-item>
        <el-menu-item index="/forms/design">
          <el-icon><EditPen /></el-icon>
          <span>表单设计</span>
        </el-menu-item>
        <el-menu-item index="/submissions">
          <el-icon><List /></el-icon>
          <span>提交记录</span>
        </el-menu-item>
        <el-menu-item index="/audit">
          <el-icon><Clock /></el-icon>
          <span>审计时间线</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="userStore.unreadCount" :hidden="userStore.unreadCount === 0" class="notification-badge">
            <el-button type="text" @click="showNotifications = true">
              <el-icon :size="18"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon :size="18"><User /></el-icon>
              <span>{{ userStore.user?.username }}</span>
              <el-tag v-if="userStore.isAdmin" size="small" type="danger">管理员</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>

    <el-drawer
      v-model="showNotifications"
      title="通知消息"
      direction="rtl"
      size="400px"
    >
      <div class="notification-list">
        <div v-if="notifications.length === 0" class="empty-state">
          <el-empty description="暂无通知消息" />
        </div>
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.is_read }"
          @click="handleReadNotification(notification)"
        >
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-content">{{ notification.content }}</div>
          <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
        </div>
      </div>
      <div class="notification-footer">
        <el-button type="text" @click="handleMarkAllRead" v-if="hasUnread">
          全部标为已读
        </el-button>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store'
import { commonApi } from '@/api'
import type { Notification } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const showNotifications = ref(false)
const notifications = ref<Notification[]>([])

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => {
  const matched = route.matched[route.matched.length - 1]
  return matched?.meta?.title as string
})

const hasUnread = computed(() => notifications.value.some(n => !n.is_read))

const fetchNotifications = async () => {
  try {
    const result = await commonApi.getNotifications({ page: 1, page_size: 20 })
    notifications.value = result.data
  } catch (error) {
    console.error('Fetch notifications error:', error)
  }
}

const handleReadNotification = async (notification: Notification) => {
  if (!notification.is_read) {
    try {
      await commonApi.markNotificationRead(notification.id)
      notification.is_read = true
      userStore.fetchUnreadCount()
    } catch (error) {
      console.error('Mark read error:', error)
    }
  }
}

const handleMarkAllRead = async () => {
  try {
    await commonApi.markAllNotificationsRead()
    notifications.value.forEach(n => n.is_read = true)
    userStore.fetchUnreadCount()
    ElMessage.success('已全部标为已读')
  } catch (error) {
    console.error('Mark all read error:', error)
  }
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await userStore.logout()
      router.push('/login')
    } catch {
      // User cancelled
    }
  }
}

watch(showNotifications, (val) => {
  if (val) {
    fetchNotifications()
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid #3a4a5b;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.layout-menu {
  border-right: none;
}

.layout-header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.notification-list {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #ecf5ff;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-content {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
}

.empty-state {
  padding: 40px;
}
</style>
