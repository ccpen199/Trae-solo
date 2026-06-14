<template>
  <el-container class="main-layout">
    <el-aside :width="sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon v-if="sidebarCollapsed"><Refresh /></el-icon>
        <span v-else class="logo-text">再生资源平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#ffd04b"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <template v-if="isProducer">
          <el-sub-menu index="producer">
            <template #title>
            <el-icon><Goods /></el-icon>
              <span>产废方管理</span>
            </template>
            <el-menu-item index="/producer/wastes">废弃物管理</el-menu-item>
            <el-menu-item index="/producer/estimate">智能估价</el-menu-item>
            <el-menu-item index="/producer/appointments">预约回收</el-menu-item>
            <el-menu-item index="/producer/orders">我的订单</el-menu-item>
            <el-menu-item index="/producer/contracts">电子合同</el-menu-item>
          </el-sub-menu>
        </template>

        <template v-if="isCollector">
          <el-sub-menu index="collector">
            <template #title>
              <el-icon><Van /></el-icon>
              <span>收废商管理</span>
            </template>
            <el-menu-item index="/collector/schedules">回收调度</el-menu-item>
            <el-menu-item index="/collector/route">路径规划</el-menu-item>
            <el-menu-item index="/collector/weigh-tickets">电子磅单</el-menu-item>
            <el-menu-item index="/collector/orders">我的订单</el-menu-item>
            <el-menu-item index="/collector/vehicles">车辆管理</el-menu-item>
          </el-sub-menu>
        </template>

        <template v-if="isProcessor">
          <el-sub-menu index="processor">
            <template #title>
              <el-icon><Shop /></el-icon>
              <span>利废厂管理</span>
            </template>
            <el-menu-item index="/processor/market">采购市场</el-menu-item>
            <el-menu-item index="/processor/purchases">我的采购</el-menu-item>
            <el-menu-item index="/processor/trace">溯源查询</el-menu-item>
          </el-sub-menu>
        </template>

        <template v-if="isAdmin">
          <el-sub-menu index="admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>管理后台</span>
            </template>
            <el-menu-item index="/admin/stats">数据统计</el-menu-item>
            <el-menu-item index="/admin/hazardous-review">危废审核</el-menu-item>
            <el-menu-item index="/admin/transfer-orders">跨省转移联单</el-menu-item>
            <el-menu-item index="/admin/user-audit">用户审核</el-menu-item>
            <el-menu-item index="/admin/env-report">环保监管报送</el-menu-item>
            <el-menu-item index="/admin/blockchain">区块链存证</el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="toggle-btn" @click="toggleSidebar">
            <Fold v-if="!sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userInfo?.username || '用户' }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
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

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import {
  Fold, Expand, User, CaretBottom, SwitchButton,
  Odometer, Goods, Van, Shop, Setting,
  Refresh
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const userInfo = computed(() => userStore.userInfo)

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta?.title || '工作台')

const isProducer = computed(() => userInfo.value?.role === 'producer')
const isCollector = computed(() => userInfo.value?.role === 'collector')
const isProcessor = computed(() => userInfo.value?.role === 'processor')
const isAdmin = computed(() => userInfo.value?.role === 'admin')

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  width: 100%;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b3648;
}

.logo-text {
  margin-left: 8px;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
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

.toggle-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.toggle-btn:hover {
  color: #409eff;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
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
  color: #606266;
}

.username {
  font-size: 14px;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
