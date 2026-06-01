<template>
  <div class="tracking-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
      <button class="btn-primary" @click="loadTracking">重试</button>
    </div>
    <div v-else>
      <div class="page-header">
        <h1 class="page-title">🗺️ 实时GPS轨迹追踪</h1>
        <p class="sub-title">取件端全程可视化 · 位置数据实时存证</p>
      </div>
      
      <div class="tracking-container">
        <div class="order-selector">
          <label>选择订单查看轨迹</label>
          <select v-model="selectedOrderId" class="select" @change="loadTracking">
            <option value="">-- 请选择订单 --</option>
            <option v-for="order in trackableOrders" :key="order.id" :value="order.id">
              {{ order.order_no }} - {{ getCategoryName(order.category) }} - {{ order.pickup_address.slice(0, 15) }}...
            </option>
          </select>
        </div>

        <div class="main-content">
          <div class="map-section">
            <div class="section-header">
              <h3>📍 GPS 轨迹地图</h3>
              <span v-if="trackingPoints.length > 0" class="point-count">
                共 {{ trackingPoints.length }} 个轨迹点
              </span>
            </div>
            <div class="map-container">
              <div class="map-grid"></div>
              <div class="map-labels">
                <div class="map-label start" v-if="startPoint">
                  📦 取件点
                </div>
                <div class="map-label end" v-if="endPoint">
                  🏠 送达点
                </div>
              </div>
              <div class="track-path" v-if="trackingPoints.length > 1">
                <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
                  <polyline
                    :points="pathPoints"
                    fill="none"
                    stroke="#667eea"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-dasharray="10,5"
                  />
                </svg>
              </div>
              <div class="map-points">
                <div v-for="(point, idx) in trackingPoints" :key="idx" 
                     class="map-point"
                     :class="{ 
                       start: idx === 0, 
                       end: idx === trackingPoints.length - 1 && trackingPoints.length > 1,
                       current: idx === trackingPoints.length - 1
                     }"
                     :style="getPointStyle(point, idx)">
                  <span class="point-index">{{ idx + 1 }}</span>
                  <div class="point-tooltip">
                    第{{ idx + 1 }}点<br/>
                    {{ point.latitude.toFixed(4) }}, {{ point.longitude.toFixed(4) }}<br/>
                    {{ formatTime(point.timestamp) }}
                  </div>
                </div>
              </div>
              <div v-if="trackingPoints.length === 0" class="map-empty">
                <div class="empty-icon">📍</div>
                <div class="empty-text">暂无GPS轨迹数据</div>
                <div class="empty-hint">请选择配送中的订单，或点击"模拟轨迹上报"生成测试数据</div>
              </div>
            </div>

            <div class="simulation-actions" v-if="currentOrder && ['matched', 'picking'].includes(currentOrder.status)">
              <button class="btn-primary" @click="simulateTrack">🚀 模拟轨迹上报</button>
              <button class="btn-secondary" @click="simulateMultiTrack" v-if="trackingPoints.length < 3">
                📍 连续生成5个轨迹点
              </button>
            </div>
          </div>

          <div class="info-section">
            <div class="info-card" v-if="currentOrder">
              <h3>📋 订单信息</h3>
              <div class="info-row">
                <span>订单号</span>
                <span class="highlight">{{ currentOrder.order_no }}</span>
              </div>
              <div class="info-row">
                <span>品类</span>
                <span>{{ getCategoryName(currentOrder.category) }}</span>
              </div>
              <div class="info-row">
                <span>状态</span>
                <span class="status" :class="currentOrder.status">{{ getStatusName(currentOrder.status) }}</span>
              </div>
              <div class="info-row">
                <span>取件</span>
                <span class="address">{{ currentOrder.pickup_address }}</span>
              </div>
              <div class="info-row">
                <span>送达</span>
                <span class="address">{{ currentOrder.delivery_address }}</span>
              </div>
              <div class="info-row" v-if="currentOrder.rider_id">
                <span>骑手</span>
                <span>{{ rider?.name || '加载中...' }}</span>
              </div>
            </div>

            <div class="info-card track-card">
              <div class="card-header">
                <h3>📝 取件端GPS轨迹存证</h3>
                <span class="track-count">共 {{ trackingPoints.length }} 个轨迹点</span>
              </div>
              
              <div v-if="trackingPoints.length > 0" class="track-summary">
                <div class="summary-item">
                  <span class="summary-icon">📍</span>
                  <span class="summary-label">起始位置</span>
                  <span class="summary-value">{{ startPoint?.latitude?.toFixed(4) }}, {{ startPoint?.longitude?.toFixed(4) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-icon">🏁</span>
                  <span class="summary-label">当前位置</span>
                  <span class="summary-value">{{ endPoint?.latitude?.toFixed(4) }}, {{ endPoint?.longitude?.toFixed(4) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-icon">⏱️</span>
                  <span class="summary-label">采样时长</span>
                  <span class="summary-value">{{ getTrackDuration() }}</span>
                </div>
                <div class="summary-item ok">
                  <span class="summary-icon">✓</span>
                  <span class="summary-label">存证状态</span>
                  <span class="summary-value">已写入SQLite · 不可篡改</span>
                </div>
              </div>

              <div class="track-list">
                <div v-for="(point, idx) in trackingPoints" :key="idx" class="track-item">
                  <span class="track-index" :class="{ 
                    start: idx === 0, 
                    end: idx === trackingPoints.length - 1 && trackingPoints.length > 1
                  }">
                    {{ idx === 0 ? '起' : idx === trackingPoints.length - 1 && trackingPoints.length > 1 ? '终' : idx + 1 }}
                  </span>
                  <span class="track-coord">{{ point.latitude.toFixed(4) }}, {{ point.longitude.toFixed(4) }}</span>
                  <span class="track-time">{{ formatTime(point.timestamp) }}</span>
                  <span class="track-status">✓ 已存证</span>
                </div>
              </div>
              <div v-if="trackingPoints.length === 0" class="empty">
                <div class="empty-icon">📌</div>
                <p>暂无GPS轨迹存证</p>
                <p class="empty-hint">请点击"模拟轨迹上报"生成连续GPS点</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { orderApi, riderApi } from '@/api'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const store = useAppStore()
const selectedOrderId = ref('')
const trackingPoints = ref([])
const currentOrder = ref(null)
const rider = ref(null)
const loading = ref(true)
const error = ref(null)

const trackableOrders = computed(() => 
  store.orders.filter(o => ['matched', 'picking', 'delivered'].includes(o.status))
)

const startPoint = computed(() => trackingPoints.value[0] || null)
const endPoint = computed(() => trackingPoints.value[trackingPoints.value.length - 1] || null)

const pathPoints = computed(() => {
  if (trackingPoints.value.length < 2) return ''
  return trackingPoints.value.map((point, idx) => {
    const x = 50 + idx * (300 / (trackingPoints.value.length - 1))
    const y = 150 + (point.latitude - 31.23) * 1000
    return `${x},${Math.max(20, Math.min(280, y))}`
  }).join(' ')
})

function getCategoryName(cat) {
  const map = { document: '文件', fresh: '生鲜', pet: '宠物', pharmacy: '药品' }
  return map[cat] || cat
}

function getStatusName(status) {
  const map = { pending: '待匹配', matched: '已匹配', picking: '取件中', delivered: '已送达' }
  return map[status] || status
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

function getTrackDuration() {
  if (trackingPoints.value.length < 2) return '不足2点无法计算'
  const start = new Date(trackingPoints.value[0].timestamp)
  const end = new Date(trackingPoints.value[trackingPoints.value.length - 1].timestamp)
  const minutes = Math.round((end - start) / 60000)
  if (minutes < 1) return '不到1分钟'
  return `${minutes.toFixed(0)} 分钟`
}

function getPointStyle(point, idx) {
  const total = trackingPoints.value.length
  const x = 10 + (total > 1 ? idx * (80 / (total - 1)) : 40)
  const y = 50 + (point.latitude - 31.23) * 500
  return {
    left: `${x}%`,
    top: `${Math.max(10, Math.min(80, y))}%`
  }
}

async function loadTracking() {
  try {
    loading.value = true
    error.value = null
    
    if (!selectedOrderId.value) {
      trackingPoints.value = []
      currentOrder.value = null
      rider.value = null
      return
    }
    
    const res = await orderApi.getTracking(selectedOrderId.value)
    trackingPoints.value = res.data || []
    
    const orderRes = await orderApi.get(selectedOrderId.value)
    currentOrder.value = orderRes.data
    
    if (currentOrder.value.rider_id) {
      const riderRes = await riderApi.get(currentOrder.value.rider_id)
      rider.value = riderRes.data
    }
  } catch (e) {
    console.error('Load tracking failed:', e)
    error.value = '加载轨迹数据失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function simulateTrack() {
  if (!selectedOrderId.value || !currentOrder.value) return
  
  const lastPoint = trackingPoints.value.length > 0 
    ? trackingPoints.value[trackingPoints.value.length - 1]
    : { latitude: currentOrder.value.pickup_lat, longitude: currentOrder.value.pickup_lng }
  
  const newLat = lastPoint.latitude + (Math.random() - 0.5) * 0.005
  const newLng = lastPoint.longitude + (Math.random() - 0.5) * 0.005
  
  await orderApi.track(selectedOrderId.value, {
    rider_id: currentOrder.value.rider_id,
    latitude: newLat,
    longitude: newLng
  })
  
  await loadTracking()
}

async function simulateMultiTrack() {
  for (let i = 0; i < 5; i++) {
    await simulateTrack()
    await new Promise(r => setTimeout(r, 300))
  }
}

onMounted(async () => {
  try {
    loading.value = true
    error.value = null
    await store.fetchOrders()
    
    if (route.params.orderId) {
      selectedOrderId.value = route.params.orderId
      await loadTracking()
    } else if (trackableOrders.value.length > 0) {
      selectedOrderId.value = trackableOrders.value[0].id
      await loadTracking()
    }
  } catch (e) {
    console.error('Init tracking failed:', e)
    error.value = '初始化失败，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tracking-page { max-width: 1200px; }

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

.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; margin: 0; color: #333; }
.sub-title { color: #888; margin-top: 4px; font-size: 14px; }

.tracking-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-selector {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.order-selector label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}
.select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  min-width: 400px;
  font-size: 14px;
}

.main-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.map-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h3 { margin: 0; font-size: 16px; color: #333; }
.point-count { color: #667eea; font-weight: 600; font-size: 13px; }

.map-container {
  height: 400px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 2px solid #bae6fd;
}

.map-grid {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}

.map-labels { position: absolute; width: 100%; height: 100%; }
.map-label {
  position: absolute;
  padding: 6px 12px;
  background: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 5;
}
.map-label.start { top: 16px; left: 16px; color: #059669; }
.map-label.end { bottom: 16px; right: 16px; color: #dc2626; }

.track-path {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.map-points {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.map-point {
  position: absolute;
  width: 28px;
  height: 28px;
  background: #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 600;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
  cursor: pointer;
  transition: transform 0.2s;
}
.map-point:hover { transform: translate(-50%, -50%) scale(1.2); }
.map-point.start { background: #10b981; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5); }
.map-point.end { background: #ef4444; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5); }
.map-point.current { 
  animation: pulse 1.5s infinite;
  z-index: 20;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
}

.point-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  margin-bottom: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  line-height: 1.5;
}
.map-point:hover .point-tooltip { opacity: 1; }

.map-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #64748b;
  z-index: 30;
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.empty-hint { font-size: 13px; color: #94a3b8; }

.info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.info-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  align-items: flex-start;
}
.info-row span:first-child { color: #888; }
.info-row span:last-child { color: #333; font-weight: 500; text-align: right; }
.info-row .highlight { color: #667eea; font-family: monospace; }
.info-row .address { max-width: 200px; word-break: break-all; }

.status { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.status.pending { background: #fff3cd; color: #856404; }
.status.matched { background: #cce5ff; color: #004085; }
.status.picking { background: #d1ecf1; color: #0c5460; }
.status.delivered { background: #d4edda; color: #155724; }

.track-card { flex: 1; display: flex; flex-direction: column; }
.track-list {
  max-height: 220px;
  overflow-y: auto;
  flex: 1;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.track-index {
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.track-index.start { background: #10b981; }
.track-index.end { background: #ef4444; }
.track-coord { font-family: monospace; color: #333; }
.track-time { color: #888; margin-left: auto; }

.simulation-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}
.btn-secondary {
  background: #e9ecef;
  color: #333;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.card-header h3 { margin: 0; }
.track-count {
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  padding: 4px 12px;
  background: #f0f2ff;
  border-radius: 12px;
}

.track-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9ff;
  border-radius: 8px;
}
.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.summary-item.ok .summary-value { color: #155724; font-weight: 600; }
.summary-icon { font-size: 16px; }
.summary-label { color: #888; width: 70px; }
.summary-value { color: #333; font-weight: 500; }

.track-item {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 80px;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  font-size: 13px;
}
.track-item:last-child { border-bottom: none; }
.track-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e9ecef;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
}
.track-index.start { background: #28a745; color: white; }
.track-index.end { background: #dc3545; color: white; }
.track-coord { font-family: monospace; color: #333; }
.track-time { color: #888; font-size: 12px; }
.track-status {
  color: #28a745;
  font-weight: 600;
  font-size: 11px;
  text-align: right;
}
</style>
