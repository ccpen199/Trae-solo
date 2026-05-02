<template>
  <div class="store-layout">
    <div class="store-header">
      <div class="header-content">
        <h2>门店管理</h2>
        <el-button type="text" @click="handleLogout">退出</el-button>
      </div>
    </div>
    <div class="store-body">
      <router-view />
    </div>
    <div class="store-footer">
      <div class="footer-item" :class="{ active: activeTab === 'dashboard' }" @click="switchTab('dashboard')">
        <el-icon><DataAnalysis /></el-icon>
        <span>看板</span>
      </div>
      <div class="footer-item" :class="{ active: activeTab === 'alerts' }" @click="switchTab('alerts')">
        <el-icon><Warning /></el-icon>
        <span>预警</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { DataAnalysis, Warning } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const activeTab = ref('dashboard')

const userInfo = computed(() => {
  const user = localStorage.getItem('userInfo')
  return user ? JSON.parse(user) : null
})

onMounted(() => {
  updateActiveTab()
})

watch(() => route.path, () => {
  updateActiveTab()
})

const updateActiveTab = () => {
  const path = route.path
  if (path.includes('dashboard')) {
    activeTab.value = 'dashboard'
  } else if (path.includes('alerts')) {
    activeTab.value = 'alerts'
  }
}

const switchTab = (tab) => {
  activeTab.value = tab
  router.push(`/store/${tab}`)
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('mobile_token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  })
}
</script>

<style scoped>
.store-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.store-header {
  height: 50px;
  background: #67c23a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  width: 90%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.store-body {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.store-footer {
  height: 60px;
  background: white;
  display: flex;
  border-top: 1px solid #e4e7ed;
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.footer-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.footer-item.active {
  color: #67c23a;
}

.footer-item .el-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.footer-item span {
  font-size: 10px;
}
</style>