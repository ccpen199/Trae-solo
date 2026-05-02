<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <span class="logo-icon">✈️</span>
        <span class="logo-text">航班订票系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        
        <el-menu-item v-if="canAccessPage('flights')" index="/flights">
          <el-icon><Document /></el-icon>
          <span>航班查询</span>
        </el-menu-item>
        
        <el-menu-item v-if="canAccessPage('orders') || canAccessPage('my_orders')" 
                      :index="canAccessPage('orders') ? '/orders' : '/my-orders'">
          <el-icon><List /></el-icon>
          <span>{{ canAccessPage('orders') ? '订单管理' : '我的订单' }}</span>
        </el-menu-item>
        
        <el-menu-item v-if="canAccessPage('tickets')" index="/tickets">
          <el-icon><Ticket /></el-icon>
          <span>机票管理</span>
        </el-menu-item>
        
        <el-menu-item v-if="canAccessPage('rebook_refund')" index="/rebook-refund">
          <el-icon><RefreshRight /></el-icon>
          <span>退改签审批</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="userStore.todoCount" :hidden="userStore.todoCount === 0" class="todo-badge">
            <el-button link type="primary" @click="handleTodoClick">
              <el-icon><Bell /></el-icon>
              待办
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.userName }}
              <el-tag :type="roleTagType" size="small" class="role-tag">{{ roleName }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { 
  House, Document, List, Ticket, RefreshRight, 
  Bell, User 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const pageTitles = {
  '/dashboard': '仪表盘',
  '/flights': '航班查询',
  '/orders': '订单管理',
  '/my-orders': '我的订单',
  '/tickets': '机票管理',
  '/rebook-refund': '退改签审批'
}

const currentPageTitle = computed(() => {
  if (route.path.startsWith('/orders/')) return '订单详情'
  return pageTitles[route.path] || '页面'
})

const roleName = computed(() => {
  const roleMap = {
    admin: '管理员',
    passenger: '旅客',
    agent: '代理',
    customer_service: '客服',
    airline: '航司'
  }
  return roleMap[userStore.userRole] || userStore.userRole
})

const roleTagType = computed(() => {
  const typeMap = {
    admin: 'danger',
    passenger: 'success',
    agent: 'primary',
    customer_service: 'warning',
    airline: 'info'
  }
  return typeMap[userStore.userRole] || 'info'
})

const canAccessPage = (pageName) => userStore.canAccessPage(pageName)

const handleTodoClick = () => {
  router.push('/orders')
}

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.logo-icon {
  font-size: 24px;
  margin-right: 8px;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.sidebar-menu {
  border-right: none;
}

.header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.todo-badge {
  margin-right: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.role-tag {
  margin-left: 8px;
}

.main {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
