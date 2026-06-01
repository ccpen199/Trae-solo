<template>
  <div class="layout-container">
    <div class="sidebar">
      <div style="padding: 20px; text-align: center; font-size: 16px; font-weight: 600; border-bottom: 1px solid #1f2d3d;">
        礼物商城后台
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <span>📊 数据概览</span>
        </el-menu-item>
        <el-menu-item index="/gifts">
          <span>🎁 礼物库管理</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <span>📋 订单管理</span>
        </el-menu-item>
        <el-menu-item index="/activities">
          <span>🎉 活动配置</span>
        </el-menu-item>
        <el-menu-item index="/risk">
          <span>🛡️ 风控管理</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <span>📈 运营报表</span>
        </el-menu-item>
        <el-menu-item index="/users" v-if="userStore.user?.role === 'admin'">
          <span>👥 用户管理</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column;">
      <div style="background: white; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span>余额: ¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</span>
          <el-dropdown @command="handleCommand">
            <span style="cursor: pointer;">
              {{ userStore.user?.nickname || userStore.user?.username }} ({{ userStore.user?.role }})
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    ElMessage.info('个人信息功能开发中')
  }
}
</script>
