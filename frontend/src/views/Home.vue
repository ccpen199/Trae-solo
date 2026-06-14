<template>
  <div class="home-page">
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>欢迎回来，{{ user?.real_name || user?.username }}</h2>
        <p>{{ greetingText }}</p>
      </div>
      <div class="quick-actions">
        <el-button type="primary" size="large" @click="$router.push('/visitors/create')">
          <el-icon><Plus /></el-icon>
          访客授权
        </el-button>
        <el-button size="large" @click="$router.push('/access/verify')">
          <el-icon><Scan /></el-icon>
          扫码开门
        </el-button>
        <el-button size="large" @click="$router.push('/products')">
          <el-icon><Goods /></el-icon>
          生活服务
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-item">
        <el-icon size="32" color="#409eff"><Key /></el-icon>
        <div class="stat-info">
          <div class="stat-value">{{ stats?.visitors?.today || 0 }}</div>
          <div class="stat-label">今日访客</div>
        </div>
        </div>
      </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-item">
        <el-icon size="32" color="#67c23a"><Goods /></el-icon>
        <div class="stat-info">
          <div class="stat-value">{{ stats?.orders?.today || 0 }}</div>
          <div class="stat-label">今日订单</div>
        </div>
        </div>
      </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-item">
        <el-icon size="32" color="#e6a23c"><Warning /></el-icon>
        <div class="stat-info">
          <div class="stat-value">{{ stats?.alerts?.pending || 0 }}</div>
          <div class="stat-label">待处理告警</div>
        </div>
        </div>
      </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-item">
        <el-icon size="32" color="#f56c6c"><BellFilled /></el-icon>
        <div class="stat-info">
          <div class="stat-value">{{ stats?.visitors?.overstay || 0 }}</div>
          <div class="stat-label">超时滞留</div>
        </div>
        </div>
      </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">最新公告</span>
            <el-button type="primary" link @click="$router.push('/profile/announcements')">
              查看全部
            </el-button>
          </div>
        </template>
        <el-table :data="announcements" v-loading="loading" stripe>
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="announcementType(row.type)">{{ announcementTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.is_read" type="info">已读</el-tag>
              <el-tag v-else type="warning">未读</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="发布时间" width="180" />
        </el-table>
      </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">我的房号</span>
          </div>
        </template>
        <div v-if="userRooms.length === 0" class="empty-state">
          <el-icon size="48"><House /></el-icon>
          <p>暂无绑定房号</p>
          <el-button type="primary" @click="$router.push('/profile/rooms')">去绑定</el-button>
        </div>
        <div v-else class="room-list">
          <div v-for="room in userRooms" :key="room.id" class="room-item">
            <div class="room-info">
              <div class="room-name">{{ room.building_name }} {{ room.unit_number }}</div>
              <div class="room-extra">
                <el-tag :type="room.bind_status === 'verified' ? 'success' : 'warning'" size="small">
                  {{ room.bind_status === 'verified' ? '已认证' : '审核中' }}
                </el-tag>
                <span class="room-area">{{ room.area }}㎡</span>
              </div>
            </div>
          </div>
        </div>
        </el-card>
      
        <el-card class="section-card" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span class="card-title">门禁记录</span>
            <el-button type="primary" link @click="$router.push('/access')">
              查看全部
            </el-button>
          </div>
        </template>
        <el-table :data="accessRecords" v-loading="loading" size="small" stripe>
          <el-table-column prop="device_name" label="设备" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.result === 'success'" type="success" size="small">成功</el-tag>
              <el-tag v-else type="danger" size="small">失败</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="access_time" label="时间" width="150" />
        </el-table>
      </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { getDashboardStats, getAnnouncements, getUserRooms, getAccessRecords } from '../api'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const loading = ref(false)
const stats = ref(null)
const announcements = ref([])
const userRooms = ref([])
const accessRecords = ref([])

const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 12) return '早上好，开启美好的一天'
  if (hour < 18) return '下午好，祝您工作顺利'
  return '晚上好，欢迎回家'
})

function announcementType(type) {
  const map = { notice: '', warning: 'warning', survey: 'info' }
  return map[type] || ''
}

function announcementTypeText(type) {
  const map = { notice: '通知', warning: '警示', survey: '调查' }
  return map[type] || '通知'
}

async function loadData() {
  loading.value = true
  try {
    const [statsRes, annRes, roomsRes, accessRes] = await Promise.all([
      getDashboardStats(),
      getAnnouncements({ user_id: userStore.userId, limit: 5 }),
      getUserRooms({ user_id: userStore.userId }),
      getAccessRecords({ user_id: userStore.userId, limit: 5 })
    ])
    stats.value = statsRes.data
    announcements.value = annRes.data
    userRooms.value = roomsRes.data
    accessRecords.value = accessRes.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-page {
  padding: 0;
}

.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h2 {
  color: #fff;
  margin: 0 0 8px;
  font-size: 24px;
}

.welcome-text p {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.quick-actions {
  display: flex;
  gap: 15px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-info .stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-info .stat-label {
  font-size: 14px;
  color: #909399;
}

.content-row {
  margin-bottom: 0;
}

.section-card {
  border: none;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #909399;
}

.empty-state p {
  margin: 10px 0;
}

.room-list {
  max-height: 200px;
  overflow-y: auto;
}

.room-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.room-item:last-child {
  border-bottom: none;
}

.room-info .room-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
}

.room-extra {
  display: flex;
  align-items: center;
  gap: 10px;
}

.room-area {
  font-size: 12px;
  color: #909399;
}
</style>
