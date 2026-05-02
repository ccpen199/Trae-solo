<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="layout-aside">
      <div class="layout-logo">
        <h3>财务中心</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="layout-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/finance/reconciliation">
          <el-icon><DocumentChecked /></el-icon>
          <span>对账管理</span>
        </el-menu-item>
        <el-menu-item index="/finance/adjustment-pool">
          <el-icon><Warning /></el-icon>
          <span>调账池</span>
          <el-badge :value="adjustmentCount" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/finance/bills">
          <el-icon><Folder /></el-icon>
          <span>渠道账单</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <span class="header-title">财务端</span>
        </div>
        <div class="header-right">
          <span class="user-name">{{ userStore.username }}</span>
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
import { DocumentChecked, Warning, Folder, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const adjustmentCount = ref(5)

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

.menu-badge {
  margin-left: 8px;
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
}
</style>
