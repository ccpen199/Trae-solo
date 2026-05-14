<template>
  <div class="activities-page page-container">
    <div class="header">
      <h1>活动中心</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else-if="activities.length === 0" class="empty">
      <Calendar class="empty-icon" />
      <p>暂无活动</p>
    </div>

    <div v-else class="content">
      <div class="activity-list">
        <div 
          v-for="activity in activities" 
          :key="activity.id" 
          class="activity-card"
        >
          <div class="activity-image">
            <img :src="activity.image" :alt="activity.title" />
          </div>
          <div class="activity-info">
            <h3>{{ activity.title }}</h3>
            <p class="activity-desc">{{ activity.description }}</p>
            <div class="activity-time">
              <Clock class="time-icon" />
              <span>{{ formatDate(activity.start_time) }} - {{ formatDate(activity.end_time) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Calendar, Clock } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { homeAPI } from '@/api'

const loading = ref(true)
const activities = ref([])

onMounted(() => {
  loadActivities()
})

async function loadActivities() {
  loading.value = true
  try {
    activities.value = await homeAPI.activities()
  } catch {
    activities.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.header {
  background: white;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content {
  padding: 12px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.activity-image {
  height: 200px;
}

.activity-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-info {
  padding: 16px;
}

.activity-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.activity-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
}

.activity-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #999;
}

.time-icon {
  width: 16px;
  height: 16px;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #ddd;
  margin-bottom: 16px;
}

.empty p {
  color: #999;
}
</style>