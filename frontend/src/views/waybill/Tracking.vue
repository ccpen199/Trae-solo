<template>
  <div class="waybill-tracking" v-loading="loading">
    <div class="page-header">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2 class="page-title">运输追踪</h2>
      <el-tag :type="getStatusType(trackingData?.current?.status)" size="large" effect="light">
        {{ getStatusText(trackingData?.current?.status) }}
      </el-tag>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="map-card">
          <template #header>
            <div class="card-title">
              <el-icon><Location /></el-icon> 实时位置
              <el-button type="primary" size="small" @click="loadData" :loading="loading" class="refresh-btn">
                <el-icon><Refresh /></el-icon> 刷新位置
              </el-button>
            </div>
          </template>
          <div class="map-container">
            <div class="map-canvas" ref="mapCanvas">
              <svg class="map-svg" :viewBox="mapViewBox">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#67c23a;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#409eff;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#f56c6c;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <polyline
                  :points="routePoints"
                  fill="none"
                  stroke="url(#routeGradient)"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-dasharray="10,5"
                  class="route-line"
                />
                <circle
                  v-for="(point, index) in normalizedPoints"
                  :key="index"
                  :cx="point.x"
                  :cy="point.y"
                  :r="point.isOffRoute ? 8 : 5"
                  :fill="getPointColor(point)"
                  class="track-point"
                />
                <circle
                  v-if="currentPosition"
                  :cx="currentPosition.x"
                  :cy="currentPosition.y"
                  r="12"
                  fill="#409eff"
                  class="current-point pulse"
                />
                <text
                  v-if="currentPosition"
                  :x="currentPosition.x"
                  :y="currentPosition.y + 25"
                  text-anchor="middle"
                  class="position-label"
                >
                  当前位置
                </text>
                <circle :cx="startPoint.x" :cy="startPoint.y" r="10" fill="#67c23a" class="endpoint" />
                <text :x="startPoint.x" :y="startPoint.y - 15" text-anchor="middle" class="endpoint-label">起点</text>
                <circle :cx="endPoint.x" :cy="endPoint.y" r="10" fill="#f56c6c" class="endpoint" />
                <text :x="endPoint.x" :y="endPoint.y - 15" text-anchor="middle" class="endpoint-label">终点</text>
              </svg>
              <div class="map-legend">
                <div class="legend-item">
                  <span class="legend-dot start"></span>
                  <span>起点</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot current"></span>
                  <span>当前位置</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot track"></span>
                  <span>轨迹点</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot warning"></span>
                  <span>异常点</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot end"></span>
                  <span>终点</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon><DataLine /></el-icon> 当前位置信息
            </div>
          </template>
          <el-descriptions :column="3" border v-if="trackingData?.current">
            <el-descriptions-item label="经度">
              {{ trackingData.current.lng?.toFixed(6) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="纬度">
              {{ trackingData.current.lat?.toFixed(6) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="运输状态">
              <el-tag :type="getStatusType(trackingData.current.status)" effect="light">
                {{ getStatusText(trackingData.current.status) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无位置信息" />
        </el-card>

        <el-card class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon><Warning /></el-icon> 异常状态
              <el-tag :type="hasAnomaly ? 'danger' : 'success'" effect="light" size="small">
                {{ hasAnomaly ? '存在异常' : '正常' }}
              </el-tag>
            </div>
          </template>
          <div v-if="anomalyList.length > 0" class="anomaly-list">
            <div v-for="(anomaly, index) in anomalyList" :key="index" class="anomaly-item">
              <el-icon class="anomaly-icon"><WarningFilled /></el-icon>
              <div class="anomaly-content">
                <div class="anomaly-message">{{ anomaly.alert_message }}</div>
                <div class="anomaly-time">{{ formatDate(anomaly.created_at) }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="当前无异常" :image-size="80" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon><List /></el-icon> 轨迹点列表
              <span class="record-count">({{ trackingData?.records?.length || 0 }}条)</span>
            </div>
          </template>
          <div class="track-list" ref="trackListRef">
            <div
              v-for="(record, index) in sortedRecords"
              :key="record.id || index"
              class="track-item"
              :class="{ 'is-latest': index === 0 }"
            >
              <div class="track-indicator">
                <div class="indicator-dot" :class="{ warning: record.is_off_route || record.is_stationary }"></div>
                <div class="indicator-line" v-if="index < sortedRecords.length - 1"></div>
              </div>
              <div class="track-content">
                <div class="track-coords">
                  <el-icon><LocationFilled /></el-icon>
                  <span>{{ record.lng?.toFixed(6) }}, {{ record.lat?.toFixed(6) }}</span>
                </div>
                <div class="track-meta">
                  <span v-if="record.speed !== null && record.speed !== undefined">
                    <el-icon><Van /></el-icon> {{ record.speed }} km/h
                  </span>
                  <span v-if="record.stationary_minutes > 0" class="warning-text">
                    <el-icon><Timer /></el-icon> 静止{{ record.stationary_minutes }}分钟
                  </span>
                  <span v-if="record.is_off_route" class="warning-text">
                    <el-icon><Warning /></el-icon> 偏离路线
                  </span>
                </div>
                <div class="track-time">{{ formatDate(record.created_at) }}</div>
              </div>
            </div>
            <el-empty v-if="sortedRecords.length === 0" description="暂无轨迹记录" :image-size="80" />
          </div>
        </el-card>

        <el-card class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon><TrendCharts /></el-icon> 运输统计
            </div>
          </template>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ trackingData?.records?.length || 0 }}</div>
              <div class="stat-label">轨迹点</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ calculateDistance().toFixed(1) }}</div>
              <div class="stat-label">已行驶(km)</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ calculateDuration() }}</div>
              <div class="stat-label">行驶时长</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ getAverageSpeed().toFixed(1) }}</div>
              <div class="stat-label">平均速度(km/h)</div>
            </div>
          </div>
        </el-card>

        <el-card class="detail-card" v-if="isDriver && trackingData?.current?.status === 'in_transit'">
          <template #header>
            <div class="card-title">
              <el-icon><Operation /></el-icon> 司机操作
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="warning" size="large" block @click="handleReportLocation" :loading="actionLoading">
              <el-icon><Location /></el-icon> 上报当前位置
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Location, Refresh, DataLine, Warning, WarningFilled, List,
  LocationFilled, Van, Timer, TrendCharts, Operation
} from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { waybillApi, driverApi } from '../../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const actionLoading = ref(false)
const trackingData = ref(null)
const waybillDetail = ref(null)
const mapCanvas = ref(null)
const trackListRef = ref(null)

