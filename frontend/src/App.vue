<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon :size="24"><Landscape /></el-icon>
        <span>土地流转平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        @select="handleMenuSelect"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409EFF">
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>运营首页</span>
        </el-menu-item>
        <el-menu-item index="/parcels">
          <el-icon><OfficeBuilding /></el-icon>
          <span>地块库</span>
        </el-menu-item>
        <el-menu-item index="/demands">
          <el-icon><List /></el-icon>
          <span>流转需求</span>
        </el-menu-item>
        <el-menu-item index="/contracts">
          <el-icon><Document /></el-icon>
          <span>合同管理</span>
        </el-menu-item>
        <el-menu-item index="/performance">
          <el-icon><Finished /></el-icon>
          <span>履约管理</span>
        </el-menu-item>
        <el-menu-item index="/disputes">
          <el-icon><Warning /></el-icon>
          <span>纠纷处理</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><PieChart /></el-icon>
          <span>监管报表</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><DocumentCopy /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute">{{ currentRouteName }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-dropdown>
            <span class="user-dropdown">
              <el-icon><UserFilled /></el-icon>
              <span>{{ currentUser }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
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
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const activeMenu = ref(route.path)
const currentUser = ref('管理员')

const currentRoute = computed(() => route.path !== '/dashboard')
const currentRouteName = computed(() => {
  const routeMap = {
    '/parcels': '地块库',
    '/demands': '流转需求',
    '/contracts': '合同管理',
    '/performance': '履约管理',
    '/disputes': '纠纷处理',
    '/reports': '监管报表',
    '/users': '用户管理',
    '/logs': '操作日志'
  }
  return routeMap[route.path] || ''
})

const handleMenuSelect = (index) => {
  activeMenu.value = index
  router.push(index)
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #001529;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #1f3a57;
}

.logo span {
  margin-left: 10px;
}

.menu {
  border-right: none;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.main {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
