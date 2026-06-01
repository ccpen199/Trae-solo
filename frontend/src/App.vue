<template>
  <el-container class="app-container">
    <el-header class="header">
      <div class="logo">
        <el-icon><Connection /></el-icon>
        <span>Webhook 调试控制台</span>
      </div>
      <div class="user-info">
        <el-tag type="info">当前用户: {{ currentUser?.name || '管理员' }}</el-tag>
        <el-dropdown @command="switchUser">
          <el-button link>
            <el-icon><User /></el-icon>
            切换用户
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="user-1">系统管理员 (admin)</el-dropdown-item>
              <el-dropdown-item command="user-2">运维工程师 (devops)</el-dropdown-item>
              <el-dropdown-item command="user-3">开发工程师 (developer)</el-dropdown-item>
              <el-dropdown-item command="user-4">安全管理员 (security)</el-dropdown-item>
              <el-dropdown-item command="user-5">应用负责人 (owner)</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          class="menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>概览面板</span>
          </el-menu-item>
          <el-sub-menu index="apps">
            <template #title>
              <el-icon><OfficeBuilding /></el-icon>
              <span>应用管理</span>
            </template>
            <el-menu-item index="/applications">应用列表</el-menu-item>
            <el-menu-item index="/configs">Webhook配置</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="exec">
            <template #title>
              <el-icon><VideoPlay /></el-icon>
              <span>执行中心</span>
            </template>
            <el-menu-item index="/console">调试控制台</el-menu-item>
            <el-menu-item index="/executions">执行任务</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="audit">
            <template #title>
              <el-icon><DocumentChecked /></el-icon>
              <span>审计中心</span>
            </template>
            <el-menu-item index="/changes">变更单管理</el-menu-item>
            <el-menu-item index="/exceptions">异常处理</el-menu-item>
            <el-menu-item index="/alerts">告警中心</el-menu-item>
            <el-menu-item index="/audit">操作日志</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/reports">
            <el-icon><Histogram /></el-icon>
            <span>报表分析</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { users } from '@/api'
import api from '@/api'

const route = useRoute()
const currentUser = ref(null)

const activeMenu = computed(() => route.path)

const fetchUser = async () => {
  try {
    currentUser.value = await users.me()
  } catch (e) {
    console.error(e)
  }
}

const switchUser = (userId) => {
  api.defaults.headers['X-User-Id'] = userId
  fetchUser()
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.header {
  background: linear-gradient(90deg, #1e3a8a, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar {
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
}

.menu {
  border-right: none;
}

.main-content {
  background: #f1f5f9;
  padding: 24px;
}
</style>
