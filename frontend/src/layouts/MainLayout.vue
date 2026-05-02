<template>
  <el-container class="main-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="main-aside">
      <div class="logo-container">
        <img v-if="!isCollapse" src="/logo.svg" alt="Logo" class="logo" />
        <span v-if="!isCollapse" class="logo-text">服装ERP系统</span>
        <span v-else class="logo-text">ERP</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :router="true"
        :collapse-transition="false"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <el-sub-menu index="styles">
          <template #title>
            <el-icon><Picture /></el-icon>
            <span>款式管理</span>
          </template>
          <el-menu-item index="/styles">款式列表</el-menu-item>
          <el-menu-item v-if="userStore.isDesigner || userStore.isAdmin" index="/styles/create">新建款式</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="userStore.isPatternMaker || userStore.isDesigner || userStore.isAdmin" index="patterns">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>打版管理</span>
          </template>
          <el-menu-item index="/patterns">版单列表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="userStore.isPurchaser || userStore.isDesigner || userStore.isAdmin" index="boms">
          <template #title>
            <el-icon><List /></el-icon>
            <span>BOM管理</span>
          </template>
          <el-menu-item index="/boms">BOM列表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="userStore.isPurchaser || userStore.isFactory || userStore.isAdmin" index="materials">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>物料管理</span>
          </template>
          <el-menu-item v-if="userStore.isPurchaser || userStore.isAdmin" index="/materials">物料列表</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="main-header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              <router-link v-if="item.path" :to="item.path">{{ item.title }}</router-link>
              <span v-else>{{ item.title }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span class="user-name">{{ userStore.userName }}</span>
              <el-tag :type="roleTagType" size="small" class="role-tag">
                {{ userStore.getRoleName(userStore.currentRole!) }}
              </el-tag>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
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

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import type { Role } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const isCollapse = ref(false)
const unreadCount = ref(0)

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const crumbs: Array<{ path: string | null; title: string }> = []
  const matched = route.matched.filter((item) => item.meta?.title)
  
  matched.forEach((item, index) => {
    if (index === matched.length - 1) {
      crumbs.push({
        path: null,
        title: item.meta?.title as string,
      })
    } else {
      crumbs.push({
        path: item.path,
        title: item.meta?.title as string,
      })
    }
  })
  
  return crumbs
})

const roleTagType = computed(() => {
  const typeMap: Record<Role, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    designer: 'primary',
    pattern_maker: 'success',
    purchaser: 'warning',
    factory: 'danger',
    admin: 'info',
  }
  return userStore.currentRole ? typeMap[userStore.currentRole] : 'info'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    console.log('前往个人中心')
  }
}

watch(
  () => route.path,
  () => {
    unreadCount.value = notificationStore.unreadCount
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.main-container {
  height: 100%;
}

.main-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #3a4a5b;
  padding: 0 10px;
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
  background-color: #304156;
}

:deep(.el-menu) {
  background-color: #304156;
  border-right: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  color: #bfcbd9;
  
  &:hover {
    background-color: #263445;
  }
  
  &.is-active {
    background-color: #409eff;
    color: #fff;
  }
}

:deep(.el-sub-menu__title) {
  color: #bfcbd9;
  
  &:hover {
    background-color: #263445;
  }
}

:deep(.el-sub-menu .el-menu-item) {
  background-color: #1f2d3d;
}

.main-header {
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
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  margin-right: 15px;
  color: #606266;
  
  &:hover {
    color: #409eff;
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 10px;
  border-radius: 4px;
  
  &:hover {
    background-color: #f5f7fa;
  }
}

.user-avatar {
  background-color: #409eff;
}

.user-name {
  margin-left: 10px;
  color: #606266;
  font-size: 14px;
}

.role-tag {
  margin-left: 10px;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.notification-badge {
  margin-left: 10px;
}
</style>
