<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo">
        <router-link to="/">
          <span class="logo-text">产品吧</span>
        </router-link>
      </div>
      
      <nav class="nav-menu">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">首页</router-link>
        <router-link to="/taobao" class="nav-item" :class="{ active: $route.path === '/taobao' }">淘宝频道</router-link>
        <router-link to="/news" class="nav-item" :class="{ active: $route.path === '/news' }">资讯</router-link>
        <router-link to="/forum" class="nav-item" :class="{ active: $route.path === '/forum' }">论坛</router-link>
        <router-link to="/blog" class="nav-item" :class="{ active: $route.path === '/blog' }">博客</router-link>
        <router-link to="/qa" class="nav-item" :class="{ active: $route.path === '/qa' }">问答</router-link>
        <router-link to="/bars" class="nav-item" :class="{ active: $route.path.startsWith('/bars') && $route.path !== '/bars/create' }">产品吧</router-link>
        <router-link to="/products" class="nav-item" :class="{ active: $route.path.startsWith('/products') }">商品</router-link>
      </nav>

      <div class="header-right">
        <template v-if="userStore.isLoggedIn">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.user?.avatar">
                {{ (userStore.user?.nickname || userStore.user?.username || 'U').charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userStore.user?.nickname || userStore.user?.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="my-bars">我的产品吧</el-dropdown-item>
                <el-dropdown-item command="my-posts">我的帖子</el-dropdown-item>
                <el-dropdown-item v-if="userStore.isOperator" command="operator" divided>运营管理</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button type="primary">登录</el-button>
          </router-link>
          <router-link to="/register">
            <el-button>注册</el-button>
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function handleCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'my-bars':
      router.push('/my-bars')
      break
    case 'my-posts':
      router.push('/my-posts')
      break
    case 'operator':
      router.push('/operator')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        userStore.logout()
        router.push('/')
      }).catch(() => {})
      break
  }
}
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo-text {
  font-size: 22px;
  font-weight: bold;
  color: #409eff;
}

.nav-menu {
  display: flex;
  gap: 24px;
}

.nav-item {
  color: #606266;
  font-size: 15px;
  transition: color 0.2s;
}

.nav-item:hover {
  color: #409eff;
}

.nav-item.active {
  color: #409eff;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  color: #303133;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
