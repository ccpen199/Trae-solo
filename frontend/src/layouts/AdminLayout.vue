<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">
        <el-icon size="32" color="#fff"><OfficeBuilding /></el-icon>
        <span>政务管理后台</span>
      </div>
      
      <el-menu
        :default-active="$route.path"
        class="menu"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409eff"
      >
        <el-menu-item index="/admin">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        
        <el-sub-menu index="service">
          <template #title>
            <el-icon><Service /></el-icon>
            <span>服务管理</span>
          </template>
          <el-menu-item index="/admin/service-items">事项管理</el-menu-item>
          <el-menu-item index="/admin/scenarios">场景服务</el-menu-item>
          <el-menu-item index="/admin/policies">政策管理</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/admin/applications">
          <el-icon><Document /></el-icon>
          <span>办件管理</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/evaluations">
          <el-icon><Star /></el-icon>
          <span>评价管理</span>
        </el-menu-item>
        
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/admin/users">用户管理</el-menu-item>
          <el-menu-item index="/admin/departments">部门管理</el-menu-item>
          <el-menu-item index="/admin/regions">区域管理</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="analysis">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>统计分析</span>
          </template>
          <el-menu-item index="/admin/statistics">效能统计</el-menu-item>
          <el-menu-item index="/admin/audit-logs">审计日志</el-menu-item>
          <el-menu-item index="/admin/alerts">异常预警</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>
    
    <div class="main">
      <header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>管理后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="28">{{ userStore.userInfo?.real_name?.charAt(0) || '管' }}</el-avatar>
              <span>{{ userStore.userInfo?.real_name || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="home">
                  <el-icon><HomeFilled /></el-icon>返回前台
                </el-dropdown-item>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()

const handleCommand = async (command) => {
  switch (command) {
    case 'home':
      router.push('/')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await userStore.logout()
        router.push('/login')
      } catch (e) {}
      break
  }
}
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #001529;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  
  .logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #1f1f1f;
  }
  
  .menu {
    flex: 1;
    border-right: none;
    
    .el-menu-item, .el-sub-menu__title {
      height: 50px;
      line-height: 50px;
    }
  }
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  min-width: 0;
}

.header {
  height: 64px;
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  
  .header-right .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #606266;
  }
}

.content {
  flex: 1;
  padding: 24px;
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
</style>
