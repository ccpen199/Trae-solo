<template>
  <div class="notifications">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知中心</span>
          <el-button type="primary" size="small" @click="markAllRead" v-if="unreadCount > 0">
            全部已读
          </el-button>
        </div>
      </template>

      <el-empty v-if="notifications.length === 0" description="暂无通知" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="item in notifications"
          :key="item.id"
          :timestamp="formatDateTime(item.created_at)"
          placement="top"
          :type="item.is_read ? 'info' : 'primary'"
        >
          <el-card :class="{ 'unread-card': !item.is_read }">
            <div class="notification-header">
              <span class="notification-title" :class="{ 'unread-title': !item.is_read }">
                {{ item.title }}
              </span>
              <el-tag v-if="!item.is_read" type="danger" size="small">新</el-tag>
            </div>
            <div class="notification-message">
              {{ item.message }}
            </div>
            <div class="notification-actions">
              <el-button type="text" size="small" @click="markAsRead(item)" v-if="!item.is_read">
                标记已读
              </el-button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/api'
import type { NotificationResponse } from '@/types'
import dayjs from 'dayjs'

const notifications = ref<NotificationResponse[]>([])

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.is_read).length
})

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const fetchNotifications = async () => {
  try {
    const response = await apiClient.get<NotificationResponse[]>('/users/me/notifications')
    notifications.value = response.data
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  }
}

const markAsRead = async (item: NotificationResponse) => {
  try {
    await apiClient.post(`/notifications/${item.id}/read`)
    item.is_read = true
    ElMessage.success('已标记为已读')
  } catch (error) {
    console.error('Failed to mark as read:', error)
  }
}

const markAllRead = async () => {
  try {
    const unreadItems = notifications.value.filter((n) => !n.is_read)
    for (const item of unreadItems) {
      await apiClient.post(`/notifications/${item.id}/read`)
      item.is_read = true
    }
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notifications {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unread-card {
  border-left: 4px solid #409EFF;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}

.unread-title {
  color: #409EFF;
}

.notification-message {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.notification-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
