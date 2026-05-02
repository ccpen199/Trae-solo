<template>
  <div class="app-container">
    <template v-if="isLoggedIn">
      <el-container>
        <el-header class="app-header">
          <div class="header-content">
            <div class="logo">
              <el-icon :size="24" color="#409EFF"><Star /></el-icon>
              <span>公益透明平台</span>
            </div>
            <el-menu
              :default-active="activeMenu"
              mode="horizontal"
              background-color="transparent"
              text-color="#303133"
              active-text-color="#409EFF"
              router
            >
              <el-menu-item index="/dashboard">首页</el-menu-item>
              <el-menu-item index="/projects">项目列表</el-menu-item>
              <el-menu-item index="/ngo/projects" v-if="userRole === 'ngo'">项目管理</el-menu-item>
              <el-menu-item index="/donations/my" v-if="userRole === 'donor'">我的捐赠</el-menu-item>
              <el-menu-item index="/tasks/my" v-if="userRole === 'executor'">我的任务</el-menu-item>
              <el-menu-item index="/audits" v-if="userRole === 'auditor'">审计管理</el-menu-item>
              <el-menu-item index="/track">溯源查询</el-menu-item>
            </el-menu>
            <div class="user-info">
              <el-dropdown @command="handleCommand">
                <span class="username">
                  <el-tag :type="roleTagType" size="small">{{ roleName }}</el-tag>
                  {{ userName }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './stores/user'
import { Star, ArrowDown } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userName = computed(() => userStore.user?.name || '')
const userRole = computed(() => userStore.user?.role || '')
const activeMenu = computed(() => route.path)

const roleName = computed(() => {
  const roles = {
    'donor': '捐赠人',
    'ngo': '公益机构',
    'executor': '执行人',
    'auditor': '审计师'
  }
  return roles[userRole.value] || '访客'
})

const roleTagType = computed(() => {
  const types = {
    'donor': 'success',
    'ngo': 'primary',
    'executor': 'warning',
    'auditor': 'danger'
  }
  return types[userRole.value] || 'info'
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.app-container {
  height: 100%;
}

.el-container {
  height: 100%;
}

.app-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 0 20px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.el-menu--horizontal {
  border-bottom: none !important;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.app-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.status-tag {
  margin-right: 8px;
}
</style>
