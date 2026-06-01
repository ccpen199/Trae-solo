<template>
  <el-container class="app-container">
    <el-header class="header">
      <div class="header-title">
        <el-icon size="32"><House /></el-icon>
        <span>BIM 问题协同平台</span>
      </div>
      <div class="header-user">
        <el-dropdown @command="handleUserChange">
          <span class="user-info">
            <el-icon><User /></el-icon>
            <span>{{ userStore.currentUser.name }}</span>
            <el-tag size="small" type="info" style="margin-left: 8px">{{ userStore.currentUser.org_name }}</el-tag>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="user in userStore.users"
                :key="user.id"
                :command="user"
                :divided="user.id === 2"
              >
                <span style="display: flex; align-items: center; gap: 8px">
                  <span>{{ user.name }}</span>
                  <el-tag size="small">{{ user.org_name }}</el-tag>
                </span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="aside">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/issues">
            <el-icon><Document /></el-icon>
            <span>问题管理</span>
          </el-menu-item>
          <el-menu-item index="/model">
            <el-icon><Box /></el-icon>
            <span>模型视图</span>
          </el-menu-item>
          <el-menu-item index="/organizations">
            <el-icon><OfficeBuilding /></el-icon>
            <span>责任单位</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from './stores/user'

const route = useRoute()
const userStore = useUserStore()
const activeMenu = computed(() => route.path)

const handleUserChange = (user) => {
  userStore.setUser(user)
  ElMessage.success(`已切换到: ${user.name} (${user.org_name})`)
}
</script>

<style scoped>
.app-container {
  height: 100vh;
}
.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #e6e6e6;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.aside {
  background: #304156;
}
.main {
  background: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
}
.user-info:hover {
  color: #409eff;
}
</style>
