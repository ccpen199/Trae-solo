<template>
  <div class="layout">
    <div class="layout-header">
      <div class="title">企业门户统一工作台</div>
      <div class="user" @click="handleMenu">
        <el-dropdown trigger="click" @command="handleCommand">
          <span>{{ user?.display_name || user?.username }} ({{ roleLabel }}) ▾</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="layout-body">
      <div class="layout-side">
        <el-menu
          :default-active="$route.path"
          router
          :collapse="false"
          background-color="#ffffff"
          text-color="#303133"
          active-text-color="#409eff"
        >
          <el-menu-item index="/portal"><el-icon><HomeFilled /></el-icon><span>工作台首页</span></el-menu-item>
          <el-menu-item index="/app-catalog"><el-icon><Menu /></el-icon><span>应用目录</span></el-menu-item>
          <el-menu-item index="/permission-apply"><el-icon><Key /></el-icon><span>权限申请</span></el-menu-item>
          <el-menu-item index="/my-permissions"><el-icon><User /></el-icon><span>我的权限</span></el-menu-item>
          <el-sub-menu index="admin" popper-class="admin-menu">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>管理中心</span>
            </template>
            <el-menu-item index="/dashboard"><el-icon><DataLine /></el-icon><span>总览看板</span></el-menu-item>
            <el-menu-item index="/applications"><el-icon><Box /></el-icon><span>应用管理</span></el-menu-item>
            <el-menu-item index="/configs"><el-icon><Setting /></el-icon><span>配置中心</span></el-menu-item>
            <el-menu-item index="/tasks"><el-icon><VideoPlay /></el-icon><span>执行任务</span></el-menu-item>
            <el-menu-item index="/logs"><el-icon><Document /></el-icon><span>调用日志</span></el-menu-item>
            <el-menu-item index="/change-orders"><el-icon><Tickets /></el-icon><span>变更单</span></el-menu-item>
            <el-menu-item index="/alerts"><el-icon><Warning /></el-icon><span>告警中心</span></el-menu-item>
            <el-menu-item index="/review-center"><el-icon><CircleCheck /></el-icon><span>复核中心</span></el-menu-item>
            <el-menu-item index="/audits"><el-icon><Lock /></el-icon><span>权限审计</span></el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
      <div class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  DataLine, Box, Setting, VideoPlay, Document, Tickets, Warning, Lock, CircleCheck,
  HomeFilled, Menu, Key, User
} from '@element-plus/icons-vue'
import { AuthAPI } from '../api'

const router = useRouter()
const user = ref(null)

const roleMap = {
  admin: '系统管理员', platform: '平台工程师', ops: '运维工程师',
  dev: '开发者', owner: '应用负责人', security: '安全管理员', viewer: '访客'
}
const roleLabel = computed(() => roleMap[user.value?.role] || user.value?.role)

onMounted(async () => {
  const cached = localStorage.getItem('user')
  if (cached) user.value = JSON.parse(cached)
  try {
    const res = await AuthAPI.me()
    if (res?.code === 0) {
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    }
  } catch (e) {}
})

function handleCommand(cmd) {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning' }).then(async () => {
      try { await AuthAPI.logout() } catch (e) {}
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }).catch(() => {})
  } else if (cmd === 'profile') {
    ElMessage.info(`当前用户：${user.value?.display_name}`)
  }
}
function handleMenu() {}
</script>
