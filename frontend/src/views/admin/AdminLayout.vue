<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="admin-aside">
      <div class="admin-logo">
        <h2>淘宝产品吧</h2>
        <span>管理后台</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/admin/bars">
          <el-icon><Collection /></el-icon>
          <span>产品吧管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/entries">
          <el-icon><Document /></el-icon>
          <span>词条管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/owners">
          <el-icon><User /></el-icon>
          <span>吧主管理</span>
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
          <span class="welcome">欢迎，{{ userStore.username }}</span>
        </div>
        <div class="header-right">
          <el-button type="primary" link @click="goFront">
            <el-icon><Link /></el-icon>
            <span>前台首页</span>
          </el-button>
          <el-button type="danger" link @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </el-button>
        </div>
      </el-header>

      <el-main class="admin-main">
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
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const goFront = () => {
  router.push('/')
}

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.admin-aside {
  background: #304156;
  overflow: hidden;
}

.admin-logo {
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #2b3a4a;
  color: #fff;
}

.admin-logo h2 {
  margin: 0;
  font-size: 18px;
}

.admin-logo span {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.admin-aside :deep(.el-menu) {
  border-right: none;
}

.admin-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.welcome {
  font-size: 16px;
  color: #606266;
}

.header-right {
  display: flex;
  gap: 16px;
}

.admin-main {
  background: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
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
