<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <el-icon size="28" color="#409EFF"><DataAnalysis /></el-icon>
          <span class="logo-text">AI职业发展协同平台</span>
        </div>
        <el-menu mode="horizontal" :default-active="activeMenu" @select="handleMenuSelect" class="nav-menu">
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="resume">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>求职者中心</span>
            </template>
            <el-menu-item index="/resume">简历解析</el-menu-item>
            <el-menu-item index="/resume/list">简历管理</el-menu-item>
            <el-menu-item index="/interview">AI模拟面试</el-menu-item>
            <el-menu-item index="/career">职业规划</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="employer">
            <template #title>
              <el-icon><OfficeBuilding /></el-icon>
              <span>企业中心</span>
            </template>
            <el-menu-item index="/talent">人才寻源</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="data">
            <template #title>
              <el-icon><TrendCharts /></el-icon>
              <span>数据看板</span>
            </template>
            <el-menu-item index="/dashboard">综合看板</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>管理后台</span>
            </template>
            <el-menu-item index="/admin">反作弊管理</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
    <el-footer class="app-footer">
      <p>© 2026 AI职业发展协同平台 - 让人才发展更高效</p>
    </el-footer>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)

const handleMenuSelect = (index) => {
  if (index.startsWith('/')) {
    window.location.href = index
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  height: 64px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 40px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin-left: 10px;
}

.nav-menu {
  flex: 1;
  background: transparent;
  border-bottom: none;
}

.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.nav-menu :deep(.el-menu-item:hover),
.nav-menu :deep(.el-sub-menu__title:hover) {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: white;
  background: rgba(255, 255, 255, 0.2);
}

.nav-menu :deep(.el-menu--horizontal > .el-sub-menu .el-sub-menu__title) {
  border-bottom: none;
  height: 64px;
  line-height: 64px;
}

.nav-menu :deep(.el-menu--horizontal > .el-menu-item) {
  border-bottom: none;
  height: 64px;
  line-height: 64px;
}

.app-main {
  background: #f5f7fa;
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.app-footer {
  background: #2c3e50;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 20px 0;
  font-size: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
