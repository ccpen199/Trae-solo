<template>
  <el-container class="main-layout">
    <el-header class="app-header">
      <div class="header-left">
        <el-icon class="logo-icon"><ScaleToOriginal /></el-icon>
        <span class="app-title">法律案件管理系统</span>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ userStore.userInfo?.name }}
            <el-tag :class="`role-tag-${userStore.role}`" size="small" style="margin-left: 8px;">
              {{ roleText }}
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
    
    <el-container>
      <el-aside width="200px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          class="aside-menu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/cases">
            <el-icon><Document /></el-icon>
            <span>案件管理</span>
          </el-menu-item>
          
          <el-menu-item v-if="userStore.isLawyer" index="/cases/create">
            <el-icon><Plus /></el-icon>
            <span>新建案件</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const roleText = computed(() => {
  const roleMap = {
    lead_lawyer: '主办律师',
    assistant: '助理',
    client: '客户',
    finance: '财务'
  }
  return roleMap[userStore.role] || userStore.role
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  color: #fff;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.user-info:hover {
  opacity: 0.9;
}

.app-aside {
  background-color: #304156;
}

.aside-menu {
  border-right: none;
}

.app-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .app-aside {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .app-aside.mobile-open {
    transform: translateX(0);
  }
}
</style>
