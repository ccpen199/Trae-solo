<template>
  <div class="app-container">
    <el-container style="height: 100%">
      <el-header style="background: #fff; border-bottom: 1px solid #e4e7ed; padding: 0 20px;">
        <div class="flex-between" style="height: 60px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <el-icon size="28" color="#409eff"><DataAnalysis /></el-icon>
            <span style="font-size: 18px; font-weight: 600; color: #303133;">AI 客户流失预警 Agent</span>
          </div>
          <div style="display: flex; align-items: center; gap: 20px;">
            <span style="color: #606266;">
              <el-icon><User /></el-icon>
              {{ authStore.user?.name }} ({{ roleName }})
            </span>
            <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
          </div>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px" style="background: #fff; border-right: 1px solid #e4e7ed;">
          <el-menu
            :default-active="activeMenu"
            router
            style="border-right: none;"
          >
            <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main style="padding: 0; background: #f5f7fa;">
          <router-view v-slot="{ Component }">
            <div class="content-wrapper">
              <component :is="Component" />
            </div>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { DataAnalysis, User, DataBoard, Warning, List, Setting, Document } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const menuItems = [
  { path: '/dashboard', title: '数据看板', icon: 'DataBoard' },
  { path: '/customers', title: '客户管理', icon: 'User' },
  { path: '/assessments', title: '风险评估', icon: 'Warning' },
  { path: '/tasks', title: '挽回任务', icon: 'List' },
  { path: '/config', title: '规则配置', icon: 'Setting' },
  { path: '/logs', title: '操作日志', icon: 'Document' }
]

const roleName = computed(() => {
  const roles = {
    admin: '系统管理员',
    manager: '业务负责人',
    operator: '一线运营',
    auditor: '审核人员'
  }
  return roles[authStore.user?.role] || ''
})

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout()
    router.push('/login')
  }).catch(() => {})
}
</script>
