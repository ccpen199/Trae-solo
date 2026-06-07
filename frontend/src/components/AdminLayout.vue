<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-logo">
        <h3>政务管理后台</h3>
      </div>
      <nav class="sidebar-menu">
        <div 
          v-for="item in menuItems" 
          :key="item.path"
          class="menu-item"
          :class="{ active: currentPath.includes(item.path) }"
          @click="navigate(item.path)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.name }}</span>
        </div>
      </nav>
      <div class="sidebar-footer">
        <el-button type="text" @click="handleLogout">退出登录</el-button>
      </div>
    </aside>
    <main class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>管理后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag type="primary">{{ adminInfo?.name || '管理员' }}</el-tag>
          <span style="margin-left: 8px; color: #666;">{{ adminInfo?.department || '' }}</span>
        </div>
      </header>
      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  DataAnalysis, Document, ChatDotRound, Setting, Monitor
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const currentPath = ref('')

const adminInfo = computed(() => {
  const info = localStorage.getItem('admin_user')
  return info ? JSON.parse(info) : null
})

const menuItems = [
  { name: '控制台', path: '/admin/dashboard', icon: DataAnalysis },
  { name: '办件管理', path: '/admin/applications', icon: Document },
  { name: '工单管理', path: '/admin/workorders', icon: ChatDotRound },
  { name: '服务事项', path: '/admin/services', icon: Setting },
  { name: '系统监控', path: '/admin/monitor', icon: Monitor }
]

const currentTitle = computed(() => {
  const item = menuItems.find(m => currentPath.value.includes(m.path))
  return item ? item.name : ''
})

onMounted(() => {
  currentPath.value = route.path
})

const navigate = (path) => {
  currentPath.value = path
  router.push(path)
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    ElMessage.success('已退出登录')
    router.push('/admin/login')
  } catch (e) {
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1e5cb8 0%, #2d7dd2 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-logo h3 {
  font-size: 16px;
  text-align: center;
}

.sidebar-menu {
  flex: 1;
  padding: 16px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.menu-item:hover,
.menu-item.active {
  background: rgba(255, 255, 255, 0.15);
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-footer .el-button {
  color: white;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.admin-header {
  height: 60px;
  background: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-right {
  display: flex;
  align-items: center;
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
