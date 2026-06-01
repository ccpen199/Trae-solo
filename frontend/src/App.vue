<template>
  <el-container class="app-container">
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <el-icon size="28" color="#fff"><Van /></el-icon>
        <span class="logo-text">合规监管系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :default-openeds="['archive', 'supervise', 'enforcement', 'report']"
        class="sidebar-menu"
        background-color="#1f2937"
        text-color="#9ca3af"
        active-text-color="#fff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>监管总览</span>
        </el-menu-item>
        <el-sub-menu index="archive">
          <template #title>
            <el-icon><User /></el-icon>
            <span>档案管理</span>
          </template>
          <el-menu-item index="/platforms">平台企业</el-menu-item>
          <el-menu-item index="/drivers">司机档案</el-menu-item>
          <el-menu-item index="/vehicles">车辆档案</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="supervise">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>运营监管</span>
          </template>
          <el-menu-item index="/orders">订单抽查</el-menu-item>
          <el-menu-item index="/complaints">投诉管理</el-menu-item>
          <el-menu-item index="/work-orders">核查工单</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="enforcement">
          <template #title>
            <el-icon><Scale /></el-icon>
            <span>执法流程</span>
          </template>
          <el-menu-item index="/cases">执法案件</el-menu-item>
          <el-menu-item index="/penalties">处罚记录</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="report">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>统计报表</span>
          </template>
          <el-menu-item index="/reports">监管报表</el-menu-item>
          <el-menu-item index="/logs">操作日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag type="success">监管部门</el-tag>
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" style="background-color: #3b82f6">
                {{ userName.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userName }}</span>
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
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const userName = ref('监管员')

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')
</script>

<style scoped>
.app-container {
  height: 100%;
}

.sidebar {
  background-color: #1f2937;
  overflow-x: hidden;
}

.logo {
  display: flex;
  align-items: center;
  padding: 20px;
  color: #fff;
  border-bottom: 1px solid #374151;
}

.logo-text {
  margin-left: 12px;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-menu {
  border-right: none;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  height: 60px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  color: #374151;
}

.main-content {
  padding: 0;
  background-color: #f3f4f6;
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
