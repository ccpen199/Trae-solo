<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background: #001529; overflow: auto">
      <div style="color: #fff; font-size: 18px; font-weight: bold; padding: 20px; text-align: center; border-bottom: 1px solid #1f3a5c">
        <el-icon size="24" style="margin-right: 8px"><Key /></el-icon>
        统一身份 SSO
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/workbench">
          <el-icon><Odometer /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/applications">
          <el-icon><Collection /></el-icon>
          <span>应用档案</span>
        </el-menu-item>
        <el-menu-item index="/change-orders">
          <el-icon><Document /></el-icon>
          <span>变更管理</span>
        </el-menu-item>
        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <span>执行任务</span>
        </el-menu-item>
        <el-menu-item index="/secrets">
          <el-icon><Lock /></el-icon>
          <span>密钥管理</span>
        </el-menu-item>
        <el-menu-item index="/alerts">
          <el-icon><Warning /></el-icon>
          <span>告警中心</span>
        </el-menu-item>
        <el-menu-item index="/audit">
          <el-icon><DocumentChecked /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between">
        <div style="font-size: 16px; font-weight: 500">{{ pageTitle }}</div>
        <div style="display: flex; align-items: center; gap: 20px">
          <el-select v-model="currentUserId" size="small" style="width: 160px" @change="switchUser">
            <el-option v-for="user in users" :key="user.id" :label="`${user.real_name} (${user.role_name})`" :value="user.id" />
          </el-select>
          <el-avatar>{{ user?.real_name?.charAt(0) || 'U' }}</el-avatar>
        </div>
      </el-header>
      <el-main style="background: #f5f7fa; overflow: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api, { userApi } from './api'

const route = useRoute()
const users = ref([])
const currentUserId = ref(1)
const user = ref(null)

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => {
  const titles = {
    '/dashboard': '数据概览',
    '/workbench': '工作台 - 待处理事项',
    '/applications': '应用档案管理',
    '/change-orders': '变更单管理',
    '/tasks': '执行任务列表',
    '/secrets': '密钥管理中心',
    '/alerts': '告警中心',
    '/audit': '审计日志'
  }
  return titles[route.path.split('/').slice(0, 2).join('/')] || '统一身份 SSO 平台'
})

async function loadUsers() {
  try {
    const res = await userApi.list()
    users.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function switchUser(id) {
  api.defaults.headers['X-User-Id'] = id
  loadCurrentUser()
}

async function loadCurrentUser() {
  try {
    const res = await userApi.me()
    user.value = res
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadUsers()
  loadCurrentUser()
})
</script>
