<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28"><Lightning /></el-icon>
        <span>能耗分摊系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/meters">
          <el-icon><Monitor /></el-icon>
          <span>表计档案</span>
        </el-menu-item>
        <el-menu-item index="/readings">
          <el-icon><Edit /></el-icon>
          <span>抄表录入</span>
        </el-menu-item>
        <el-menu-item index="/review">
          <el-icon><Warning /></el-icon>
          <span>异常复核</span>
        </el-menu-item>
        <el-menu-item index="/rules">
          <el-icon><Setting /></el-icon>
          <span>分摊规则</span>
        </el-menu-item>
        <el-menu-item index="/bills">
          <el-icon><Tickets /></el-icon>
          <span>账单管理</span>
        </el-menu-item>
        <el-menu-item index="/enterprises">
          <el-icon><OfficeBuilding /></el-icon>
          <span>企业管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="title">{{ pageTitle }}</span>
        <div class="user-info">
          <el-icon><User /></el-icon>
          <span>管理员</span>
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
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '能耗分摊系统')
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.sidebar {
  background: #001529;
  color: #fff;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f3557;
}
.menu {
  border: none;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-size: 20px;
  font-weight: bold;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}
.main {
  background: #f0f2f5;
  overflow: auto;
}
</style>
