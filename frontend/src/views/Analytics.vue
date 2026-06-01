<template>
  <div class="analytics">
    <div class="container">
      <div class="page-header">
        <h2>数据统计</h2>
        <button class="btn btn-secondary" @click="fetchAnalytics">🔄 刷新</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon">📱</div>
          <div class="stat-value">{{ summary.virtualDevicesAdded }}</div>
          <div class="stat-label">虚拟设备添加</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">▶️</div>
          <div class="stat-value">{{ summary.deviceRuns }}</div>
          <div class="stat-label">设备模拟运行</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">🎬</div>
          <div class="stat-value">{{ summary.sceneRuns }}</div>
          <div class="stat-label">智能场景运行</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">🗑️</div>
          <div class="stat-value">{{ summary.devicesDeleted }}</div>
          <div class="stat-label">设备删除</div>
        </div>
        <div class="stat-card card highlight">
          <div class="stat-icon">🛒</div>
          <div class="stat-value">{{ summary.purchaseClicks }}</div>
          <div class="stat-label">购买转化点击</div>
        </div>
      </div>

      <div class="card events-section">
        <h3>最近事件</h3>
        <div class="events-list">
          <div v-if="recentEvents.length === 0" class="empty-events">
            暂无事件记录
          </div>
          <div v-for="event in recentEvents" :key="event.id" class="event-item">
            <div class="event-icon">{{ getEventIcon(event.event_type) }}</div>
            <div class="event-content">
              <div class="event-type">{{ getEventLabel(event.event_type) }}</div>
              <div class="event-time">{{ formatTime(event.created_at) }}</div>
            </div>
            <div class="event-data" v-if="event.data">
              {{ formatEventData(event.data) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const summary = ref({
  virtualDevicesAdded: 0,
  deviceRuns: 0,
  sceneRuns: 0,
  devicesDeleted: 0,
  purchaseClicks: 0
})
const recentEvents = ref([])

const fetchAnalytics = async () => {
  try {
    const res = await fetch('/api/analytics')
    const data = await res.json()
    if (data.success) {
      summary.value = data.data.summary
      recentEvents.value = data.data.recentEvents
    }
  } catch (e) {
    console.error(e)
  }
}

const getEventIcon = (type) => {
  const icons = {
    'guide_complete': '👋',
    'device_added': '➕',
    'device_deleted': '➖',
    'device_run_start': '▶️',
    'device_run_complete': '✅',
    'device_added_to_scene': '🔗',
    'scene_run': '🎬',
    'purchase_click': '🛒'
  }
  return icons[type] || '📌'
}

const getEventLabel = (type) => {
  const labels = {
    'guide_complete': '引导完成',
    'device_added': '添加设备',
    'device_deleted': '删除设备',
    'device_run_start': '开始运行',
    'device_run_complete': '运行完成',
    'device_added_to_scene': '添加到场景',
    'scene_run': '执行场景',
    'purchase_click': '点击购买'
  }
  return labels[type] || type
}

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatEventData = (data) => {
  if (typeof data === 'object' && data.name) {
    return data.name
  }
  return ''
}

onMounted(() => {
  fetchAnalytics()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
  padding: 24px 16px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 2px solid #ff9800;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #ff6700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.events-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

.events-list {
  display: grid;
  gap: 12px;
}

.empty-events {
  text-align: center;
  padding: 40px;
  color: #999;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.event-icon {
  font-size: 24px;
}

.event-content {
  flex: 1;
}

.event-type {
  font-weight: 500;
  margin-bottom: 4px;
}

.event-time {
  font-size: 12px;
  color: #999;
}

.event-data {
  color: #ff6700;
  font-size: 14px;
}
</style>
