<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const menuItems = [
  { path: '/home', label: '首页', icon: 'House' },
  { path: '/doctors', label: '找医生', icon: 'User' },
  { path: '/hospitals', label: '找医院', icon: 'OfficeBuilding' },
  { path: '/symptoms', label: '症状自查', icon: 'Search' },
  { path: '/community', label: '社区', icon: 'ChatDotRound' },
]

const userMenuItems = ref([
  { path: '/consultations', label: '我的咨询', icon: 'ChatDotRound' },
  { path: '/pets', label: '宠物档案', icon: 'Memo' },
  { path: '/health', label: '健康管理', icon: 'Document' },
  { path: '/profile', label: '个人中心', icon: 'Setting' },
])

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else {
    router.push(command)
  }
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="header-content container">
        <div class="logo" @click="$router.push('/home')">
          <span class="logo-icon">🐾</span>
          <span class="logo-text">云医宠</span>
        </div>
        
        <nav class="nav-menu">
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            :ellipsis="false"
            router
          >
            <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </el-menu-item>
          </el-menu>
        </nav>

        <div class="header-right">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand" trigger="click">
              <div class="user-info">
                <el-avatar :size="32" :src="userStore.user?.avatar">
                  {{ userStore.user?.nickname?.charAt(0) || '用' }}
                </el-avatar>
                <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="item in userMenuItems" :key="item.path" :command="item.path">
                    <el-icon><component :is="item.icon" /></el-icon>
                    {{ item.label }}
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout" style="color: #f56c6c">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
            <el-button @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <slot />
    </main>
    
    <footer class="footer" v-if="!userStore.isAdmin">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>云医宠</h4>
            <p>专业的宠物医疗问诊平台</p>
          </div>
          <div class="footer-section">
            <h4>快速链接</h4>
            <p><a href="/doctors">找医生</a></p>
            <p><a href="/hospitals">找医院</a></p>
            <p><a href="/symptoms">症状自查</a></p>
          </div>
          <div class="footer-section">
            <h4>联系我们</h4>
            <p>客服电话：400-123-4567</p>
            <p>工作时间：9:00 - 21:00</p>
          </div>
        </div>
        <div class="copyright">
          © 2024 云医宠 版权所有
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.logo-icon {
  font-size: 28px;
  margin-right: 8px;
}

.logo-text {
  letter-spacing: 1px;
}

.nav-menu {
  flex: 1;
  margin: 0 40px;
}

:deep(.el-menu--horizontal) {
  background: transparent;
  border: none;
}

:deep(.el-menu--horizontal .el-menu-item) {
  color: rgba(255, 255, 255, 0.9);
}

:deep(.el-menu--horizontal .el-menu-item:hover),
:deep(.el-menu--horizontal .el-menu-item.is-active) {
  color: white;
  background: rgba(255, 255, 255, 0.15);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.25);
}

.username {
  font-size: 14px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  flex: 1;
  padding: 24px 0;
}

.footer {
  background: #303133;
  color: #c0c4cc;
  padding: 40px 0 20px;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.footer-section h4 {
  color: white;
  margin-bottom: 16px;
  font-size: 16px;
}

.footer-section p {
  margin-bottom: 8px;
  font-size: 14px;
}

.footer-section a {
  color: #c0c4cc;
}

.footer-section a:hover {
  color: #409eff;
}

.copyright {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #444;
  font-size: 13px;
}
</style>
