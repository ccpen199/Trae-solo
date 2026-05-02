<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <el-icon size="28"><Monitor /></el-icon>
        <span v-show="!isCollapse" class="logo-text">3D产品展示系统</span>
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
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/orders/create" v-if="canCreateOrder">
          <el-icon><Plus /></el-icon>
          <template #title>创建订单</template>
        </el-menu-item>
        <el-menu-item index="/notifications">
          <el-icon><Bell /></el-icon>
          <template #title>
            消息通知
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge" />
          </template>
        </el-menu-item>
        <el-menu-item index="/corrections" v-if="isOperator">
          <el-icon><RefreshRight /></el-icon>
          <template #title>冲正记录</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="isCollapse = !isCollapse">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ authStore.name || authStore.username }}</span>
              <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
            </span>
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
      
      <el-main class="layout-main">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Monitor, Document, Plus, Bell, RefreshRight,
  User, SwitchButton, Expand, Fold, UserFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABEL, ROLE_COLOR, ROLES } from '@/utils/constants'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapse = ref(false)
const unreadCount = ref(0)
let timer = null

const activeMenu = computed(() => route.path)
const isOperator = computed(() => authStore.role === ROLES.OPERATOR)
const canCreateOrder = computed(() => 
  authStore.role === ROLES.CONSUMER || authStore.role === ROLES.OPERATOR
)
const roleLabel = computed(() => ROLE_LABEL[authStore.role] || authStore.role)
const roleTagType = computed(() => ROLE_COLOR[authStore.role] || 'info')

async function fetchUnreadCount() {
  try {
    const res = await request.get('/notifications/unread-count')
    unreadCount.value = res.data.unreadCount
  } catch (err) {
    console.error('获取未读消息数量失败:', err)
  }
}

function handleCommand(command) {
  switch (command) {
    case 'profile':
      ElMessage.info('个人信息功能开发中')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        authStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      }).catch(() => {})
      break
  }
}

onMounted(() => {
  fetchUnreadCount()
  timer = setInterval(fetchUnreadCount, 30000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
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
  gap: 12px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  color: #606266;
  font-size: 14px;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.notification-badge {
  margin-left: 8px;
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
