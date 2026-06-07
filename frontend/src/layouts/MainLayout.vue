<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon class="logo-icon"><Heart /></el-icon>
        <span class="logo-text">婚庆SaaS平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2937"
        text-color="#9ca3af"
        active-text-color="#ff6b9d"
      >
        <template v-if="userStore.user?.role === 'couple'">
          <el-menu-item index="/dashboard/home">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/wedding">
            <el-icon><Timer /></el-icon>
            <span>婚礼倒计时</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/budget">
            <el-icon><Money /></el-icon>
            <span>预算管理</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/preferences">
            <el-icon><Brush /></el-icon>
            <span>风格偏好</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/services">
            <el-icon><Shop /></el-icon>
            <span>商品服务</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/guides">
            <el-icon><Reading /></el-icon>
            <span>备婚攻略</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/orders">
            <el-icon><Document /></el-icon>
            <span>订单中心</span>
          </el-menu-item>
        </template>
        <template v-else-if="userStore.user?.role === 'merchant'">
          <el-menu-item index="/dashboard/merchant/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>商家首页</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/merchant/certification">
            <el-icon><Postcard /></el-icon>
            <span>资质认证</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/merchant/cases">
            <el-icon><Picture /></el-icon>
            <span>案例管理</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/merchant/schedule">
            <el-icon><Calendar /></el-icon>
            <span>档期管理</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/merchant/orders">
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/merchant/reviews">
            <el-icon><ChatDotRound /></el-icon>
            <span>评价管理</span>
          </el-menu-item>
        </template>
        <template v-else-if="userStore.user?.role === 'admin'">
          <el-menu-item index="/dashboard/admin/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>运营首页</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/admin/merchants">
            <el-icon><User /></el-icon>
            <span>商家管理</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/admin/credit">
            <el-icon><Star /></el-icon>
            <span>信用分评估</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/admin/trends">
            <el-icon><TrendCharts /></el-icon>
            <span>婚策趋势</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/admin/funnel">
            <el-icon><Histogram /></el-icon>
            <span>转化漏斗</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.user?.avatar">
                {{ userStore.user?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="username">{{ userStore.user?.name || '用户' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '首页')

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  } else if (command === 'profile') {
    router.push('/dashboard/profile')
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.sidebar {
  background: #1f2937;
  border-right: none;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    border-bottom: 1px solid #374151;
    
    .logo-icon {
      font-size: 24px;
      color: #ff6b9d;
      margin-right: 8px;
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .el-menu {
    border-right: none;
  }
}

.header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .username {
        margin-left: 8px;
        font-size: 14px;
        color: #374151;
      }
    }
  }
}

.main-content {
  background: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}
</style>
