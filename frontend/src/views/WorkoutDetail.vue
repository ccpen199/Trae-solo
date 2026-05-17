<template>
  <div class="workout-detail-page">
    <van-nav-bar title="运动详情" left-arrow @click-left="router.back()" />
    
    <div class="content" v-if="workout">
      <div class="summary-card">
        <div class="summary-icon">
          {{ workoutTypeIcon }}
        </div>
        <div class="summary-info">
          <h2>{{ workoutTypeName }}</h2>
          <p class="summary-date">{{ formatDate(workout.start_time) }}</p>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ (workout.distance || 0).toFixed(2) }}</div>
          <div class="stat-label">公里</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatDuration(workout.duration || 0) }}</div>
          <div class="stat-label">用时</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ workout.calories || 0 }}</div>
          <div class="stat-label">千卡</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ workout.pace || '--' }}</div>
          <div class="stat-label">平均配速</div>
        </div>
      </div>
      
      <div class="map-card">
        <h3>运动轨迹</h3>
        <div class="map-placeholder">
          <div class="map-icon">{{ workoutTypeIcon }}</div>
          <p>暂无轨迹数据</p>
        </div>
      </div>
      
      <div class="actions">
        <van-button type="primary" block round @click="shareWorkout">
          分享
        </van-button>
        <van-button type="default" block round @click="goToRunning">
          再练一次
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()

const workout = ref({
  type: 'running',
  distance: 5.2,
  duration: 1800,
  calories: 320,
  pace: '5\'45"',
  start_time: new Date().toISOString()
})

const workoutTypes = {
  running: { name: '跑步', icon: '🏃' },
  walking: { name: '行走', icon: '🚶' },
  cycling: { name: '骑行', icon: '🚴' }
}

const workoutTypeName = computed(() => {
  return workoutTypes[workout.value.type]?.name || '运动'
})

const workoutTypeIcon = computed(() => {
  return workoutTypes[workout.value.type]?.icon || '🏃'
})

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function shareWorkout() {
  showToast('分享功能开发中')
}

function goToRunning() {
  router.push('/running')
}
</script>

<style lang="less" scoped>
.workout-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.content {
  padding: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  margin-bottom: 16px;
}

.summary-icon {
  font-size: 48px;
}

.summary-info h2 {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.summary-date {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.map-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.map-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.map-placeholder {
  height: 200px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.map-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
