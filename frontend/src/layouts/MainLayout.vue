<template>
  <el-container class="main-container">
    <el-aside width="220px" class="main-aside">
      <div class="logo">
        <el-icon :size="28"><OfficeBuilding /></el-icon>
        <span>社区服务系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-sub-menu index="activities">
          <template #title>
            <el-icon><Calendar /></el-icon>
            <span>活动管理</span>
          </template>
          <el-menu-item index="/dashboard/activities">活动列表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="registrations" v-if="['organizer', 'admin'].includes(authStore.user?.role || '')">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>报名管理</span>
          </template>
          <el-menu-item index="/dashboard/registrations">报名审核</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="shifts">
          <template #title>
            <el-icon><Clock /></el-icon>
            <span>排班管理</span>
          </template>
          <el-menu-item index="/dashboard/shifts">我的排班</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="attendances">
          <template #title>
            <el-icon><Location /></el-icon>
            <span>考勤管理</span>
          </template>
          <el-menu-item index="/dashboard/attendances">考勤记录</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="user-center">
          <template #title>
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </template>
          <el-menu-item index="/dashboard/profile">个人信息</el-menu-item>
          <el-menu-item index="/dashboard/notifications">通知中心</el-menu-item>
          <el-menu-item index="/dashboard/badges">荣誉勋章</el-menu-item>
          <el-menu-item index="/dashboard/credit-records">诚信分记录</el-menu-item>
        </el-sub-menu>

        <el-sub-menu
          index="admin"
          v-if="['admin', 'reviewer', 'organizer'].includes(authStore.user?.role || '')"
        >
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>管理功能</span>
          </template>
          <el-menu-item index="/dashboard/admin/anomalies" v-if="['admin', 'reviewer', 'organizer'].includes(authStore.user?.role || '')">
            异常管理
          </el-menu-item>
          <el-menu-item index="/dashboard/admin/statistics" v-if="['admin', 'reviewer'].includes(authStore.user?.role || '')">
            数据统计
          </el-menu-item>
          <el-menu-item index="/dashboard/admin/audit-logs" v-if="['admin', 'reviewer'].includes(authStore.user?.role || '')">
            审计日志
          </el-menu-item>
          <el-menu-item index="/dashboard/admin/users" v-if="authStore.user?.role === 'admin'">
            用户管理
          </el-menu-item>
          <el-menu-item index="/dashboard/admin/skills" v-if="authStore.user?.role === 'admin'">
            技能管理
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="main-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ authStore.user?.full_name }}</span>
              <el-tag :type="roleTagType" size="small">{{ roleText }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
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
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta && item.meta.title)
  return matched.map((item) => ({
    path: item.path,
    name: (item.meta as { title?: string }).title || item.name,
  }))
})

const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    volunteer: '志愿者',
    organizer: '组织者',
    admin: '管理员',
    reviewer: '评审员',
  }
  return roleMap[authStore.user?.role || ''] || '未知'
})

const roleTagType = computed(() => {
  const typeMap: Record<string, string> = {
    volunteer: '',
    organizer: 'primary',
    admin: 'danger',
    reviewer: 'warning',
  }
  return typeMap[authStore.user?.role || ''] || 'info'
})

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/dashboard/profile')
  } else if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

watch(
  () => route.path,
  () => {
    // 根据路由变化更新面包屑等
  },
  { immediate: true }
)
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.main-aside {
  background-color: #304156;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5c;
}

.sidebar-menu {
  border-right: none;
}

.main-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-name {
  margin-left: 8px;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
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
