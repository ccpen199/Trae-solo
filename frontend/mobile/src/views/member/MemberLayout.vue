<template>
  <div class="member-layout">
    <div class="member-header">
      <div class="header-content">
        <h2>{{ memberInfo?.name || '会员中心' }}</h2>
        <el-button type="text" @click="handleLogout">退出</el-button>
      </div>
    </div>
    <div class="member-body">
      <router-view />
    </div>
    <div class="member-footer">
      <div class="footer-item" :class="{ active: activeTab === 'home' }" @click="switchTab('home')">
        <el-icon><House /></el-icon>
        <span>首页</span>
      </div>
      <div class="footer-item" :class="{ active: activeTab === 'points' }" @click="switchTab('points')">
        <el-icon><Star /></el-icon>
        <span>积分</span>
      </div>
      <div class="footer-item" :class="{ active: activeTab === 'balance' }" @click="switchTab('balance')">
        <el-icon><Wallet /></el-icon>
        <span>储值</span>
      </div>
      <div class="footer-item" :class="{ active: activeTab === 'coupons' }" @click="switchTab('coupons')">
        <el-icon><Ticket /></el-icon>
        <span>优惠券</span>
      </div>
      <div class="footer-item" :class="{ active: activeTab === 'records' }" @click="switchTab('records')">
        <el-icon><Document /></el-icon>
        <span>记录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { House, Star, Wallet, Ticket, Document } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const activeTab = ref('home')

const memberInfo = computed(() => {
  const member = localStorage.getItem('memberInfo')
  return member ? JSON.parse(member) : null
})

onMounted(() => {
  updateActiveTab()
})

watch(() => route.path, () => {
  updateActiveTab()
})

const updateActiveTab = () => {
  const path = route.path
  if (path.includes('home')) {
    activeTab.value = 'home'
  } else if (path.includes('points')) {
    activeTab.value = 'points'
  } else if (path.includes('balance')) {
    activeTab.value = 'balance'
  } else if (path.includes('coupons')) {
    activeTab.value = 'coupons'
  } else if (path.includes('records')) {
    activeTab.value = 'records'
  }
}

const switchTab = (tab) => {
  activeTab.value = tab
  router.push(`/member/${tab}`)
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('mobile_token')
    localStorage.removeItem('memberInfo')
    router.push('/login')
  })
}
</script>

<style scoped>
.member-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.member-header {
  height: 50px;
  background: #409EFF;
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

.member-body {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.member-footer {
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
  color: #409EFF;
}

.footer-item .el-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.footer-item span {
  font-size: 10px;
}
</style>