<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" style="background: #304156;">
      <div class="logo">收银台</div>
      <el-menu
        :default-active="$route.path"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/cashier/fuel"><el-icon><Odometer /></el-icon><span>加油收银</span></el-menu-item>
        <el-menu-item index="/cashier/transactions"><el-icon><List /></el-icon><span>交易记录</span></el-menu-item>
        <el-menu-item index="/cashier/shift"><el-icon><Clock /></el-icon><span>班次管理</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center;">
        <span>{{ userInfo?.station?.name }} - 收银员：{{ userInfo?.name }}</span>
        <div>
          <el-tag v-if="myShift" type="success" size="small">当前班次: {{ myShift.shift_name }}</el-tag>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Odometer, List, Clock } from '@element-plus/icons-vue'
import { shift } from '../../api'
import { useUserStore } from '../../utils/userStore'

const router = useRouter()
const { userInfo, clearUser, refreshUser } = useUserStore()
const myShift = ref(null)

const loadShift = async () => {
  try {
    myShift.value = await shift.myShift()
  } catch (e) {}
}

const handleUserUpdate = () => refreshUser()
onMounted(() => {
  refreshUser()
  loadShift()
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
