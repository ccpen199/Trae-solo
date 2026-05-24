<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" style="background: #304156;">
      <div class="logo">会员中心</div>
      <el-menu
        :default-active="$route.path"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/member/dashboard"><el-icon><DataAnalysis /></el-icon><span>总览</span></el-menu-item>
        <el-menu-item index="/member/vehicles"><el-icon><Van /></el-icon><span>我的车辆</span></el-menu-item>
        <el-menu-item index="/member/coupons"><el-icon><Discount /></el-icon><span>我的优惠券</span></el-menu-item>
        <el-menu-item index="/member/transactions"><el-icon><List /></el-icon><span>加油记录</span></el-menu-item>
        <el-menu-item index="/member/recharge"><el-icon><Wallet /></el-icon><span>储值中心</span></el-menu-item>
        <el-menu-item index="/member/invoices"><el-icon><Document /></el-icon><span>发票管理</span></el-menu-item>
        <el-menu-item index="/member/complaints"><el-icon><ChatDotRound /></el-icon><span>申诉中心</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center;">
        <span>欢迎回来，{{ userInfo?.name || userInfo?.phone }}</span>
        <div>
          <el-tag type="success" size="small">{{ levelName }}</el-tag>
          <el-button text @click="logout">退出登录</el-button>
        </div>
      </el-header>
      <el-main style="background: #f5f7fa;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { DataAnalysis, Van, Discount, List, Wallet, Document, ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '../../utils/userStore'

const router = useRouter()
const { userInfo, clearUser, refreshUser } = useUserStore()

const levelNames = { 1: '普通会员', 2: '银卡会员', 3: '金卡会员', 4: '钻石会员' }
const levelName = computed(() => levelNames[userInfo.value.level_id] || '普通会员')

const handleUserUpdate = () => refreshUser()
onMounted(() => window.addEventListener('user-updated', handleUserUpdate))
onUnmounted(() => window.removeEventListener('user-updated', handleUserUpdate))

const logout = () => {
  clearUser()
  router.push('/')
}
</script>

<style scoped>
.logo { height: 60px; line-height: 60px; text-align: center; color: #fff; font-size: 18px; font-weight: bold; border-bottom: 1px solid #1f2d3d; }
.el-header { padding: 0 20px; }
</style>
