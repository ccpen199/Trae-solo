<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <span v-if="!isCollapse">供应链金融平台</span>
        <span v-else>SCF</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item
          v-for="menu in menus"
          :key="menu.path"
          :index="menu.path"
        >
          <el-icon><component :is="menu.icon" /></el-icon>
          <template #title>{{ menu.label }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPage !== 'Dashboard'">{{ currentPage }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-badge :value="pendingMsgCount" :hidden="pendingMsgCount === 0" class="header-badge">
            <el-button text @click="goToMessages">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.userName }} ({{ roleLabel }})
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { roleMenus, roleMap } from '@/api'
import * as api from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const pendingMsgCount = ref(0)

const activeMenu = computed(() => route.path)

const menus = computed(() => {
  const role = userStore.role
  return roleMenus[role] || roleMenus['admin']
})

const roleLabel = computed(() => {
  const role = userStore.role
  return roleMap[role]?.label || role
})

const currentPage = computed(() => {
  const menu = menus.value.find(m => m.path === route.path)
  return menu?.label || 'Dashboard'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const goToMessages = () => {
  router.push('/messages')
}

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
  }
}

const fetchPendingMsgCount = async () => {
  try {
    const res = await api.getPendingMessageCount()
    pendingMsgCount.value = res.count
  } catch (error) {
    console.error('获取待办消息数失败:', error)
  }
}

onMounted(() => {
  fetchPendingMsgCount()
})

watch(
  () => route.path,
  () => {
    fetchPendingMsgCount()
  }
)
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
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
  font-weight: 600;
  background-color: #263445;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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
  gap: 16px;
}

.header-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  cursor: pointer;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none;
}
</style>
