<template>
  <el-container class="main-container">
    <el-aside width="220px" class="main-aside">
      <div class="logo">
        <el-icon :size="28" color="#409eff"><Ship /></el-icon>
        <span class="logo-text">船运订舱系统</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2937"
        text-color="#9ca3af"
        active-text-color="#fff"
        :collapse="isCollapse"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
        
        <el-sub-menu index="booking">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>订舱管理</span>
          </template>
          <el-menu-item index="/bookings">订舱单列表</el-menu-item>
          <el-menu-item index="/bookings/create">新建订舱单</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/schedules">
          <el-icon><Calendar /></el-icon>
          <template #title>船期管理</template>
        </el-menu-item>
        
        <el-menu-item index="/containers">
          <el-icon><Box /></el-icon>
          <template #title>箱号分配</template>
        </el-menu-item>
        
        <el-menu-item index="/port-entry">
          <el-icon><Location /></el-icon>
          <template #title>港口进场</template>
        </el-menu-item>
        
        <el-menu-item index="/loading">
          <el-icon><List /></el-icon>
          <template #title>装船管理</template>
        </el-menu-item>
        
        <el-menu-item index="/bills">
          <el-icon><Ticket /></el-icon>
          <template #title>提单放单</template>
        </el-menu-item>
        
        <el-divider class="menu-divider" />
        
        <el-menu-item index="/messages">
          <el-icon><Bell /></el-icon>
          <template #title>
            待办消息
            <el-badge
              v-if="pendingCount > 0"
              :value="pendingCount"
              class="message-badge"
              is-dot
            />
          </template>
        </el-menu-item>
        
        <el-menu-item index="/exceptions">
          <el-icon><Warning /></el-icon>
          <template #title>异常处理</template>
        </el-menu-item>
        
        <el-menu-item index="/audit">
          <el-icon><DocumentChecked /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="main-header">
        <div class="header-left">
          <el-button
            text
            @click="toggleCollapse"
            style="margin-right: 16px"
          >
            <el-icon :size="20"><Fold /></el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta?.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-detail">
                <span class="user-name">{{ userStore.userName }}</span>
                <span class="user-role">{{ userStore.userRoleLabel }}</span>
              </div>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/userStore'
import { messageApi } from '@/api'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const pendingCount = ref(0)

const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const fetchPendingCount = async () => {
  try {
    const result = await messageApi.getPendingCount()
    pendingCount.value = result.data?.count || 0
  } catch (error) {
    console.error('Fetch pending count error:', error)
  }
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人信息功能开发中')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(async () => {
          await userStore.logout()
          ElMessage.success('已退出登录')
          router.push('/login')
        })
        .catch(() => {})
      break
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchPendingCount()
  }
})

watch(
  () => route.path,
  () => {
    if (userStore.isLoggedIn) {
      fetchPendingCount()
    }
  }
)
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.main-aside {
  background-color: #1f2937;
  transition: width 0.3s;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid #374151;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.menu-divider {
  margin: 10px 20px;
  border-color: #374151;
}

.message-badge {
  margin-left: 8px;
}

.main-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background-color: #409eff;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow: auto;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(64, 158, 255, 0.2) !important;
}
</style>
