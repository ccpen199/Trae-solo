<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <el-icon size="28" color="#409eff"><Tickets /></el-icon>
        <h1>高铁乘务排班系统</h1>
      </div>
      <div class="header-right">
        <span class="user-info">管理员</span>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="220px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          router
          class="side-menu"
        >
          <el-menu-item index="/">
            <el-icon><DataAnalysis /></el-icon>
            <span>运营概览</span>
          </el-menu-item>
          <el-menu-item index="/fleets">
            <el-icon><OfficeBuilding /></el-icon>
            <span>车队管理</span>
          </el-menu-item>
          <el-menu-item index="/crew">
            <el-icon><User /></el-icon>
            <span>乘务人员</span>
          </el-menu-item>
          <el-menu-item index="/trains">
            <el-icon><Van /></el-icon>
            <span>车次任务</span>
          </el-menu-item>
          <el-menu-item index="/scheduling">
            <el-icon><Calendar /></el-icon>
            <span>智能排班</span>
          </el-menu-item>
          <el-menu-item index="/shift-changes">
            <el-icon><Refresh /></el-icon>
            <span>调班管理</span>
          </el-menu-item>
          <el-menu-item index="/reports">
            <el-icon><Document /></el-icon>
            <span>统计报表</span>
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
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
}

.app-container {
  height: 100vh;
}

.app-header {
  background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px !important;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  font-size: 20px;
  font-weight: 500;
}

.app-aside {
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
}

.side-menu {
  border-right: none;
  background: transparent;
}

.app-main {
  background: #f1f5f9;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  color: #1e293b;
}

.card-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
