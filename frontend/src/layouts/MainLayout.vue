<template>
  <div class="main-layout">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>项目协作管理</h2>
      </div>
      
      <div class="sidebar-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="sidebar-menu-item"
          :class="{ 'is-active': isActive(item.path) }"
        >
          <el-icon class="sidebar-menu-item-icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </router-link>
      </div>
      
      <div class="sidebar-footer">
        <div class="user-info" @click="handleLogout">
          <div class="user-avatar">{{ userStore.user?.name?.charAt(0) }}</div>
          <div class="user-details">
            <div class="user-name">{{ userStore.user?.name }}</div>
            <div class="user-role">{{ userStore.roleName }}</div>
          </div>
          <el-icon class="logout-icon"><SwitchButton /></el-icon>
        </div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="top-header">
        <div class="top-header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="top-header-right">
          <el-tooltip content="通知" placement="bottom">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
              <el-icon class="header-icon"><Bell /></el-icon>
            </el-badge>
          </el-tooltip>
          
          <el-tooltip content="异常提醒" placement="bottom">
            <el-badge :value="exceptionCount" :hidden="exceptionCount === 0" type="danger" class="notification-badge">
              <el-icon class="header-icon"><Warning /></el-icon>
            </el-badge>
          </el-tooltip>
        </div>
      </div>
      
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const unreadCount = ref(0)
const exceptionCount = ref(0)

const menuItems = [
  { path: '/dashboard', title: '工作台', icon: 'Odometer' },
  { path: '/projects', title: '项目列表', icon: 'Folder' },
  { path: '/exceptions', title: '异常队列', icon: 'Warning' },
  { path: '/todos', title: '我的待办', icon: 'Document' },
  { path: '/settings', title: '设置', icon: 'Setting' }
]

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.meta.title)
  return matched.map(r => ({
    path: r.path,
    title: r.meta.title
  }))
})

const isActive = (path) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(path)
}

const fetchNotifications = async () => {
  try {
    const response = await api.get('/dashboard/notifications', { params: { unread_only: true, limit: 10 } })
    if (response.success) {
      unreadCount.value = response.data?.length || 0
    }
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}

const fetchExceptions = async () => {
  try {
    const response = await api.get('/dashboard/exceptions', { params: { status: 'pending' } })
    if (response.success) {
      exceptionCount.value = response.data?.length || 0
    }
  } catch (error) {
    console.error('获取异常失败:', error)
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出登录失败:', error)
    }
  }
}

onMounted(() => {
  fetchNotifications()
  fetchExceptions()
})
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.sidebar-menu {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-details {
  flex: 1;
  margin-left: 12px;
}

.user-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.user-role {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.logout-icon {
  color: #909399;
  font-size: 18px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.top-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 20px;
  color: #606266;
  cursor: pointer;
  transition: color 0.2s;
}

.header-icon:hover {
  color: #409eff;
}

.notification-badge {
  cursor: pointer;
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f5f7fa;
}
</style>
