<template>
  <div class="mobile-container">
    <div class="header">
      <div class="flex-between">
        <h2 style="font-size: 18px;">我的办件</h2>
      </div>
      <div class="status-tabs" style="margin-top: 12px;">
        <div 
          v-for="tab in statusTabs" 
          :key="tab.value"
          class="status-tab"
          :class="{ active: activeStatus === tab.value }"
          @click="selectStatus(tab.value)"
        >
          {{ tab.label }}
        </div>
      </div>
    </div>

    <div style="padding: 16px;">
      <div v-if="!userStore.isLoggedIn" class="gov-card text-center" style="padding: 40px 20px;">
        <el-icon :size="48" color="#ccc"><Lock /></el-icon>
        <p style="margin: 16px 0; color: #999;">请先登录查看您的办件</p>
        <el-button type="primary" @click="goToLogin">立即登录</el-button>
      </div>

      <div v-else>
        <div v-if="applications.length > 0" class="application-list">
          <div 
            v-for="app in applications" 
            :key="app.id"
            class="application-card"
            @click="viewDetail(app.id)"
          >
            <div class="app-header">
              <span class="app-no">{{ app.application_no }}</span>
              <span :class="['status-badge', `status-${app.status}`]">
                {{ getStatusText(app.status) }}
              </span>
            </div>
            <h3 class="app-name">{{ app.service_name }}</h3>
            <p class="app-time">提交时间：{{ formatTime(app.submit_time || app.created_at) }}</p>
            <div class="app-progress" v-if="app.status === 'processing'">
              <el-progress :percentage="getProgress(app.current_step || 0)" :show-text="false" />
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无办件记录" />
          <el-button type="primary" style="margin-top: 16px;" @click="goToServices">去办理</el-button>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { applicationApi } from '@/api'
import BottomNav from '@/components/BottomNav.vue'
import { Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const activeStatus = ref('')
const applications = ref([])

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '办理中', value: 'processing' },
  { label: '已完成', value: 'completed' }
]

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadApplications()
  }
})

const loadApplications = async () => {
  try {
    const res = await applicationApi.getMyList({ status: activeStatus.value })
    applications.value = res
  } catch (e) {
    applications.value = [
      { id: 1, application_no: 'APP202401150001', service_name: '社保查询', status: 'completed', submit_time: '2024-01-15 10:30:00', current_step: 3 },
      { id: 2, application_no: 'APP202401140002', service_name: '医保报销', status: 'processing', submit_time: '2024-01-14 14:20:00', current_step: 1 },
      { id: 3, application_no: 'APP202401130003', service_name: '新生儿入户', status: 'pending', submit_time: '2024-01-13 09:15:00', current_step: 0 }
    ]
  }
}

const selectStatus = (status) => {
  activeStatus.value = status
  loadApplications()
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '办理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getProgress = (step) => {
  return Math.min(step * 33, 99)
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 16)
}

const viewDetail = (id) => {
  router.push(`/application/${id}`)
}

const goToLogin = () => {
  router.push('/login')
}

const goToServices = () => {
  router.push('/services')
}
</script>

<style scoped>
.status-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.status-tab {
  flex-shrink: 0;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.status-tab:hover,
.status-tab.active {
  background: white;
  color: #1e5cb8;
}

.application-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.application-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.application-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.app-no {
  font-size: 12px;
  color: #999;
}

.app-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.app-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}
</style>
