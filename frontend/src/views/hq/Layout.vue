<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" style="background: #304156;">
      <div class="logo">总部运营中心</div>
      <el-menu
        :default-active="$route.path"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/hq/dashboard"><el-icon><DataAnalysis /></el-icon><span>数据概览</span></el-menu-item>
        <el-menu-item index="/hq/members"><el-icon><User /></el-icon><span>会员管理</span></el-menu-item>
        <el-menu-item index="/hq/transactions"><el-icon><List /></el-icon><span>交易流水</span></el-menu-item>
        <el-menu-item index="/hq/invoices"><el-icon><Document /></el-icon><span>发票管理</span></el-menu-item>
        <el-menu-item index="/hq/complaints"><el-icon><ChatDotRound /></el-icon><span>申诉处理</span></el-menu-item>
        <el-menu-item index="/hq/reports"><el-icon><TrendCharts /></el-icon><span>报表分析</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center;">
        <span>总部 - {{ userInfo?.name }}</span>
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
import { DataAnalysis, User, List, Document, ChatDotRound, TrendCharts } from '@element-plus/icons-vue'
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
