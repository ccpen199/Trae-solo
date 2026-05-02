<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="aside">
      <div class="logo">
        <span>冷链温控平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        router
        :unique-opened="true"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>监控大屏</span>
        </el-menu-item>
        
        <el-sub-menu index="tasks" v-if="canShowMenu('task')">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>任务管理</span>
          </template>
          <el-menu-item index="/tasks" v-if="hasRole(['shipper', 'carrier', 'driver'])">任务列表</el-menu-item>
          <el-menu-item index="/tasks/create" v-if="hasRole(['shipper'])">创建任务</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/temperature" v-if="canShowMenu('temperature')">
          <el-icon><DataLine /></el-icon>
          <span>温度监控</span>
        </el-menu-item>
        
        <el-menu-item index="/alarms" v-if="canShowMenu('alarm')">
          <el-icon><Bell /></el-icon>
          <span>告警管理</span>
        </el-menu-item>
        
        <el-menu-item index="/inspections" v-if="canShowMenu('inspection')">
          <el-icon><Finished /></el-icon>
          <span>验收管理</span>
        </el-menu-item>
        
        <el-menu-item index="/reports">
          <el-icon><DocumentCopy /></el-icon>
          <span>报告查询</span>
        </el-menu-item>
        
        <el-menu-item index="/quality" v-if="hasRole(['quality_control'])">
          <el-icon><DataAnalysis /></el-icon>
          <span>质控分析</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name !== 'Dashboard'">{{ $route.name }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ userStore.userInfo?.username }}</span>
              <el-tag size="small" type="info">{{ roleName }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const roleNames = {
  shipper: '货主',
  carrier: '承运商',
  driver: '司机',
  quality_control: '质控人员'
}

const roleName = computed(() => roleNames[userStore.userRole] || '')

const activeMenu = computed(() => route.path)

const hasRole = (roles) => {
  return roles.includes(userStore.userRole)
}

const canShowMenu = (menuType) => {
  const role = userStore.userRole
  const permissions = userStore.rolePermissions[role] || []
  
  switch (menuType) {
    case 'task':
      return permissions.some(p => p.startsWith('task'))
    case 'temperature':
      return permissions.includes('temperature:view')
    case 'alarm':
      return permissions.includes('alarm:view')
    case 'inspection':
      return permissions.some(p => p.startsWith('inspection'))
    default:
      return false
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
  color: #fff;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  background-color: #263445;
}

.header {
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}

.el-menu {
  border: none;
  background-color: transparent;
}

.el-menu-item, .el-sub-menu__title {
  color: #bfcbd9;
}

.el-menu-item:hover, .el-sub-menu__title:hover {
  background-color: #263445;
  color: #fff;
}

.el-menu-item.is-active {
  background-color: #409EFF !important;
  color: #fff;
}
</style>
