<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <div class="header-content flex-between">
        <div class="logo flex gap-10">
          <el-icon :size="28" color="#fff"><Target /></el-icon>
          <span class="title">个人年度目标复盘系统</span>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="header-menu"
          router
          background-color="transparent"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/goals">
            <el-icon><List /></el-icon>
            <span>目标库</span>
          </el-menu-item>
          <el-menu-item index="/execution">
            <el-icon><Calendar /></el-icon>
            <span>周计划</span>
          </el-menu-item>
          <el-menu-item index="/habits">
            <el-icon><Clock /></el-icon>
            <span>习惯打卡</span>
          </el-menu-item>
          <el-menu-item index="/deviation">
            <el-icon><Warning /></el-icon>
            <span>偏差分析</span>
          </el-menu-item>
          <el-menu-item index="/review">
            <el-icon><Document /></el-icon>
            <span>年度复盘</span>
          </el-menu-item>
          <el-menu-item index="/export">
            <el-icon><Download /></el-icon>
            <span>导出报告</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/admin">
            <el-icon><Setting /></el-icon>
            <span>管理后台</span>
          </el-menu-item>
        </el-menu>
        <div class="user-info flex gap-10 items-center">
          <el-tag 
            v-if="userStore.isAdmin" 
            type="danger" 
            effect="dark" 
            class="role-tag cursor-pointer"
            @click="goToAdmin"
          >
            <el-icon><Setting /></el-icon>
            系统管理员
          </el-tag>
          <el-tag v-else type="info" effect="dark" class="role-tag">
            <el-icon><User /></el-icon>
            普通用户
          </el-tag>
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              {{ userStore.user?.display_name || userStore.user?.username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin">
                  <el-icon><Setting /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    <el-main class="layout-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/goals/')) return '/goals'
  return path
})

function goToAdmin() {
  if (userStore.isAdmin) {
    router.push('/admin')
  } else {
    ElMessage.error('没有权限访问管理后台')
  }
}

async function handleCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (err) {
      // 取消
    }
  } else if (command === 'admin') {
    goToAdmin()
  } else if (command === 'profile') {
    ElMessage.info('个人资料功能开发中')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-header {
  background: linear-gradient(90deg, #409eff 0%, #667eea 100%);
  padding: 0;
  height: 60px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  width: 100%;
  padding: 0 20px;
  align-items: center;
}

.logo {
  align-items: center;
  color: #fff;
}

.logo .title {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.header-menu {
  flex: 1;
  border-bottom: none;
  justify-content: center;
}

.header-menu :deep(.el-menu-item) {
  height: 60px;
  line-height: 60px;
}

.user-info {
  color: #fff;
  align-items: center;
}

.user-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.role-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.role-tag:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.cursor-pointer {
  cursor: pointer;
}

.layout-main {
  padding: 0;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
