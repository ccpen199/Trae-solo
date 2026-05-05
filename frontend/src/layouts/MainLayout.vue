<template>
  <el-container class="main-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <el-icon size="28" color="#409EFF"><Van /></el-icon>
        <span v-show="!isCollapse" class="logo-text">物流调度系统</span>
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
          <el-icon><DataAnalysis /></el-icon>
          <template #title>首页仪表盘</template>
        </el-menu-item>
        
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        
        <el-menu-item index="/vehicles">
          <el-icon><Van /></el-icon>
          <template #title>车辆管理</template>
        </el-menu-item>
        
        <el-menu-item index="/vehicles/monitor">
          <el-icon><Monitor /></el-icon>
          <template #title>车辆监控</template>
        </el-menu-item>
        
        <el-menu-item index="/drivers">
          <el-icon><User /></el-icon>
          <template #title>司机管理</template>
        </el-menu-item>
        
        <el-menu-item index="/dispatch">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>调度指令</template>
        </el-menu-item>
        
        <el-menu-item index="/settlements">
          <el-icon><Money /></el-icon>
          <template #title>费用结算</template>
        </el-menu-item>
        
        <el-menu-item index="/track">
          <el-icon><Guide /></el-icon>
          <template #title>轨迹查询</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon @click="toggleCollapse" class="collapse-icon"><Fold /></el-icon>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              <span>{{ userStore.userName }}</span>
              <el-tag :type="roleTagType" size="small" class="role-tag">{{ userStore.roleName }}</el-tag>
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
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)

const roleTagType = computed(() => {
  const typeMap = {
    admin: 'danger',
    dispatcher: 'primary',
    accountant: 'success',
    driver: 'warning',
    shipper: 'info'
  }
  return typeMap[userStore.roleCode] || 'info'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = async (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.handleLogout()
    router.push('/login')
  }
}
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
  margin-left: 12px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.collapse-icon:hover {
  color: #409EFF;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}

.user-info span {
  margin-left: 8px;
}

.role-tag {
  margin-left: 8px;
}

.main-content {
  background-color: #f0f2f5;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none;
}
</style>
