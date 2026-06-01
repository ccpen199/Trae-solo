<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="24"><Suitcase /></el-icon>
        <span class="logo-text">行李追踪系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2d3d"
        text-color="#c0ccda"
        active-text-color="#409eff"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>运营概览</span>
        </el-menu-item>
        <el-menu-item index="/admin/baggage">
          <el-icon><Suitcase /></el-icon>
          <span>行李档案</span>
        </el-menu-item>
        <el-menu-item index="/admin/baggage/create">
          <el-icon><Plus /></el-icon>
          <span>录入行李</span>
        </el-menu-item>
        <el-menu-item index="/admin/nodes">
          <el-icon><Location /></el-icon>
          <span>节点追踪</span>
        </el-menu-item>
        <el-menu-item index="/admin/exceptions">
          <el-icon><Warning /></el-icon>
          <span>异常处理</span>
        </el-menu-item>
        <el-menu-item index="/admin/compensation">
          <el-icon><Money /></el-icon>
          <span>赔付管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/stats">
          <el-icon><TrendCharts /></el-icon>
          <span>统计分析</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag type="info">
            <el-icon><Monitor /></el-icon>
            管理后台
          </el-tag>
          <el-button type="primary" size="small" @click="goToTrack">
            <el-icon><User /></el-icon>
            旅客查询
          </el-button>
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

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

function goToTrack() {
  router.push('/track')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: #1f2d3d;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  padding: 20px;
  color: #fff;
  border-bottom: 1px solid #3d4f65;
}

.logo-text {
  margin-left: 10px;
  font-size: 16px;
  font-weight: 600;
}

.sidebar :deep(.el-menu) {
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

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
