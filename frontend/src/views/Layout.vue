<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <el-icon :size="28"><Car /></el-icon>
        <span>停车场管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>看板</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>订单列表</span>
        </el-menu-item>
        <el-menu-item index="/entry">
          <el-icon><Edit /></el-icon>
          <span>车牌入场</span>
        </el-menu-item>
        <el-menu-item index="/exceptions">
          <el-icon><Warning /></el-icon>
          <span>异常队列</span>
          <el-badge v-if="exceptionCount > 0" :value="exceptionCount" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><Document /></el-icon>
          <span>报表</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <span class="current-page">{{ currentPageTitle }}</span>
        </div>
        <div class="header-right">
          <el-badge :value="todoCount" class="header-badge">
            <el-button type="text" @click="handleTodoClick">
              <el-icon :size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ user?.name || '用户' }}
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
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const user = ref(null)
const todoCount = ref(0)
const exceptionCount = ref(0)

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const routeMeta = route.meta
  return routeMeta?.title || '首页'
})

const loadUserInfo = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }).catch(() => {})
  }
}

const handleTodoClick = () => {
  router.push('/orders')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.logo span {
  margin-left: 10px;
}

.menu-badge {
  margin-left: 10px;
}

.layout-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 5px;
}

.layout-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>