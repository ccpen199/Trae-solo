<template>
  <el-container class="main-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="main-aside">
      <div class="logo-wrapper">
        <el-icon v-if="isCollapse" class="logo-icon"><Food /></el-icon>
        <span v-else class="logo-text">外卖聚合系统</span>
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
          <el-icon><HomeFilled /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
        
        <el-sub-menu index="/order">
          <template #title>
            <el-icon><List /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/order/list">订单列表</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/after-sale">
          <template #title>
            <el-icon><WarningFilled /></el-icon>
            <span>售后管理</span>
          </template>
          <el-menu-item index="/after-sale/list">售后列表</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/platform">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>平台授权</span>
          </template>
          <el-menu-item index="/platform/auth">授权管理</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/goods">
          <template #title>
            <el-icon><Food /></el-icon>
            <span>菜品管理</span>
          </template>
          <el-menu-item index="/goods/mapping">菜品映射</el-menu-item>
          <el-menu-item index="/goods/list">菜品列表</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/print">
          <template #title>
            <el-icon><Printer /></el-icon>
            <span>打印管理</span>
          </template>
          <el-menu-item index="/print/setting">打印设置</el-menu-item>
          <el-menu-item index="/print/history">打印记录</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/statistics">
          <template #title>
            <el-icon><DataLine /></el-icon>
            <span>营业统计</span>
          </template>
          <el-menu-item index="/statistics/overview">统计概览</el-menu-item>
          <el-menu-item index="/statistics/daily">日报表</el-menu-item>
          <el-menu-item index="/statistics/goods-sales">菜品销量</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/audit">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>审计日志</span>
          </template>
          <el-menu-item index="/audit/trace">流程追踪</el-menu-item>
          <el-menu-item index="/audit/list">日志列表</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/setting">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/setting/store">店铺设置</el-menu-item>
          <el-menu-item index="/setting/account">账号设置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="main-header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="settings">账号设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
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
import { useUserStore } from '@/store/user'
import { ElMessageBox } from 'element-plus'
import type { RouteRecordRaw } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu as string
  }
  return path
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item: RouteRecordRaw) => item.meta && item.meta.title)
  return matched.map((item: RouteRecordRaw) => ({
    path: item.path,
    title: item.meta?.title as string
  })).slice(1)
})

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

async function handleCommand(command: string) {
  switch (command) {
    case 'profile':
    case 'settings':
      router.push('/setting/account')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await userStore.handleLogout()
        router.push('/login')
      } catch {
        // 取消
      }
      break
  }
}

watch(
  () => route.path,
  () => {
    window.scrollTo(0, 0)
  }
)
</script>

<style lang="scss" scoped>
.main-container {
  height: 100%;
  width: 100%;
}

.main-aside {
  background-color: #304156;
  transition: width 0.3s;
  
  .logo-wrapper {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    background-color: #263445;
    border-bottom: 1px solid #3a4a5c;
    
    .logo-icon {
      font-size: 24px;
    }
    
    .logo-text {
      margin-left: 8px;
    }
  }
  
  .el-menu {
    border-right: none;
  }
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .collapse-icon {
      font-size: 20px;
      cursor: pointer;
      margin-right: 16px;
      color: #606266;
      
      &:hover {
        color: #409eff;
      }
    }
    
    .breadcrumb {
      margin-left: 8px;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .user-name {
        margin: 0 8px;
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
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
