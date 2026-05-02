<template>
  <div class="layout-container">
    <aside class="layout-aside">
      <div class="logo">采购商城系统</div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品目录</span>
        </el-menu-item>
        <el-menu-item index="/purchases">
          <el-icon><Document /></el-icon>
          <span>采购申请</span>
        </el-menu-item>
        <el-menu-item index="/approvals">
          <el-icon><Stamp /></el-icon>
          <span>审批管理</span>
        </el-menu-item>
        <el-menu-item index="/budgets">
          <el-icon><Wallet /></el-icon>
          <span>预算管理</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <div class="layout-main">
      <header class="layout-header">
        <div style="display: flex; align-items: center;">
          <span style="margin-left: 20px;">欢迎使用采购商城系统</span>
        </div>
        <div class="header-right">
          <span style="margin-right: 20px;">{{ userInfo?.real_name }} ({{ getRoleName(userInfo?.role) }})</span>
          <el-button type="text" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </header>
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)

const activeMenu = computed(() => {
  return route.path
})

const roleNames = {
  applicant: '申请人',
  buyer: '采购员',
  approver: '审批人',
  supplier: '供应商',
  finance: '财务',
  admin: '管理员'
}

const getRoleName = (role) => {
  return roleNames[role] || role
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header-right {
  display: flex;
  align-items: center;
}
</style>
