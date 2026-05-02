<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <div class="header-left">
        <el-icon :size="32" color="#fff"><House /></el-icon>
        <span class="system-name">房屋3D看房系统</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        background-color="transparent"
        text-color="#fff"
        active-text-color="#ffd04b"
        router
        class="header-menu"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/houses">
          <el-icon><OfficeBuilding /></el-icon>
          <span>房源列表</span>
        </el-menu-item>
        <el-menu-item index="/sessions">
          <el-icon><List /></el-icon>
          <span>看房会话</span>
        </el-menu-item>
        <el-menu-item index="/messages">
          <el-icon><Bell /></el-icon>
          <span>消息中心</span>
          <el-badge :value="userStore.todoCount.messageCount" :hidden="!userStore.todoCount.messageCount" class="message-badge" />
        </el-menu-item>
      </el-menu>
      
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" icon="UserFilled" />
            <span class="user-name">{{ userStore.user?.name }}</span>
            <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>个人中心
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    
    <el-main class="layout-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { 
  House, HomeFilled, OfficeBuilding, List, Bell, 
  User, SwitchButton, UserFilled 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const roleLabel = computed(() => {
  const roleMap = {
    admin: '管理员',
    developer: '开发商',
    agent: '经纪人',
    buyer: '购房者'
  }
  return roleMap[userStore.user?.role] || userStore.user?.role
})

const roleTagType = computed(() => {
  const typeMap = {
    admin: 'danger',
    developer: 'warning',
    agent: 'success',
    buyer: 'primary'
  }
  return typeMap[userStore.user?.role] || 'info'
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background: #f0f2f5;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.system-name {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 1px;
}

.header-menu {
  flex: 1;
  justify-content: center;
  border-bottom: none;
}

.header-menu :deep(.el-menu-item) {
  height: 60px;
  line-height: 60px;
  border-bottom: none;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
}

.message-badge {
  margin-left: 4px;
}

.layout-main {
  padding: 24px;
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
