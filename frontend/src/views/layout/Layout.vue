<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <span v-if="!isCollapse">分销佣金系统</span>
        <span v-else>分销</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/orders">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/commissions">
          <el-icon><Wallet /></el-icon>
          <template #title>佣金明细</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/withdraws">
          <el-icon><Money /></el-icon>
          <template #title>提现记录</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/materials" v-if="userStore.isDistributor">
          <el-icon><Picture /></el-icon>
          <template #title>推广素材</template>
        </el-menu-item>
        <el-sub-menu index="finance" v-if="userStore.isFinance">
          <template #title>
            <el-icon><Coin /></el-icon>
            <span>财务管理</span>
          </template>
          <el-menu-item index="/dashboard/finance">提现审核</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="operator" v-if="userStore.isOperator">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>运营管理</span>
          </template>
          <el-menu-item index="/dashboard/operator">风控监控</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="User" />
              <span class="user-name">{{ userStore.user?.nickname || userStore.user?.phone }}</span>
              <el-tag :type="userRoleTagType" size="small" class="role-tag">
                {{ userRoleText }}
              </el-tag>
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
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  House,
  ShoppingCart,
  Wallet,
  Money,
  Picture,
  Coin,
  DataAnalysis,
  Fold,
  Expand,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)

const userRoleText = computed(() => {
  const role = userStore.user?.role
  switch (role) {
    case 'ADMIN': return '管理员'
    case 'FINANCE': return '财务'
    case 'OPERATOR': return '运营'
    case 'DISTRIBUTOR': return '分销员'
    case 'END_USER': return '普通用户'
    default: return role
  }
})

const userRoleTagType = computed(() => {
  const role = userStore.user?.role
  switch (role) {
    case 'ADMIN': return 'danger'
    case 'FINANCE': return 'warning'
    case 'OPERATOR': return 'success'
    case 'DISTRIBUTOR': return 'primary'
    default: return 'info'
  }
})

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/dashboard/profile')
  } else if (command === 'logout') {
    userStore.logout()
    router.push('/login')
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
  font-weight: 600;
  border-bottom: 1px solid #3a4a5c;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-name {
  margin: 0 8px 0 12px;
  color: #606266;
}

.role-tag {
  margin-left: 4px;
}

.layout-main {
  background: #f0f2f5;
  overflow: auto;
}
</style>
