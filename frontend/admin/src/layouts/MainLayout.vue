<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import websocketService from '@/utils/websocket'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { RouteRecordRaw } from 'vue-router'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapse = ref(false)
const activeMenu = ref<string>('')

const menuItems = computed(() => {
  const routes = router.options.routes.find((r) => r.path === '/')?.children || []
  return routes
    .filter((r: any) => {
      if (!r.meta?.roles) return false
      return authStore.hasAnyRole(r.meta.roles as string[])
    })
    .sort((a: any, b: any) => {
      const orderA = ['dashboard', 'tables', 'orders', 'kitchen', 'pos', 'menu', 'members', 'reports', 'users', 'settings']
      return orderA.indexOf(a.name as string) - orderA.indexOf(b.name as string)
    })
})

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    authStore.logout()
    websocketService.disconnect()
    router.push('/login')
  } catch {
    // 取消退出
  }
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: '系统管理员',
    manager: '店长',
    cashier: '收银员',
    waiter: '服务员',
    chef: '厨师',
  }
  return labels[role] || role
}

const getRoleBadgeType = (role: string) => {
  const types: Record<string, string> = {
    admin: 'danger',
    manager: 'warning',
    cashier: 'success',
    waiter: 'primary',
    chef: 'info',
  }
  return types[role] || ''
}

const onNewOrder = (data: any) => {
  ElNotification({
    title: '新订单',
    message: `订单 ${data.orderNumber} 已创建`,
    type: 'success',
    duration: 5000,
  })
}

const onOrderStatusChanged = (data: any) => {
  ElNotification({
    title: '订单状态更新',
    message: `订单 ${data.orderNumber} 状态已变更`,
    type: 'info',
    duration: 3000,
  })
}

const onPaymentComplete = (data: any) => {
  ElNotification({
    title: '支付完成',
    message: `订单 ${data.orderNumber} 支付成功 ¥${data.amount}`,
    type: 'success',
    duration: 5000,
  })
}

onMounted(() => {
  activeMenu.value = route.name as string

  if (authStore.user) {
    websocketService.connect(authStore.user.role, authStore.user.id)

    websocketService.on('newOrder', onNewOrder)
    websocketService.on('orderStatusChanged', onOrderStatusChanged)
    websocketService.on('paymentComplete', onPaymentComplete)
  }
})

onUnmounted(() => {
  websocketService.off('newOrder', onNewOrder)
  websocketService.off('orderStatusChanged', onOrderStatusChanged)
  websocketService.off('paymentComplete', onPaymentComplete)
})
</script>

<template>
  <el-container class="main-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <h3 v-show="!isCollapse">餐饮收银系统</h3>
        <el-icon v-show="isCollapse" :size="32"><Food /></el-icon>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.name"
          :index="item.name as string"
        >
          <el-icon>
            <component :is="item.meta?.icon as string" />
          </el-icon>
          <template #title>{{ item.meta?.title as string }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.title">
              {{ route.meta?.title as string }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ authStore.user?.name?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ authStore.user?.name }}</span>
              <el-tag :type="getRoleBadgeType(authStore.user?.role || '')" size="small">
                {{ getRoleLabel(authStore.user?.role || '') }}
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
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

<style scoped>
.main-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4a;
  color: #fff;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }
}

.sidebar-menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-icon {
  cursor: pointer;
  font-size: 20px;
  color: #606266;

  &:hover {
    color: #409eff;
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.avatar {
  background-color: #409eff;
  color: #fff;
}

.user-name {
  color: #606266;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
