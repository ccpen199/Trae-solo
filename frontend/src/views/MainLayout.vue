<template>
  <el-container class="main-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <el-icon size="24" v-if="isCollapse"><Trophy /></el-icon>
        <template v-else>
          <el-icon size="24"><Trophy /></el-icon>
          <span>任务成就系统</span>
        </template>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Grid /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <template v-if="userStore.visibleModules.includes('tasks')">
          <el-menu-item index="/tasks">
            <el-icon><List /></el-icon>
            <template #title>任务管理</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.visibleModules.includes('progress')">
          <el-menu-item index="/progress">
            <el-icon><TrendCharts /></el-icon>
            <template #title>进度管理</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.visibleModules.includes('achievements')">
          <el-menu-item index="/achievements">
            <el-icon><Medal /></el-icon>
            <template #title>成就管理</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.visibleModules.includes('rewards')">
          <el-menu-item index="/rewards">
            <el-icon><Coin /></el-icon>
            <template #title>奖励管理</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.visibleModules.includes('triggers')">
          <el-menu-item index="/triggers">
            <el-icon><Lightning /></el-icon>
            <template #title>触发事件</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.visibleModules.includes('reports')">
          <el-menu-item index="/reports">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>报表分析</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.visibleModules.includes('analytics')">
          <el-menu-item index="/analytics">
            <el-icon><PieChart /></el-icon>
            <template #title>数据分析</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.visibleModules.includes('audits')">
          <el-menu-item index="/audits">
            <el-icon><Document /></el-icon>
            <template #title>审计日志</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.visibleModules.includes('users')">
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
          <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="User" />
              <span class="username">{{ userStore.user?.nickname }}</span>
              <el-tag :type="roleTagType" size="small">{{ userStore.roleName }}</el-tag>
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
import { useUserStore } from '../stores/user'
import { 
  Trophy, Grid, List, TrendCharts, Medal, Coin, 
  Lightning, DataAnalysis, PieChart, Document, 
  User, Fold, Expand 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const currentTitle = computed(() => {
  const titles = {
    '/dashboard': '工作台',
    '/tasks': '任务管理',
    '/tasks/create': '创建任务',
    '/progress': '进度管理',
    '/achievements': '成就管理',
    '/rewards': '奖励管理',
    '/triggers': '触发事件',
    '/reports': '报表分析',
    '/analytics': '数据分析',
    '/audits': '审计日志',
    '/users': '用户管理',
    '/cross-reference': '数据回查'
  }
  return titles[route.path] || '未知页面'
})

const roleTagType = computed(() => {
  const types = {
    'player': 'info',
    'planner': 'primary',
    'operator': 'success',
    'customer_service': 'warning'
  }
  return types[userStore.roleCode] || 'info'
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn && userStore.userUuid) {
    userStore.getCurrentUser()
  }
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
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  gap: 8px;
  border-bottom: 1px solid #3a4a5e;
}

.logo span {
  white-space: nowrap;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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
  gap: 12px;
  cursor: pointer;
}

.username {
  color: #303133;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
