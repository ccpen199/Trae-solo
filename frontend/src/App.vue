<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="32" color="#409EFF"><Odometer /></el-icon>
        <span>OEE设备效率系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
        background-color="transparent"
        text-color="#303133"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>OEE看板</span>
        </el-menu-item>
        <el-menu-item index="/devices">
          <el-icon><Tools /></el-icon>
          <span>设备台账</span>
        </el-menu-item>
        <el-menu-item index="/operation-records">
          <el-icon><Document /></el-icon>
          <span>运行记录</span>
        </el-menu-item>
        <el-menu-item index="/production-records">
          <el-icon><Box /></el-icon>
          <span>产量统计</span>
        </el-menu-item>
        <el-menu-item index="/oee-report">
          <el-icon><TrendCharts /></el-icon>
          <span>效率报表</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-user">
          <el-avatar :size="32">管</el-avatar>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': 'OEE综合看板',
    '/devices': '设备台账管理',
    '/operation-records': '设备运行记录',
    '/production-records': '产量与良品统计',
    '/oee-report': 'OEE效率报表'
  }
  return titles[route.path] || 'OEE设备效率系统'
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
}

.logo {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-menu {
  border-right: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.main-content {
  background-color: #f5f7fa;
  padding: 24px;
  overflow: auto;
}
</style>
