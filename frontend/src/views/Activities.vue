<template>
  <div class="container" style="padding-bottom: 100px;">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <h2 style="color: white;">动态</h2>
      <div></div>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="activities.length === 0" class="card" style="text-align: center;">
      <div style="font-size: 60px; margin-bottom: 16px;">📝</div>
      <p style="color: #666;">暂无动态记录</p>
    </div>

    <div v-else>
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="activity-item"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 14px; color: #333;">
              {{ activity.content }}
            </div>
            <div v-if="activity.related_username" style="font-size: 12px; color: #667eea; margin-top: 4px;">
              相关: {{ activity.related_username }}
            </div>
          </div>
          <div style="font-size: 12px; color: #999;">
            {{ formatTime(activity.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const activities = ref([])
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

const loadActivities = async () => {
  try {
    const response = await api.get('/activities')
    activities.value = response.data
  } catch (error) {
    console.error('Failed to load activities:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadActivities()
})
</script>
