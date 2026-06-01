<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #2d3748">
      <div style="padding: 20px; text-align: center">
        <h2 style="color: white; margin: 0; font-size: 18px">资金拨付管理系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#2d3748"
        text-color="#a0aec0"
        active-text-color="#4299e1"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/projects" v-if="canViewProjects">
          <el-icon><FolderOpened /></el-icon>
          <span>资金项目</span>
        </el-menu-item>
        <el-menu-item index="/applications">
          <el-icon><Document /></el-icon>
          <span>拨付申请</span>
        </el-menu-item>
        <el-menu-item index="/audit" v-if="canViewAudit">
          <el-icon><Check /></el-icon>
          <span>审核工作台</span>
        </el-menu-item>
        <el-menu-item index="/payment" v-if="canViewPayment">
          <el-icon><Money /></el-icon>
          <span>支付管理</span>
        </el-menu-item>
        <el-menu-item index="/performance" v-if="canViewPerformance">
          <el-icon><TrendCharts /></el-icon>
          <span>绩效跟踪</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: white; border-bottom: 1px solid #e2e8f0; padding: 0 20px; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 16px; font-weight: 500">{{ pageTitle }}</span>
        <el-dropdown @command="handleCommand">
          <span style="cursor: pointer; display: flex; align-items: center; gap: 8px">
            <el-avatar :size="32" style="background-color: #409eff">
              {{ userName ? userName.charAt(0) : 'U' }}
            </el-avatar>
            <span>{{ userName }} ({{ userRoleText }})</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="switch">切换账号</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main style="background-color: #f7fafc; padding: 20px; overflow-y: auto">
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataLine, FolderOpened, Document, Check, Money, TrendCharts } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const { userName, userRole, logout } = useUserStore()

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '首页')

const roleTexts = {
  admin: '管理员',
  business: '业务审核',
  finance: '财务审核',
  leader: '领导审批',
  applicant: '项目单位'
}

const userRoleText = computed(() => roleTexts[userRole.value] || userRole.value)

const canViewProjects = computed(() => {
  return ['admin', 'finance', 'leader'].includes(userRole.value)
})

const canViewAudit = computed(() => {
  return ['admin', 'business', 'finance', 'leader'].includes(userRole.value)
})

const canViewPayment = computed(() => {
  return ['admin', 'finance'].includes(userRole.value)
})

const canViewPerformance = computed(() => {
  return ['admin', 'finance', 'leader'].includes(userRole.value)
})

const handleCommand = (command) => {
  if (command === 'logout') {
    logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } else if (command === 'switch') {
    logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
