<template>
  <el-container class="main-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo-area">
        <span v-if="!isCollapse" class="logo-text">成绩管理系统</span>
        <span v-else class="logo-text-collapsed">SG</span>
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
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <template v-if="userStore.isTeacherOrAdmin || userStore.isSystemAdmin">
          <el-menu-item index="/users" v-if="userStore.hasPermission('user:list')">
            <el-icon><UserFilled /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>

          <el-menu-item index="/departments" v-if="userStore.hasPermission('department:list')">
            <el-icon><OfficeBuilding /></el-icon>
            <template #title>系别管理</template>
          </el-menu-item>

          <el-menu-item index="/classes" v-if="userStore.hasPermission('class:list')">
            <el-icon><Collection /></el-icon>
            <template #title>班级管理</template>
          </el-menu-item>

          <el-menu-item index="/students" v-if="userStore.hasPermission('student:list')">
            <el-icon><Avatar /></el-icon>
            <template #title>学生管理</template>
          </el-menu-item>

          <el-menu-item index="/courses" v-if="userStore.hasPermission('course:list')">
            <el-icon><Reading /></el-icon>
            <template #title>课程管理</template>
          </el-menu-item>

          <el-sub-menu index="grades-sub" v-if="userStore.hasPermission('grade:list')">
            <template #title>
              <el-icon><DataLine /></el-icon>
              <span>成绩管理</span>
            </template>
            <el-menu-item index="/grades">成绩录入</el-menu-item>
            <el-menu-item index="/grade-statistics" v-if="userStore.hasPermission('grade:statistics')">成绩统计</el-menu-item>
          </el-sub-menu>
        </template>

        <template v-else-if="userStore.isStudent">
          <el-menu-item index="/my-grades" v-if="userStore.hasPermission('grade:my')">
            <el-icon><Document /></el-icon>
            <template #title>我的成绩</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRouteName !== 'Dashboard'">
              {{ currentRouteName }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span class="user-name">{{ userStore.userName }}</span>
              <el-tag :type="roleTagType" size="small" class="role-tag">{{ userStore.userRole }}</el-tag>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

const activeMenu = computed(() => {
  return route.path
})

const currentRouteName = computed(() => {
  return route.meta?.title || route.name
})

const roleTagType = computed(() => {
  const code = userStore.userInfo?.role?.code
  const typeMap = {
    'SYSTEM_ADMIN': 'danger',
    'TEACHING_ADMIN': 'warning',
    'TEACHER': 'primary',
    'STUDENT': 'success'
  }
  return typeMap[code] || 'info'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await userStore.logout()
      }).catch(() => {})
      break
  }
}
</script>

<style scoped>
.main-container {
  height: 100%;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
  color: #fff;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.logo-text-collapsed {
  font-size: 20px;
  font-weight: 700;
}

.sidebar .el-menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
  color: #666;
  transition: color 0.3s;
}

.collapse-icon:hover {
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background-color: #409EFF;
  color: #fff;
}

.user-name {
  margin: 0 10px;
  color: #333;
}

.role-tag {
  margin-right: 5px;
}

.dropdown-icon {
  font-size: 12px;
  color: #999;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
