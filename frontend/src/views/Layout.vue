<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" style="background-color: #2f4050">
      <div style="color: white; padding: 20px; text-align: center; font-size: 18px; font-weight: bold">
        作业盒子
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#2f4050"
        text-color="#a7b1c2"
        active-text-color="white"
      >
        <el-menu-item index="/homework">
          <el-icon><Document /></el-icon>
          <span>作业管理</span>
        </el-menu-item>
        <el-menu-item index="/class">
          <el-icon><School /></el-icon>
          <span>班级管理</span>
        </el-menu-item>
      </el-menu>
      <div style="position: absolute; bottom: 20px; left: 20px; right: 20px">
        <el-button type="danger" @click="handleLogout" style="width: 100%">退出登录</el-button>
      </div>
    </el-aside>
    <el-container>
      <el-main style="background-color: #f5f7fa; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, School } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示').then(() => {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}
</script>