<template>
  <el-container class="app-container">
    <el-aside width="220px" class="app-aside">
      <div class="logo">
        <el-icon :size="28"><UserFilled /></el-icon>
        <span class="title">撞库联登系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        
        <el-sub-menu index="config">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>配置管理</span>
          </template>
          <el-menu-item index="/config/access">准入配置</el-menu-item>
          <el-menu-item index="/config/collision">撞库配置</el-menu-item>
          <el-menu-item index="/config/channels">渠道管理</el-menu-item>
          <el-menu-item index="/config/products">产品管理</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/test">
          <el-icon><Connection /></el-icon>
          <span>接口测试</span>
        </el-menu-item>
        
        <el-menu-item index="/records">
          <el-icon><Document /></el-icon>
          <span>请求记录</span>
        </el-menu-item>
        
        <el-menu-item index="/blacklist">
          <el-icon><Warning /></el-icon>
          <span>黑名单管理</span>
        </el-menu-item>
        
        <el-menu-item index="/alerts">
          <el-icon><Bell /></el-icon>
          <span>报警记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRouteName">{{ currentRouteName }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag type="primary" size="small">开发环境</el-tag>
          <el-divider direction="vertical" />
          <span class="system-time">{{ systemTime }}</span>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => route.path)
const currentRouteName = computed(() => route.meta?.title || '')

const systemTime = ref('')
let timer = null

const getTime = () => {
  const now = new Date()
  systemTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  getTime()
  timer = setInterval(getTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100%;
}

.app-aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5b;
}

.logo .title {
  white-space: nowrap;
}

.el-menu {
  border-right: none;
}

.app-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.system-time {
  color: #606266;
  font-size: 14px;
}

.app-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.page-container {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.status-tag {
  margin-right: 5px;
}
</style>
