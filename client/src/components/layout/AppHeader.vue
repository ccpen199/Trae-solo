<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-left">
        <router-link to="/" class="logo">
          <el-icon :size="32" color="#409eff">
            <ChatDotRound />
          </el-icon>
          <span class="logo-text">QA Community</span>
        </router-link>
        <nav class="nav-menu">
          <router-link 
            v-for="item in navItems" 
            :key="item.path" 
            :to="item.path"
            class="nav-item"
            :class="{ active: isActiveRoute(item.path) }"
          >
            {{ item.name }}
          </router-link>
        </nav>
      </div>
      <div class="header-right">
        <template v-if="userStore.isAuthenticated">
          <el-badge :value="3" :hidden="true" class="notification-badge">
            <el-button type="text" @click="showNotifications = true">
              <el-icon :size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <router-link to="/ask">
            <el-button type="primary">
              <el-icon><Edit /></el-icon>
              提问
            </el-button>
          </router-link>
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-info">
              <el-avatar :size="36" :src="userStore.user?.profile?.avatar">
                {{ userStore.user?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="user-name">{{ userStore.user?.profile?.nickname || userStore.user?.username }}</span>
              <el-tag :type="getCreditTagType" size="small">
                {{ getCreditLevelName }}
              </el-tag>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="questions">
                  <el-icon><Document /></el-icon>
                  我的提问
                </el-dropdown-item>
                <el-dropdown-item command="answers">
                  <el-icon><EditPen /></el-icon>
                  我的回答
                </el-dropdown-item>
                <el-dropdown-item command="credit">
                  <el-icon><Trophy /></el-icon>
                  信用中心
                </el-dropdown-item>
                <el-dropdown-item command="wallet">
                  <el-icon><Wallet /></el-icon>
                  我的钱包
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isEditor" command="admin">
                  <el-icon><Setting /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button type="text">登录</el-button>
          </router-link>
          <router-link to="/register">
            <el-button type="primary">注册</el-button>
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const showNotifications = ref(false)

const navItems = [
  { path: '/', name: '首页' },
  { path: '/questions', name: '问题广场' },
  { path: '/knowledge', name: '知识库' }
]

const isActiveRoute = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const getCreditTagType = computed(() => {
  const level = userStore.user?.creditLevel
  const typeMap = {
    bronze: 'info',
    silver: '',
    gold: 'warning',
    platinum: 'primary',
    diamond: 'success'
  }
  return typeMap[level] || 'info'
})

const getCreditLevelName = computed(() => {
  const level = userStore.user?.creditLevel
  const nameMap = {
    bronze: '青铜',
    silver: '白银',
    gold: '黄金',
    platinum: '铂金',
    diamond: '钻石'
  }
  return nameMap[level] || '青铜'
})

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'questions':
      router.push('/profile/questions')
      break
    case 'answers':
      router.push('/profile/answers')
      break
    case 'credit':
      router.push('/profile/credit')
      break
    case 'wallet':
      router.push('/profile/wallet')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/')
      break
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;

  .logo-text {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
}

.nav-menu {
  display: flex;
  gap: 24px;
}

.nav-item {
  font-size: 15px;
  color: #606266;
  text-decoration: none;
  padding: 8px 4px;
  position: relative;
  transition: color 0.3s;

  &:hover {
    color: #409eff;
  }

  &.active {
    color: #409eff;
    font-weight: 500;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #409eff;
      border-radius: 1px;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  :deep(.el-badge__content) {
    transform: scale(0.8) translate(50%, -50%);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.3s;

  &:hover {
    background: #f5f7fa;
  }
}

.user-name {
  font-size: 14px;
  color: #303133;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
