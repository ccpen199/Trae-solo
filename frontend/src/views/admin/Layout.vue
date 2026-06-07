<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

const menuItems = [
  { path: '/admin/dashboard', title: '数据概览', icon: 'DataAnalysis' },
  { path: '/admin/map', title: 'GIS热力图', icon: 'MapLocation' },
  { path: '/admin/devices', title: '设备管理', icon: 'Tools' },
  { path: '/admin/workorders', title: '工单管理', icon: 'Document' },
  { path: '/admin/reports', title: '报表管理', icon: 'PieChart' },
  { path: '/admin/alerts', title: '告警管理', icon: 'Bell' },
  { path: '/admin/firmware', title: '固件升级', icon: 'Upload' },
  { path: '/admin/brand', title: '品牌配置', icon: 'Setting' }
]

const activeMenu = computed(() => route.path)

function handleMenuSelect(path: string) {
  router.push(path)
}

function logout() {
  userStore.logout()
  router.push('/login')
}

function goToHome() {
  router.push('/home')
}
</script>

<template>
  <el-container class="admin-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#409eff"><Service /></el-icon>
        <span v-if="!isCollapse" class="logo-text">管理后台</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button
            :icon="isCollapse ? 'Expand' : 'Fold'"
            text
            @click="isCollapse = !isCollapse"
          />
        </div>

        <div class="header-right">
          <el-button text @click="goToHome">
            <el-icon><HomeFilled /></el-icon>
            <span>用户端</span>
          </el-button>
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="32">
                {{ (userStore.userInfo?.nickname || userStore.userInfo?.phone || 'U').charAt(0) }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.nickname || userStore.userInfo?.phone }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToHome">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;

  .sidebar {
    background: #304156;
    transition: width 0.3s;

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 60px;
      border-bottom: 1px solid #1f2d3d;

      .logo-text {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
      }
    }

    :deep(.el-menu) {
      background: #304156;
      border-right: none;

      .el-menu-item {
        color: #bfcbd9;
        height: 50px;
        line-height: 50px;

        &:hover {
          background: #263445;
          color: #fff;
        }

        &.is-active {
          background: #409eff;
          color: #fff;
        }
      }
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    border-bottom: 1px solid #ebeef5;
    padding: 0 20px;

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .username {
          color: #303133;
          font-size: 14px;
        }
      }
    }
  }

  .main-content {
    background: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .admin-layout {
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 1000;
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999;
    }

    .main-content {
      margin-top: 60px;
      padding: 12px;
    }
  }
}
</style>
