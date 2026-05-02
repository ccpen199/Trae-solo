<template>
  <div class="notifications-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息通知</span>
          <div>
            <el-button type="primary" link size="small" @click="markAllRead" v-if="unreadCount > 0">
              全部已读
            </el-button>
          </div>
        </div>
      </template>

      <el-timeline>
        <el-timeline-item
          v-for="item in notifications"
          :key="item.id"
          :type="getItemType(item)"
          :timestamp="formatTime(item.created_at)"
          :hollow="item.is_read"
        >
          <el-card :class="{ 'unread-card': !item.is_read }" shadow="never" @click="handleClick(item)">
            <div class="notification-item">
              <div class="notification-header">
                <el-tag :type="getTagType(item.type)" size="small">{{ getTypeLabel(item.type) }}</el-tag>
                <el-tag v-if="!item.is_read" type="danger" size="small" effect="dark">未读</el-tag>
              </div>
              <div class="notification-title">{{ item.title }}</div>
              <div class="notification-content">{{ item.content }}</div>
              <div class="notification-footer">
                <span class="station-name" v-if="item.station_name">电站: {{ item.station_name }}</span>
                <span v-if="item.order_code">工单号: {{ item.order_code }}</span>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-if="notifications.length === 0" description="暂无消息通知" />
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: center"
        v-if="notifications.length > 0"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const notifications = ref([])
const unreadCount = ref(0)

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadNotifications = async () => {
  try {
    const result = await api.get('/notifications/list')
    const data = result.data || result
    notifications.value = data
    
    const countResult = await api.get('/notifications/count')
    unreadCount.value = countResult.unread_count || 0
    
    pagination.value.total = data.length
  } catch (error) {
    console.error('Load notifications error:', error)
  }
}

const markAllRead = async () => {
  try {
    await api.post('/notifications/mark-all-read')
    ElMessage.success('已全部标记为已读')
    notifications.value.forEach(n => n.is_read = true)
    unreadCount.value = 0
  } catch (error) {
    console.error('Mark all read error:', error)
  }
}

const handleClick = async (item) => {
  if (!item.is_read) {
    try {
      await api.post(`/notifications/${item.id}/mark-read`)
      item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error('Mark read error:', error)
    }
  }
}

const getItemType = (item) => {
  if (item.is_read) return 'info'
  const types = {
    fault_alert: 'danger',
    maintenance_order: 'warning',
    cleaning_order: 'primary',
    revenue_settlement: 'success',
    system_alert: 'info'
  }
  return types[item.type] || 'primary'
}

const getTagType = (type) => {
  const types = {
    fault_alert: 'danger',
    maintenance_order: 'warning',
    cleaning_order: 'primary',
    revenue_settlement: 'success',
    system_alert: 'info'
  }
  return types[type] || 'info'
}

const getTypeLabel = (type) => {
  const labels = {
    fault_alert: '故障告警',
    maintenance_order: '维修工单',
    cleaning_order: '清洗工单',
    revenue_settlement: '收益结算',
    system_alert: '系统通知'
  }
  return labels[type] || type
}

const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 19)
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.notification-item {
  cursor: pointer;
}

.unread-card {
  background-color: #f5f7fa;
  border-left: 3px solid #409eff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
  margin-bottom: 6px;
}

.notification-content {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.notification-footer {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}
</style>
