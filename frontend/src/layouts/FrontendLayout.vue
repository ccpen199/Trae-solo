<template>
  <div class="frontend-layout">
    <header class="header">
      <div class="container header-inner">
        <div class="logo" @click="goHome">
          <el-icon :size="32" color="#409eff"><DataLine /></el-icon>
          <span class="logo-text">品牌智库</span>
        </div>
        <nav class="nav-menu">
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            :router="true"
            background-color="transparent"
            text-color="#303133"
            active-text-color="#409eff"
            class="menu"
          >
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/brands">品牌库</el-menu-item>
            <el-menu-item index="/rankings">榜单</el-menu-item>
            <el-menu-item index="/knowledge">知识</el-menu-item>
            <el-menu-item index="/collections" v-if="authStore.isLoggedIn">收藏</el-menu-item>
          </el-menu>
        </nav>
        <div class="header-right">
          <el-button
            v-if="!authStore.isLoggedIn"
            type="primary"
            @click="goLogin"
          >
            登录
          </el-button>
          <el-dropdown v-else @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ authStore.user?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ authStore.user?.username }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="collections">
                  <el-icon><Star /></el-icon>我的收藏
                </el-dropdown-item>
                <el-dropdown-item command="admin" v-if="authStore.isAdmin">
                  <el-icon><Setting /></el-icon>管理后台
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
    <footer class="footer">
      <div class="container">
        <p>© 2024 品牌智库 - 专业品牌数据平台</p>
        <p class="footer-links">
          <a href="#">关于我们</a>
          <span class="divider">|</span>
          <a href="#">使用条款</a>
          <span class="divider">|</span>
          <a href="#">隐私政策</a>
          <span class="divider">|</span>
          <a href="#">联系我们</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataLine, CaretBottom, Star, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

function goHome() {
  router.push('/')
}

function goLogin() {
  router.push('/login')
}

function handleCommand(command) {
  switch (command) {
    case 'collections':
      router.push('/collections')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        authStore.logout()
        ElMessage.success('已退出登录')
        router.push('/')
      }).catch(() => {})
      break
  }
}
</script>

<style scoped>
.frontend-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1f2f3d;
  background: linear-gradient(135deg, #409eff, #667eea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.menu {
  border-bottom: none;
}

.menu :deep(.el-menu-item) {
  font-size: 15px;
  font-weight: 500;
  padding: 0 24px;
  height: 64px;
  line-height: 64px;
}

.menu :deep(.el-menu-item:hover) {
  background-color: #f5f7fa;
}

.menu :deep(.el-menu-item.is-active) {
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}

.avatar {
  background: linear-gradient(135deg, #409eff, #667eea);
}

.username {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 24px 0;
}

.footer {
  background: #fff;
  padding: 32px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 40px;
}

.footer p {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.footer-links {
  margin-top: 12px;
}

.footer-links a {
  color: #606266;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #409eff;
}

.divider {
  margin: 0 12px;
  color: #dcdfe6;
}

@media (max-width: 768px) {
  .header-inner {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 0;
  }
  
  .nav-menu {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }
  
  .menu {
    flex-wrap: nowrap;
  }
  
  .menu :deep(.el-menu-item) {
    padding: 0 16px;
    font-size: 14px;
  }
  
  .logo-text {
    font-size: 18px;
  }
  
  .username {
    display: none;
  }
}
</style>
