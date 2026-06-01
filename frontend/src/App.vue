<template>
  <el-container class="app-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28" color="#409EFF"><Collection /></el-icon>
        <span>话题标签系统</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        class="menu"
        background-color="transparent"
        text-color="#333"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/topics">
          <el-icon><CollectionTag /></el-icon>
          <span>话题库管理</span>
        </el-menu-item>
        <el-menu-item index="/posts">
          <el-icon><Document /></el-icon>
          <span>内容管理</span>
        </el-menu-item>
        <el-menu-item index="/moderation">
          <el-icon><CircleCheck /></el-icon>
          <span>审核队列</span>
          <el-badge v-if="pendingCount > 0" :value="pendingCount" :max="99" class="badge" />
        </el-menu-item>
        <el-menu-item index="/tag-changes">
          <el-icon><Clock /></el-icon>
          <span>变更日志</span>
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
          <el-tag type="info">管理员</el-tag>
        </div>
      </el-header>
      <el-main class="main">
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
import { ref, onMounted } from 'vue'
import { moderationApi } from './api'

const pendingCount = ref(0)

const loadPendingCount = async () => {
  try {
    const res = await moderationApi.list({ status: 0, pageSize: 1 })
    pendingCount.value = res.total
  } catch (e) {}
}

onMounted(() => {
  loadPendingCount()
})
</script>

<style scoped>
.app-container {
  height: 100vh;
}
.sidebar {
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
}
.menu {
  border-right: none;
}
.menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
}
.badge {
  margin-left: 8px;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
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