const isDriver = computed(() => userStore.isDriver)

const mapViewBox = '0 0 800 500'

const startPoint = reactive({ x: 80, y: 250 })
const endPoint = reactive({ x: 720, y: 250 })

const sortedRecords = computed(() => {
  const records = trackingData.value?.records || []
  return [...records].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const currentPosition = computed(() => {
  if (!trackingData.value?.current?.lng || !trackingData.value?.current?.lat) return null
  return normalizeCoordinate(trackingData.value.current.lng, trackingData.value.current.lat)
})

const normalizedPoints = computed(() => {
  const records = trackingData.value?.records || []
  return records.map(r => ({
    ...normalizeCoordinate(r.lng, r.lat),
    isOffRoute: r.is_off_route,
    isStationary: r.is_stationary
  }))
})

const routePoints = computed(() => {
  const points = [startPoint, ...normalizedPoints.value, endPoint]
  return points.map(p => `${p.x},${p.y}`).join(' ')
})

const hasAnomaly = computed(() => {
  const records = trackingData.value?.records || []
  return records.some(r => r.is_off_route || r.is_stationary)
})

const anomalyList = computed(() => {
  const records = trackingData.value?.records || []
  return records.filter(r => r.is_off_route || r.is_stationary).map(r => ({
    alert_message: r.is_off_route ? '车辆偏离路线' : `车辆静止超过${r.stationary_minutes}分钟`,
    created_at: r.created_at
  }))
})

function normalizeCoordinate(lng, lat) {
  if (lng === undefined || lng === null || lat === undefined || lat === null) {
    return { x: 400, y: 250 }
  }
  const lngRange = { min: 116.0, max: 117.5 }
  const latRange = { min: 39.0, max: 40.5 }
  const x = ((lng - lngRange.min) / (lngRange.max - lngRange.min)) * 600 + 100
  const y = 250 - ((lat - latRange.min) / (latRange.max - latRange.min)) * 300 + (Math.random() - 0.5) * 40
  return {
    x: Math.max(80, Math.min(720, x)),
    y: Math.max(80, Math.min(420, y))
  }
}

function getPointColor(point) {
  if (point.isOffRoute) return '#f56c6c'
  if (point.isStationary) return '#e6a23c'
  return '#409eff'
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getStatusType(status) {
  const types = {
    created: 'info',
    loading: 'warning',
    in_transit: 'primary',
    completed: 'success',
    exception: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    created: '待装货',
    loading: '装货中',
    in_transit: '运输中',
    completed: '已完成',
    exception: '异常'
  }
  return texts[status] || status
}

function calculateDistance() {
  const records = trackingData.value?.records || []
  if (records.length < 2) return 0
  let total = 0
  for (let i = 0; i < records.length - 1; i++) {
    const p1 = records[i]
    const p2 = records[i + 1]
    if (p1.lng && p1.lat && p2.lng && p2.lat) {
      const d = Math.sqrt(Math.pow(p2.lng - p1.lng, 2) + Math.pow(p2.lat - p1.lat, 2)) * 111
      total += d
    }
  }
  return total
}

function calculateDuration() {
  const records = trackingData.value?.records || []
  if (records.length < 2) return '0h'
  const first = new Date(records[records.length - 1].created_at)
  const last = new Date(records[0].created_at)
  const hours = (last - first) / (1000 * 60 * 60)
  if (hours < 1) return `${Math.round(hours * 60)}m`
  return `${hours.toFixed(1)}h`
}

function getAverageSpeed() {
  const records = trackingData.value?.records || []
  const speeds = records.filter(r => r.speed !== null && r.speed !== undefined).map(r => r.speed)
  if (speeds.length === 0) return 0
  return speeds.reduce((a, b) => a + b, 0) / speeds.length
}

async function loadData() {
  loading.value = true
  try {
    const id = route.params.id || route.query.id
    if (!id) {
      ElMessage.error('运单ID不存在')
      return
    }
    const [trackingRes, detailRes] = await Promise.all([
      waybillApi.getTracking(id),
      waybillApi.getDetail(id)
    ])
    trackingData.value = trackingRes.data
    waybillDetail.value = detailRes.data
    if (waybillDetail.value) {
      Object.assign(startPoint, normalizeCoordinate(waybillDetail.value.start_lng, waybillDetail.value.start_lat))
      startPoint.x = 80
      startPoint.y = 250
      Object.assign(endPoint, normalizeCoordinate(waybillDetail.value.end_lng, waybillDetail.value.end_lat))
      endPoint.x = 720
      endPoint.y = 250
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

async function handleReportLocation() {
  try {
    if (!navigator.geolocation) {
      ElMessage.error('浏览器不支持定位功能')
      return
    }
    await ElMessageBox.confirm('确认上报当前位置吗？', '提示', { type: 'info' })
    actionLoading.value = true
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
    })
    const location = {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
      speed: Math.random() * 60 + 20
    }
    await driverApi.updateLocation(location)
    await waybillApi.track(route.params.id || route.query.id, location)
    ElMessage.success('位置已上报')
    loadData()
  } catch (err) {
    if (err !== 'cancel') {
      console.error(err)
      ElMessage.error('获取位置失败，请检查定位权限')
    }
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.waybill-tracking {
  padding: 20px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.map-card {
  margin-bottom: 20px;
}
.detail-card {
  margin-bottom: 20px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.refresh-btn {
  margin-left: auto;
}
.record-count {
  color: #909399;
  font-weight: normal;
  font-size: 13px;
  margin-left: 4px;
}
.map-container {
  width: 100%;
  overflow: hidden;
}
.map-canvas {
  position: relative;
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}
.map-svg {
  width: 100%;
  height: 100%;
}
.route-line {
  animation: dash 20s linear infinite;
}
@keyframes dash {
  to {
    stroke-dashoffset: -1000;
  }
}
.track-point {
  transition: all 0.3s ease;
}
.current-point {
  filter: drop-shadow(0 0 6px rgba(64, 158, 255, 0.8));
}
.pulse {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% {
    r: 12;
    opacity: 1;
  }
  50% {
    r: 16;
    opacity: 0.7;
  }
}
.position-label {
  font-size: 12px;
  fill: #409eff;
  font-weight: 600;
}
.endpoint {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
.endpoint-label {
  font-size: 12px;
  font-weight: 600;
  fill: #303133;
}
.map-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.legend-dot.start {
  background: #67c23a;
}
.legend-dot.current {
  background: #409eff;
  animation: pulse-legend 2s infinite;
}
.legend-dot.track {
  background: #409eff;
  width: 8px;
  height: 8px;
}
.legend-dot.warning {
  background: #f56c6c;
  width: 10px;
  height: 10px;
}
.legend-dot.end {
  background: #f56c6c;
}
@keyframes pulse-legend {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}
.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.anomaly-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 8px;
  border-left: 3px solid #f56c6c;
}
.anomaly-icon {
  color: #f56c6c;
  font-size: 20px;
  flex-shrink: 0;
}
.anomaly-message {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}
.anomaly-time {
  font-size: 12px;
  color: #909399;
}
.track-list {
  max-height: 400px;
  overflow-y: auto;
}
.track-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}
.track-item.is-latest .indicator-dot {
  background: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}
.track-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}
.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dcdfe6;
  flex-shrink: 0;
}
.indicator-dot.warning {
  background: #f56c6c;
}
.indicator-line {
  width: 2px;
  flex: 1;
  background: #e4e7ed;
  margin: 4px 0;
}
.track-content {
  flex: 1;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e4e7ed;
}
.track-coords {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #303133;
  margin-bottom: 6px;
}
.track-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.track-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.warning-text {
  color: #f56c6c;
}
.track-time {
  font-size: 12px;
  color: #c0c4cc;
}
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.stat-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 12px;
  color: #909399;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
