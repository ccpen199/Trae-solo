<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon><Van /></el-icon>
        <span>货运SaaS平台</span>
      </div>
      <el-menu :default-active="activeMenu" router background-color="#304156" text-color="#bfcbd9" active-text-color="#ffd04b">
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        
        <template v-if="isShipper || isAdmin">
          <el-sub-menu index="shipper">
            <template #title>
              <el-icon><OfficeBuilding /></el-icon>
              <span>货主中心</span>
            </template>
            <el-menu-item index="/shipper/cert">企业认证</el-menu-item>
            <el-menu-item index="/shipper/cargo">货源管理</el-menu-item>
            <el-menu-item index="/shipper/cargo/publish">发布货源</el-menu-item>
            <el-menu-item index="/shipper/whitelist">熟车白名单</el-menu-item>
            <el-menu-item index="/shipper/cooperation">合作记录</el-menu-item>
          </el-sub-menu>
        </template>
        
        <template v-if="isDriver || isAdmin">
          <el-sub-menu index="driver">
            <template #title>
              <el-icon><Avatar /></el-icon>
              <span>司机中心</span>
            </template>
            <el-menu-item index="/driver/info">司机信息</el-menu-item>
            <el-menu-item index="/driver/cargo-pool">货源接单池</el-menu-item>
            <el-menu-item index="/driver/my-bids">我的报价</el-menu-item>
          </el-sub-menu>
        </template>
        
        <template v-if="isAdmin">
          <el-sub-menu index="waybill">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>运单管理</span>
            </template>
            <el-menu-item index="/waybill">运单列表</el-menu-item>
          </el-sub-menu>
        </template>
        
        <el-sub-menu index="payment">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>资金管理</span>
          </template>
          <el-menu-item index="/wallet">我的钱包</el-menu-item>
          <el-menu-item index="/transactions">交易流水</el-menu-item>
          <el-menu-item index="/escrow" v-if="isShipper || isAdmin">担保资金</el-menu-item>
        </el-sub-menu>
        
        <template v-if="isAdmin">
          <el-sub-menu index="admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>运营管理</span>
            </template>
            <el-menu-item index="/admin/users">用户管理</el-menu-item>
            <el-menu-item index="/admin/waybills">运单监控</el-menu-item>
            <el-menu-item index="/admin/alerts">异常预警</el-menu-item>
            <el-menu-item index="/admin/reconciliation">资金对账</el-menu-item>
            <el-menu-item index="/admin/insurance">保单管理</el-menu-item>
            <el-menu-item index="/admin/audit-logs">审计日志</el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32">
                {{ user?.real_name?.charAt(0) || user?.username?.charAt(0) }}
              </el-avatar>
              <span>{{ user?.real_name || user?.username }}</span>
              <el-tag :type="roleType" size="small" style="margin-left: 8px">{{ roleText }}</el-tag>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
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
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Van, DataAnalysis, OfficeBuilding, Avatar, Document,
  Wallet, Setting, User, SwitchButton, ArrowDown
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const isShipper = computed(() => userStore.isShipper)
const isDriver = computed(() => userStore.isDriver)
const isAdmin = computed(() => userStore.isAdmin)

const activeMenu = computed(() => route.path)

const roleText = computed(() => {
  const map = { shipper: '货主', driver: '司机', admin: '管理员' }
  return map[user.value?.role] || ''
})

const roleType = computed(() => {
  const map = { shipper: 'primary', driver: 'success', admin: 'warning' }
  return map[user.value?.role] || 'info'
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.meta && r.meta.title || r.name)
  return matched.map(r => ({
    path: r.path,
    name: r.meta?.title || r.name || ''
  }))
})

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  }
}

onMounted(() => {
  if (userStore.isLoggedIn && !userStore.userInfo) {
    userStore.fetchProfile().catch(() => {})
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.aside {
  background-color: #304156;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  gap: 8px;
  background-color: #2b2f3a;
}
.logo .el-icon {
  font-size: 24px;
  color: #409eff;
}
.aside .el-menu {
  border-right: none;
}
.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0 10px;
}
.header-right .user-info:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}
.main {
  background-color: #f0f2f5;
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
