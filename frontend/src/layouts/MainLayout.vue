<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #2c3e50">
      <div style="padding: 20px; text-align: center; color: white; font-size: 18px; font-weight: bold; border-bottom: 1px solid #34495e">
        社团管理系统
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-demo"
        background-color="#2c3e50"
        text-color="#bdc3c7"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/clubs">
          <el-icon><OfficeBuilding /></el-icon>
          <span>社团列表</span>
        </el-menu-item>
        <el-menu-item index="/my-clubs">
          <el-icon><User /></el-icon>
          <span>我的社团</span>
        </el-menu-item>
        <el-menu-item index="/recruitment">
          <el-icon><Tickets /></el-icon>
          <span>纳新活动</span>
        </el-menu-item>
        <el-menu-item index="/my-applications">
          <el-icon><Document /></el-icon>
          <span>我的报名</span>
        </el-menu-item>
        <el-menu-item index="/activities">
          <el-icon><Calendar /></el-icon>
          <span>活动中心</span>
        </el-menu-item>
        <el-sub-menu index="admin" v-if="userStore.isAdmin || userStore.isTeacher || userStore.isLeader">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>管理后台</span>
          </template>
          <el-menu-item index="/admin/clubs" v-if="userStore.isAdmin">
            <span>社团审批</span>
          </el-menu-item>
          <el-menu-item index="/admin/recruitment">
            <span>纳新审批</span>
          </el-menu-item>
          <el-menu-item index="/admin/activities">
            <span>活动审批</span>
          </el-menu-item>
          <el-menu-item index="/admin/funds" v-if="userStore.isAdmin">
            <span>经费审批</span>
          </el-menu-item>
          <el-menu-item index="/admin/reviews" v-if="userStore.isAdmin">
            <span>年审管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/stats" v-if="userStore.isAdmin">
            <span>数据统计</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: white; border-bottom: 1px solid #e4e7ed; display: flex; justify-content: space-between; align-items: center; padding: 0 20px">
        <span style="font-size: 16px; font-weight: 500">欢迎使用学校社团管理系统</span>
        <div style="display: flex; align-items: center; gap: 15px">
          <span>{{ userStore.user?.name }}</span>
          <el-tag size="small" :type="userTagType">
            {{ userRoleText }}
          </el-tag>
          <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main style="background-color: #f5f7fa; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { HomeFilled, OfficeBuilding, User, Tickets, Document, Calendar, Setting } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const activeMenu = computed(() => route.path)

const userTagType = computed(() => {
  const roleMap = {
    admin: 'danger',
    teacher: 'warning',
    leader: 'success',
    student: 'info'
  }
  return roleMap[userStore.user?.role] || 'info'
})

const userRoleText = computed(() => {
  const roleMap = {
    admin: '管理员',
    teacher: '指导老师',
    leader: '负责人',
    student: '学生'
  }
  return roleMap[userStore.user?.role] || '学生'
})

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {})
}
</script>

<style scoped>
.el-menu-vertical-demo {
  border-right: none;
}
</style>
