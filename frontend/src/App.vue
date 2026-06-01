<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo">
          <el-icon :size="32" color="#fff"><Warning /></el-icon>
          <span class="title">消防接处警调度系统</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="switchRole">
            <span class="role-switch">
              <el-icon><User /></el-icon>
              {{ currentRoleLabel }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="receiver" :disabled="currentRole === 'receiver'">接警员</el-dropdown-item>
                <el-dropdown-item command="commander" :disabled="currentRole === 'commander'">指挥员</el-dropdown-item>
                <el-dropdown-item command="station" :disabled="currentRole === 'station'">消防站</el-dropdown-item>
                <el-dropdown-item command="field" :disabled="currentRole === 'field'">现场队伍</el-dropdown-item>
                <el-dropdown-item command="admin" :disabled="currentRole === 'admin'">管理员</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#1f2d3d"
          text-color="#fff"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('receiver')" index="/alarm-desk">
            <el-icon><Phone /></el-icon>
            <span>接警台</span>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('commander')" index="/dispatch">
            <el-icon><Position /></el-icon>
            <span>调度指挥</span>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('field')" index="/scene">
            <el-icon><Flag /></el-icon>
            <span>现场处置</span>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('admin')" index="/reports">
            <el-icon><DataAnalysis /></el-icon>
            <span>复盘报表</span>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('admin')" index="/resources">
            <el-icon><Grid /></el-icon>
            <span>资源管理</span>
          </el-menu-item>
        </el-menu>
        <div class="role-badge">
          <el-tag :type="roleTagType" effect="dark" size="large" round>{{ currentRoleLabel }}</el-tag>
        </div>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Warning, User, HomeFilled, Phone, Position, Flag,
  DataAnalysis, Grid, ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)

const currentRole = ref('admin')

const currentRoleLabel = computed(() => {
  const map = { receiver: '接警员', commander: '指挥员', station: '消防站', field: '现场队伍', admin: '管理员' }
  return map[currentRole.value] || '管理员'
})

const roleTagType = computed(() => {
  const map = { receiver: 'success', commander: 'danger', station: 'warning', field: 'info', admin: '' }
  return map[currentRole.value] || ''
})

const rolePermissions = {
  receiver: ['receiver', 'admin'],
  commander: ['commander', 'admin'],
  station: ['station', 'admin'],
  field: ['field', 'admin'],
  admin: ['receiver', 'commander', 'station', 'field', 'admin']
}

const hasPermission = (requiredRole) => {
  return rolePermissions[currentRole.value]?.includes(requiredRole)
}

const switchRole = (role) => {
  currentRole.value = role
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; width: 100%; }
</style>

<style scoped>
.app-container { height: 100%; }
.app-header {
  background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%);
  padding: 0; height: 60px; display: flex; align-items: center;
}
.header-content {
  width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 24px;
}
.logo { display: flex; align-items: center; gap: 12px; }
.title { color: #fff; font-size: 20px; font-weight: 600; letter-spacing: 2px; }
.header-right { display: flex; align-items: center; }
.role-switch {
  color: #fff; display: flex; align-items: center; gap: 6px; cursor: pointer;
  font-size: 14px; padding: 6px 12px; border-radius: 6px;
  background: rgba(255,255,255,0.15);
}
.role-switch:hover { background: rgba(255,255,255,0.25); }
.app-aside { background-color: #1f2d3d; height: calc(100vh - 60px); display: flex; flex-direction: column; }
.app-aside .el-menu { border-right: none; flex: 1; }
.role-badge {
  padding: 16px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);
}
.app-main { background-color: #f0f2f5; padding: 20px; height: calc(100vh - 60px); overflow-y: auto; }
</style>
