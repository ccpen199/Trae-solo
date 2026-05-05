<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="220px" class="admin-aside">
        <div class="admin-logo">
          <h2>管理后台</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
          router
          class="admin-menu"
        >
          <el-menu-item index="/admin">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/resources">
            <el-icon><Document /></el-icon>
            <span>资源审核</span>
          </el-menu-item>
          <el-menu-item index="/admin/comments">
            <el-icon><ChatLineRound /></el-icon>
            <span>评论审核</span>
          </el-menu-item>
          <el-menu-item index="/admin/categories">
            <el-icon><Menu /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="admin-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item><span v-if="currentPage">{{ currentPage }}</span></el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-button text @click="$router.push('/')">
              <el-icon><Back /></el-icon>
              返回前台
            </el-button>
          </div>
        </el-header>
        <el-main class="admin-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DataAnalysis, User, Document, ChatLineRound, Menu, Back } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  if (route.path === '/admin') return '/admin'
  return route.path
})

const currentPage = computed(() => {
  const pathMap = {
    '/admin': '数据统计',
    '/admin/users': '用户管理',
    '/admin/resources': '资源审核',
    '/admin/comments': '评论审核',
    '/admin/categories': '分类管理'
  }
  return pathMap[route.path] || '管理后台'
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.el-container {
  height: 100vh;
}

.admin-aside {
  background-color: #304156;
}

.admin-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #3a4a5b;
}

.admin-logo h2 {
  color: #fff;
  font-size: 18px;
  margin: 0;
}

.admin-menu {
  border-right: none;
}

.admin-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-main {
  background-color: #f0f2f5;
  padding: 24px;
}
</style>
