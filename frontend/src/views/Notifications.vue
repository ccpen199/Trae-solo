<template>
  <div class="container" style="padding-bottom: 100px;">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <h2 style="color: white;">通知</h2>
      <div></div>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="notifications.length === 0" class="card" style="text-align: center;">
      <div style="font-size: 60px; margin-bottom: 16px;">🔔</div>
      <p style="color: #666;">暂无通知</p>
    </div>

    <div v-else>
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: 500; color: #333; margin-bottom: 4px;">
              {{ notification.title }}
            </div>
            <div style="font-size: 14px; color: #666;">
              {{ notification.content }}
            </div>
            <div v-if="notification.related_username" style="font-size: 12px; color: #667eea; margin-top: 4px;">
              来自: {{ notification.related_username }}
            </div>
          </div>
          <div style="font-size: 12px; color: #999;">
            {{ formatTime(notification.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const notifications = ref([])
const loading = ref(true)

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString()
}

const loadNotifications = async () => {
  try {
    const response = await api.get('/notifications')
    notifications.value = response.data
  } catch (error) {
    console.error('Failed to load notifications:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNotifications()
})
</script>
