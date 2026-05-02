<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="layout-aside">
      <div class="layout-logo">
        <h3>商户运营中心</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="layout-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/merchant/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>运营看板</span>
        </el-menu-item>
        <el-menu-item index="/merchant/orders">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/merchant/balance">
          <el-icon><Wallet /></el-icon>
          <span>余额追踪</span>
        </el-menu-item>
        <el-menu-item index="/merchant/payouts">
          <el-icon><Money /></el-icon>
          <span>打款记录</span>
        </el-menu-item>
        <el-menu-item index="/merchant/profit-sharings">
          <el-icon><PieChart /></el-icon>
          <span>分润明细</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <span class="header-title">商户端</span>
        </div>
        <div class="header-right">
          <span class="user-name">{{ userStore.username }}</span>
          <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
            <el-button type="text">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-button type="text" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </el-header>
      
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataLine, List, Wallet, Money, PieChart, Bell, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const notificationCount = ref(3)

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
}

.layout-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.layout-logo h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.layout-menu {
  border-right: none;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  color: #606266;
}

.notification-badge {
  margin-right: 10px;
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
}
</style>
