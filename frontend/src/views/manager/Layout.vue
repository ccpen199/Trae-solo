<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" style="background: #304156;">
      <div class="logo">站长工作站</div>
      <el-menu
        :default-active="$route.path"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/manager/dashboard"><el-icon><DataAnalysis /></el-icon><span>经营概览</span></el-menu-item>
        <el-menu-item index="/manager/prices"><el-icon><Money /></el-icon><span>油价管理</span></el-menu-item>
        <el-menu-item index="/manager/inventory"><el-icon><Box /></el-icon><span>库存管理</span></el-menu-item>
        <el-menu-item index="/manager/transactions"><el-icon><List /></el-icon><span>交易记录</span></el-menu-item>
        <el-menu-item index="/manager/shifts"><el-icon><Clock /></el-icon><span>班次管理</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center;">
        <span>{{ userInfo?.station?.name }} - 站长：{{ userInfo?.name }}</span>
        <el-button text @click="logout">退出登录</el-button>
      </el-header>
      <el-main style="background: #f5f7fa;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { DataAnalysis, Money, Box, List, Clock } from '@element-plus/icons-vue'
import { useUserStore } from '../../utils/userStore'

const router = useRouter()
const { userInfo, clearUser, refreshUser } = useUserStore()

const handleUserUpdate = () => refreshUser()
onMounted(() => {
  refreshUser()
  window.addEventListener('user-updated', handleUserUpdate)
})
onUnmounted(() => window.removeEventListener('user-updated', handleUserUpdate))

const logout = () => {
  clearUser()
  router.push('/')
}
</script>

<style scoped>
.logo { height: 60px; line-height: 60px; text-align: center; color: #fff; font-size: 18px; font-weight: bold; border-bottom: 1px solid #1f2d3d; }
</style>
