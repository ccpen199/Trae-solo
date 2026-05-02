<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo-container">
        <el-icon class="logo-icon" :size="isCollapse ? 28 : 32">
          <OfficeBuilding />
        </el-icon>
        <span class="logo-text" v-show="!isCollapse">零售SaaS管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        :unique-opened="true"
        :router="true"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <sidebar-item
          v-for="route in sidebarRoutes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-aside>
    
    <el-container class="layout-main">
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta?.title || item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ userStore.realName?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.realName || '用户' }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>
                  修改密码
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
      
      <el-main class="layout-content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import SidebarItem from './components/SidebarItem.vue'
import { 
  OfficeBuilding, 
  Fold, 
  Expand, 
  ArrowDown, 
  User, 
  Lock, 
  SwitchButton 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const isCollapse = computed(() => appStore.sidebar.collapsed)
const cachedViews = computed(() => appStore.cachedViews)
const sidebarRoutes = computed(() => {
  return filterAsyncRoutes(route.matched[0]?.children || [])
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta && item.meta.title)
})

function filterAsyncRoutes(routes) {
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (!tmp.hidden) {
      if (tmp.children && tmp.children.length > 0) {
        tmp.children = filterAsyncRoutes(tmp.children)
      }
      res.push(tmp)
    }
  })
  return res
}

function toggleSidebar() {
  appStore.toggleSidebar()
}

async function handleCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/dashboard')
      break
    case 'password':
      router.push('/dashboard')
      break
    case 'logout':
      await userStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100%;
  width: 100%;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
  
  .logo-container {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    background-color: #263445;
    border-bottom: 1px solid #3a4a5c;
    
    .logo-icon {
      color: #fff;
    }
    
    .logo-text {
      margin-left: 12px;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }
  
  .el-menu {
    border-right: none;
    height: calc(100vh - 50px);
  }
}

.layout-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  height: 50px;
  flex-shrink: 0;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      margin-right: 16px;
      padding: 4px;
      transition: color 0.3s;
      
      &:hover {
        color: #409eff;
      }
    }
    
    .breadcrumb {
      font-size: 14px;
    }
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 4px;
      transition: background-color 0.3s;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      .user-avatar {
        background-color: #409eff;
        color: #fff;
      }
      
      .user-name {
        margin: 0 8px;
        font-size: 14px;
      }
      
      .dropdown-icon {
        font-size: 12px;
      }
    }
  }
}

.layout-content {
  padding: 20px;
  background-color: #f0f2f5;
  overflow-y: auto;
  flex: 1;
}

.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
