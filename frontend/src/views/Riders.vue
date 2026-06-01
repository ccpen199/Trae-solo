<template>
  <div class="riders-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
      <button class="btn-primary" @click="loadRiders">重试</button>
    </div>
    <div v-else-if="riders">
      <h1 class="page-title">骑手管理</h1>
      
      <div class="riders-grid">
        <div v-for="rider in riders" :key="rider.id" class="rider-card">
          <div class="rider-header">
            <div class="rider-avatar">{{ rider.name.charAt(0) }}</div>
            <div class="rider-status" :class="rider.status">
              {{ rider.status === 'online' ? '在线' : '离线' }}
            </div>
          </div>
          <div class="rider-name">{{ rider.name }}</div>
          <div class="rider-phone">{{ rider.phone }}</div>
          
          <div class="rider-stats">
            <div class="stat">
              <span class="stat-value">{{ rider.on_time_rate }}%</span>
              <span class="stat-label">准时率</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ rider.load_capacity }}kg</span>
              <span class="stat-label">负重能力</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ rider.total_orders }}</span>
              <span class="stat-label">完成订单</span>
            </div>
          </div>

          <div class="rider-location">
            <span>📍</span>
            <span>{{ rider.latitude?.toFixed(4) }}, {{ rider.longitude?.toFixed(4) }}</span>
          </div>

          <div class="rider-actions">
            <button class="btn-secondary" @click="updateLocation(rider)">更新位置</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { riderApi } from '@/api'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const riders = ref(null)
const loading = ref(true)
const error = ref(null)

async function loadRiders() {
  try {
    loading.value = true
    error.value = null
    await store.fetchRiders()
    riders.value = store.riders
  } catch (e) {
    console.error('加载骑手列表失败:', e)
    error.value = '加载骑手列表失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function updateLocation(rider) {
  const newLat = rider.latitude + (Math.random() - 0.5) * 0.01
  const newLng = rider.longitude + (Math.random() - 0.5) * 0.01
  await riderApi.updateLocation(rider.id, { latitude: newLat, longitude: newLng })
  await store.fetchRiders()
  riders.value = store.riders
}

onMounted(async () => {
  await loadRiders()
})
</script>

<style scoped>
.riders-page { max-width: 1200px; }

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-state p {
  color: #888;
  font-size: 16px;
  margin: 0;
}
.error-state .error-text {
  color: #dc3545;
  font-size: 16px;
  margin-bottom: 16px;
}

.page-title { font-size: 28px; margin-bottom: 24px; color: #333; }

.riders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.rider-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.rider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rider-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.rider-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.rider-status.online {
  background: #d4edda;
  color: #155724;
}
.rider-status.offline {
  background: #f8d7da;
  color: #721c24;
}

.rider-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.rider-phone {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.rider-stats {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin-bottom: 12px;
}

.stat { text-align: center; }
.stat-value { display: block; font-size: 18px; font-weight: 700; color: #667eea; }
.stat-label { display: block; font-size: 12px; color: #888; }

.rider-location {
  color: #666;
  font-size: 13px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rider-actions {
  display: flex;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary {
  flex: 1;
  background: #e9ecef;
  color: #333;
  border: none;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
</style>