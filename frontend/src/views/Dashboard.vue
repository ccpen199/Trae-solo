<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <el-icon :size="36" color="#409eff"><Document /></el-icon>
          <div class="stats-info">
            <div class="stats-number">{{ stats.totalBookings }}</div>
            <div class="stats-label">订舱单总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <el-icon :size="36" color="#e6a23c"><Loading /></el-icon>
          <div class="stats-info">
            <div class="stats-number">{{ stats.pendingCount }}</div>
            <div class="stats-label">处理中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <el-icon :size="36" color="#67c23a"><CircleCheck /></el-icon>
          <div class="stats-info">
            <div class="stats-number">{{ stats.completedCount }}</div>
            <div class="stats-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <el-icon :size="36" color="#f56c6c"><Bell /></el-icon>
          <div class="stats-info">
            <div class="stats-number">{{ stats.pendingMessages }}</div>
            <div class="stats-label">待办消息</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header-title">
              <el-icon><List /></el-icon>
              <span>最近订舱单</span>
            </div>
          </template>
          
          <el-table :data="recentBookings" stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="mainNo" label="主单号" min-width="160">
              <template #default="{ row }">
                <el-link type="primary" @click="goToDetail(row.id)">
                  {{ row.mainNo }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="shipperName" label="货主" min-width="120" />
            <el-table-column prop="pol" label="装货港" min-width="80" />
            <el-table-column prop="pod" label="卸货港" min-width="80" />
            <el-table-column prop="status" label="状态" width="140">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header-title">
              <el-icon><Bell /></el-icon>
              <span>待办消息</span>
            </div>
          </template>
          
          <el-timeline v-if="pendingMessages.length > 0">
            <el-timeline-item
              v-for="msg in pendingMessages"
              :key="msg.id"
              :timestamp="formatTime(msg.createdAt)"
              placement="top"
              :type="getMessageType(msg.type)"
            >
              <div class="message-content">
                <div class="message-title">{{ msg.title }}</div>
                <div class="message-desc">{{ msg.content }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无待办消息" />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header-title">
          <el-icon><Calendar /></el-icon>
          <span>业务流程概览</span>
        </div>
      </template>
      
      <el-steps :active="0" align-center>
        <el-step title="询价订舱" description="货主发起订舱申请">
          <template #icon>
            <el-icon :size="24"><DocumentAdd /></el-icon>
          </template>
        </el-step>
        <el-step title="箱号分配" description="船公司分配集装箱">
          <template #icon>
            <el-icon :size="24"><Box /></el-icon>
          </template>
        </el-step>
        <el-step title="港口进场" description="集装箱进入港口">
          <template #icon>
            <el-icon :size="24"><Location /></el-icon>
          </template>
        </el-step>
        <el-step title="装船" description="货物装船">
          <template #icon>
            <el-icon :size="24"><Ship /></el-icon>
          </template>
        </el-step>
        <el-step title="提单放单" description="签发并发放提单">
          <template #icon>
            <el-icon :size="24"><Ticket /></el-icon>
          </template>
        </el-step>
      </el-steps>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { bookingsApi, messageApi } from '@/api'
import { STATUS_LABELS, STATUS_TYPES, BOOKING_STATUSES } from '@/utils/constants'

const router = useRouter()

const loading = ref(false)
const recentBookings = ref([])
const pendingMessages = ref([])

const stats = reactive({
  totalBookings: 0,
  pendingCount: 0,
  completedCount: 0,
  pendingMessages: 0,
})

const getStatusLabel = (status) => {
  if (!status) return '未知'
  const upperStatus = status.toUpperCase()
  return STATUS_LABELS[upperStatus] || status
}

const getStatusType = (status) => {
  if (!status) return 'info'
  const upperStatus = status.toUpperCase()
  return STATUS_TYPES[upperStatus] || 'info'
}

const getMessageType = (type) => {
  const types = {
    info: 'primary',
    warning: 'warning',
    error: 'danger',
    success: 'success',
  }
  return types[type] || 'primary'
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const goToDetail = (id) => {
  router.push(`/bookings/${id}`)
}

const fetchStats = async () => {
  try {
    const [bookingsResult, messagesResult] = await Promise.all([
      bookingsApi.getList({ pageSize: 100 }),
      messageApi.getPendingCount(),
    ])
    
    const bookings = bookingsResult.data?.list || []
    stats.totalBookings = bookingsResult.data?.total || 0
    
    const pendingStatuses = [
      BOOKING_STATUSES.PENDING_BOOKING,
      BOOKING_STATUSES.PENDING_CONTAINER,
      BOOKING_STATUSES.PENDING_PORT_ENTRY,
      BOOKING_STATUSES.PENDING_LOADING,
      BOOKING_STATUSES.PENDING_BILL_RELEASE,
    ]
    
    stats.pendingCount = bookings.filter(b => {
      const upperStatus = b.status?.toUpperCase()
      return pendingStatuses.includes(upperStatus)
    }).length
    
    stats.completedCount = bookings.filter(b => 
      b.status?.toUpperCase() === BOOKING_STATUSES.COMPLETED
    ).length
    
    stats.pendingMessages = messagesResult.data?.count || 0
  } catch (error) {
    console.error('Fetch stats error:', error)
  }
}

const fetchRecentBookings = async () => {
  loading.value = true
  try {
    const result = await bookingsApi.getList({ pageSize: 5 })
    recentBookings.value = result.data?.list || []
  } catch (error) {
    console.error('Fetch recent bookings error:', error)
  } finally {
    loading.value = false
  }
}

const fetchPendingMessages = async () => {
  try {
    const result = await messageApi.getList({ unread: true, pageSize: 5 })
    pendingMessages.value = result.data?.list || []
  } catch (error) {
    console.error('Fetch pending messages error:', error)
  }
}

onMounted(() => {
  fetchStats()
  fetchRecentBookings()
  fetchPendingMessages()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stats-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.message-content {
  padding-right: 20px;
}

.message-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.message-desc {
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}

:deep(.el-steps) {
  padding: 20px 0;
}
</style>
