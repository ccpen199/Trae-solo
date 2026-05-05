<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <span v-if="!isCollapse">SWMS 系统</span>
        <span v-else>SW</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>工作台</span>
        </el-menu-item>

        <el-sub-menu v-if="userStore.isSales || userStore.isAdmin" index="sales">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>客户工作台</span>
          </template>
          <el-menu-item index="/customers">客户管理</el-menu-item>
          <el-menu-item index="/orders-create">创建订单</el-menu-item>
          <el-menu-item index="/orders">订单列表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="userStore.isWarehouse || userStore.isAdmin" index="warehouse">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>仓储作业台</span>
          </template>
          <el-menu-item index="/products">产品管理</el-menu-item>
          <el-menu-item index="/inventory">库存管理</el-menu-item>
          <el-menu-item index="/pending-shipment">待发货订单</el-menu-item>
          <el-menu-item index="/stock-in">入库记录</el-menu-item>
          <el-menu-item index="/stock-out">出库记录</el-menu-item>
          <el-menu-item index="/inventory-checks">库存盘点记录</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="userStore.isFinance || userStore.isAdmin" index="finance">
          <template #title>
            <el-icon><Money /></el-icon>
            <span>财务审核台</span>
          </template>
          <el-menu-item index="/deposit-orders">定金单审核</el-menu-item>
          <el-menu-item index="/orders">订单查询</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="userStore.isCustomerService || userStore.isAdmin" index="cs">
          <template #title>
            <el-icon><Service /></el-icon>
            <span>客服跟进台</span>
          </template>
          <el-menu-item index="/order-follow">订单跟进</el-menu-item>
          <el-menu-item index="/orders">订单查询</el-menu-item>
        </el-sub-menu>

        <el-menu-item v-if="userStore.isAdmin" index="/orders">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.userInfo?.name }}
              <el-tag :type="roleTagType" size="small" effect="plain" class="role-tag">
                {{ userStore.userInfo?.role?.name }}
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)

const roleTagType = computed(() => {
  const roleMap = {
    'super_admin': 'danger',
    'sales': 'primary',
    'warehouse': 'warning',
    'finance': 'success',
    'customer_service': 'info'
  }
  return roleMap[userStore.roleCode] || ''
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.doLogout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5b;
}

.el-menu {
  border-right: none;
}

.layout-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.3s;
}

.collapse-icon:hover {
  background: #f5f7fa;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.role-tag {
  margin-left: 8px;
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
