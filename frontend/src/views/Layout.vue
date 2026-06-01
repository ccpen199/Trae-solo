<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">🚚 货运调度平台</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-sub-menu index="shipper" v-if="user.role === 'shipper' || user.role === 'admin'">
          <template #title>
            <el-icon><ShoppingBag /></el-icon>
            <span>货主中心</span>
          </template>
          <el-menu-item index="/shipper/create-order">发布需求</el-menu-item>
          <el-menu-item index="/shipper/orders">我的订单</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="driver" v-if="user.role === 'driver' || user.role === 'admin'">
          <template #title>
            <el-icon><Van /></el-icon>
            <span>司机中心</span>
          </template>
          <el-menu-item index="/driver/orders">订单大厅</el-menu-item>
          <el-menu-item index="/driver/vehicles">车辆管理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="admin" v-if="user.role === 'admin'">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>运营管理</span>
          </template>
          <el-menu-item index="/admin/orders">订单管理</el-menu-item>
          <el-menu-item index="/admin/drivers">司机审核</el-menu-item>
          <el-menu-item index="/admin/vehicles">车辆管理</el-menu-item>
          <el-menu-item index="/admin/exceptions">异常仲裁</el-menu-item>
          <el-menu-item index="/admin/sla">SLA监控</el-menu-item>
          <el-menu-item index="/admin/heatmap">线路热力</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span>{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ user.name }} ({{ roleText }})
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
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
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const user = ref({})

const loadUser = () => {
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && parsed.id && parsed.role) {
        user.value = parsed
        return
      }
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e)
  }
  user.value = {}
  localStorage.removeItem('user')
}

loadUser()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': '数据概览',
    '/shipper/create-order': '发布需求',
    '/shipper/orders': '我的订单',
    '/driver/orders': '订单大厅',
    '/driver/vehicles': '车辆管理',
    '/admin/orders': '订单管理',
    '/admin/drivers': '司机审核',
    '/admin/vehicles': '车辆管理',
    '/admin/exceptions': '异常仲裁',
    '/admin/sla': 'SLA监控',
    '/admin/heatmap': '线路热力'
  }
  return titles[route.path] || ''
})

const roleText = computed(() => {
  const roles = { shipper: '货主', driver: '司机', admin: '管理员' }
  return roles[user.value.role] || user.value.role || '未知'
})

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('user')
    user.value = {}
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.sidebar {
  background-color: #304156;
  height: 100%;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.header-left {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}
.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}
.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
