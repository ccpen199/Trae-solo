<template>
  <el-container class="main-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <img v-if="!isCollapse" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%2367c23a'/%3E%3Cpath d='M20 8L10 20h5v10h10V20h5z' fill='white'/%3E%3C/svg%3E" alt="logo">
        <span v-if="!isCollapse" class="logo-text">光伏运维</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <template #title>运营看板</template>
        </el-menu-item>
        <el-menu-item index="/map">
          <el-icon><MapLocation /></el-icon>
          <template #title>地图监控</template>
        </el-menu-item>
        <el-menu-item index="/stations">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>电站管理</template>
        </el-menu-item>
        <el-menu-item index="/inverters">
          <el-icon><Cpu /></el-icon>
          <template #title>设备监控</template>
        </el-menu-item>
        <el-menu-item index="/maintenance">
          <el-icon><Tools /></el-icon>
          <template #title>维修工单</template>
        </el-menu-item>
        <el-menu-item index="/cleaning">
          <el-icon><MagicStick /></el-icon>
          <template #title>清洗工单</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole('investor', 'station_owner', 'admin')" index="/revenue">
          <el-icon><Money /></el-icon>
          <template #title>收益分析</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole('investor', 'station_owner', 'admin')" index="/assets">
          <el-icon><TrendCharts /></el-icon>
          <template #title>资产估值</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-icon class="header-icon" @click="goNotifications">
              <Bell />
            </el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.name }}</span>
              <el-tag :type="roleTagType" size="small" effect="plain" class="role-tag">
                {{ userStore.roleLabel }}
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
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
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const unreadCount = ref(0)
let notificationTimer = null

const activeMenu = computed(() => route.path)

const roleTagType = computed(() => {
  const types = {
    admin: 'danger',
    station_owner: 'primary',
    maintenance_worker: 'success',
    investor: 'warning',
    equipment_vendor: 'info'
  }
  return types[userStore.role] || 'info'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const goNotifications = () => {
  router.push('/notifications')
}

const fetchUnreadCount = async () => {
  try {
    const result = await api.get('/notifications/count')
    unreadCount.value = result.unread_count || 0
  } catch (e) {
    console.log('Fetch unread count error:', e)
  }
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await userStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    } catch (e) {
      if (e !== 'cancel') {
        console.error('Logout error:', e)
      }
    }
  } else if (command === 'profile') {
    ElMessage.info('个人信息页面开发中')
  }
}

onMounted(() => {
  fetchUnreadCount()
  notificationTimer = setInterval(fetchUnreadCount, 30000)
})

onUnmounted(() => {
  if (notificationTimer) {
    clearInterval(notificationTimer)
  }
})
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid #3a4a5b;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  margin-left: 10px;
  white-space: nowrap;
}

.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
  transition: color 0.3s;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  cursor: pointer;
}

.header-icon {
  font-size: 20px;
  color: #606266;
  cursor: pointer;
  transition: color 0.3s;
}

.header-icon:hover {
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background-color: #409eff;
}

.username {
  font-size: 14px;
  color: #303133;
}

.role-tag {
  margin-left: 5px;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
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
