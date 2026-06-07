<template>
  <el-container class="admin-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="admin-aside">
      <div class="logo-area" @click="goHome">
        <el-icon :size="28" color="#409eff"><DataLine /></el-icon>
        <span v-if="!isCollapse" class="logo-text">品牌智库</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#001529"
        text-color="#a6adb4"
        active-text-color="#fff"
        class="admin-menu"
      >
        <el-menu-item index="/admin">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/admin/brands">
          <el-icon><Shop /></el-icon>
          <template #title>品牌管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/rankings">
          <el-icon><Trophy /></el-icon>
          <template #title>榜单管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/knowledge">
          <el-icon><Document /></el-icon>
          <template #title>知识管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/traceability">
          <el-icon><Connection /></el-icon>
          <template #title>数据溯源</template>
        </el-menu-item>
        <el-menu-item index="/admin/expert-reviews">
          <el-icon><UserFilled /></el-icon>
          <template #title>专家评审</template>
        </el-menu-item>
        <el-menu-item index="/admin/reports">
          <el-icon><Document /></el-icon>
          <template #title>研究报告</template>
        </el-menu-item>
        <el-menu-item index="/admin/alerts">
          <el-icon><Bell /></el-icon>
          <template #title>更新预警</template>
        </el-menu-item>
        <el-menu-item index="/admin/data-sources">
          <el-icon><Wallet /></el-icon>
          <template #title>数据源</template>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><Avatar /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/admin' }">管理后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tooltip content="检查更新" placement="bottom">
            <el-button type="primary" link @click="handleCheckUpdates">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ authStore.user?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ authStore.user?.username }}</span>
              <el-tag :type="authStore.isSuperAdmin ? 'danger' : 'success'" size="small" class="role-tag">
                {{ authStore.isSuperAdmin ? '管理员' : '专家' }}
              </el-tag>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="frontend">
                  <el-icon><House /></el-icon>返回前台
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="admin-content">
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataLine, DataAnalysis, Shop, Trophy, Document, Connection,
  UserFilled, Bell, Wallet, Avatar, Expand, Fold,
  CaretBottom, House, SwitchButton, Refresh
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { adminAPI } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapse = ref(false)

const menuTitles = {
  '/admin': '仪表盘',
  '/admin/brands': '品牌管理',
  '/admin/rankings': '榜单管理',
  '/admin/knowledge': '知识管理',
  '/admin/traceability': '数据溯源',
  '/admin/expert-reviews': '专家评审',
  '/admin/reports': '研究报告',
  '/admin/alerts': '更新预警',
  '/admin/data-sources': '数据源',
  '/admin/users': '用户管理'
}

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => menuTitles[route.path] || '管理后台')

function goHome() {
  router.push('/admin')
}

async function handleCheckUpdates() {
  try {
    ElMessage.info('正在检查更新...')
    await adminAPI.checkUpdates()
    ElMessage.success('更新检查完成')
  } catch (e) {
    console.error(e)
  }
}

function handleCommand(command) {
  switch (command) {
    case 'frontend':
      router.push('/')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        authStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      }).catch(() => {})
      break
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.admin-aside {
  background: #001529;
  transition: width 0.3s;
  overflow: hidden;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  cursor: pointer;
  border-bottom: 1px solid #1f3a57;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #409eff, #667eea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.admin-menu {
  border-right: none;
}

.admin-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.admin-menu :deep(.el-menu-item:hover) {
  background: #1f3a57;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #409eff, #667eea);
}

.admin-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  height: 60px;
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
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: #409eff;
}

.breadcrumb {
  font-size: 14px;
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
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}

.avatar {
  background: linear-gradient(135deg, #409eff, #667eea);
}

.username {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.role-tag {
  margin-left: 4px;
}

.admin-content {
  padding: 24px;
  background: #f0f2f5;
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
