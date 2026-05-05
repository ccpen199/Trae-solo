<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="logo">
        <el-icon size="24"><OfficeBuilding /></el-icon>
        <span class="title">人力资源管理系统</span>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/employees">
            <el-icon><User /></el-icon>
            <span>员工管理</span>
          </el-menu-item>
          <el-menu-item index="/departments">
            <el-icon><OfficeBuilding /></el-icon>
            <span>部门管理</span>
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
  height: 100%;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.logo {
  display: flex;
  align-items: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.logo .title {
  margin-left: 10px;
}

.app-aside {
  background-color: #304156;
}

.app-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.el-menu {
  border-right: none;
}

.page-container {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 4px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.status-tag-active {
  --el-tag-bg-color: #e1f3d8;
  --el-tag-text-color: #67c23a;
  --el-tag-border-color: #e1f3d8;
}

.status-tag-inactive {
  --el-tag-bg-color: #fef0f0;
  --el-tag-text-color: #f56c6c;
  --el-tag-border-color: #fef0f0;
}
</style>
