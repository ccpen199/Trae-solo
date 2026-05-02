<template>
  <el-container class="main-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28" color="#409EFF"><Bus /></el-icon>
        <span class="logo-text">智慧公交调度</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>运营看板</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <span>排班管理</span>
        </el-menu-item>
        <el-menu-item index="/map">
          <el-icon><MapLocation /></el-icon>
          <span>车辆地图</span>
        </el-menu-item>
        <el-menu-item index="/alarms">
          <el-icon><Warning /></el-icon>
          <span>告警管理</span>
          <el-badge :value="alarmCount" :hidden="alarmCount === 0" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/exceptions">
          <el-icon><ErrorWarning /></el-icon>
          <span>异常队列</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userName }} ({{ roleLabel }})
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { alarmApi } from '@/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => authStore.userName)
const userRole = computed(() => authStore.userRole)
const alarmCount = ref(0)

const roleLabel = computed(() => {
  const labels = {
    dispatcher: '调度员',
    driver: '司机',
    passenger: '乘客',
    operator: '运营',
    maintenance: '维修'
  }
  return labels[userRole.value] || userRole.value
})

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')

async function fetchAlarmCount() {
  try {
    const result = await alarmApi.getOverview()
    alarmCount.value = result.active_count || 0
  } catch (error) {
    console.error('获取告警数量失败:', error)
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  fetchAlarmCount()
})
</script>

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
  padding: 0 16px;
  border-bottom: 1px solid #3a4a5b;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-left: 10px;
}

.menu {
  border-right: none;
}

.menu-badge {
  margin-top: -8px;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
}

.user-info:hover {
  color: #409EFF;
}

.main-content {
  padding: 20px;
  overflow-y: auto;
}
</style>
