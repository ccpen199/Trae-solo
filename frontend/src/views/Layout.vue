<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon><Lock /></el-icon>
        <span>SSL管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>风险看板</span>
        </el-menu-item>
        <el-menu-item index="/domains">
          <el-icon><World /></el-icon>
          <span>域名资产</span>
        </el-menu-item>
        <el-menu-item index="/certificates">
          <el-icon><Key /></el-icon>
          <span>证书库存</span>
        </el-menu-item>
        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <span>续签任务</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>变更记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="item">
            <el-button circle @click="showAlerts = true">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" style="background-color: #409EFF;">
                {{ authStore.user?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ authStore.user?.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
    
    <el-dialog v-model="showAlerts" title="系统告警" width="600px">
      <el-empty v-if="alerts.length === 0" description="暂无告警信息" />
      <div v-else class="alerts-list">
        <div 
          v-for="alert in alerts" 
          :key="alert.id" 
          class="alert-item"
          :class="{ 'alert-read': alert.is_read }"
        >
          <div class="alert-level">
            <el-tag :type="alert.level === 'critical' ? 'danger' : alert.level === 'warning' ? 'warning' : 'info'" size="small">
              {{ alert.level === 'critical' ? '严重' : '警告' }}
            </el-tag>
          </div>
          <div class="alert-content">
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-time">{{ alert.triggered_at }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="markAllRead">全部标记已读</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { Lock, DataAnalysis, World, Key, List, Document, Bell } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showAlerts = ref(false)
const alerts = ref([])
const unreadCount = ref(0)

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => route.meta.title || '')

const loadAlerts = async () => {
  try {
    const res = await api.get('/dashboard/alerts', { params: { is_read: 'false' } })
    alerts.value = res.data.alerts
    unreadCount.value = res.data.alerts.filter(a => !a.is_read).length
  } catch (e) {
    console.error(e)
  }
}

const markAllRead = async () => {
  try {
    await api.post('/dashboard/alerts/read-all')
    loadAlerts()
    ElMessage.success('已全部标记为已读')
  } catch (e) {
    console.error(e)
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      authStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  }
}

onMounted(() => {
  loadAlerts()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-menu {
  border: none;
  height: calc(100vh - 60px);
}

.header {
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #e6e6e6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #303133;
}

.main-content {
  background-color: #f5f7fa;
  overflow-y: auto;
}

.alerts-list {
  max-height: 400px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.alert-item:hover {
  background-color: #f5f7fa;
}

.alert-item.alert-read {
  opacity: 0.6;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 12px;
  color: #909399;
}
</style>
