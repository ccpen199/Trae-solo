<template>
  <div class="track-query">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>轨迹查询</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-select v-model="searchForm.vehicle_id" placeholder="请选择车辆" clearable style="width: 150px">
            <el-option v-for="vehicle in vehicles" :key="vehicle.id" :label="vehicle.plate_number" :value="vehicle.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>轨迹地图</span>
              <div>
                <el-tag v-if="trackPoints.length > 0" type="info">
                  轨迹点数: {{ trackPoints.length }}
                </el-tag>
                <el-tag v-if="trackLine" type="primary" style="margin-left: 8px;">
                  轨迹已绘制
                </el-tag>
              </div>
            </div>
          </template>
          
          <div class="map-container" ref="mapContainer"></div>
          
          <div v-if="trackSummary" class="track-summary" style="margin-top: 16px;">
            <el-descriptions :column="4" border size="small">
              <el-descriptions-item label="起始点">{{ trackSummary.startAddress }}</el-descriptions-item>
              <el-descriptions-item label="结束点">{{ trackSummary.endAddress }}</el-descriptions-item>
              <el-descriptions-item label="行驶时间">{{ trackSummary.duration }}</el-descriptions-item>
              <el-descriptions-item label="上报点数">{{ trackSummary.pointCount }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>轨迹点列表</span>
          </template>
          
          <div class="track-list-container">
            <div 
              v-for="(point, index) in trackPoints" 
              :key="point.id || index" 
              class="track-point-item"
              :class="{ 'selected': selectedPointIndex === index }"
              @click="focusTrackPoint(point, index)"
            >
              <div class="point-header">
                <span class="point-index">#{{ index + 1 }}</span>
                <span class="point-time">{{ formatDate(point.report_time) }}</span>
              </div>
              <div class="point-location" v-if="point.address">
                <el-icon><Location /></el-icon>
                <span>{{ point.address }}</span>
              </div>
              <div class="point-stats">
                <span v-if="point.speed !== null && point.speed !== undefined">
                  速度: {{ point.speed }} km/h
                </span>
                <span v-if="point.direction">
                  方向: {{ point.direction }}
                </span>
              </div>
              <div class="point-status">
                <el-tag :type="point.door_status === 1 ? 'warning' : 'success'" size="small">
                  车门:{{ point.door_status === 1 ? '开' : '关' }}
                </el-tag>
                <el-tag :type="point.light_status === 1 ? 'warning' : 'info'" size="small">
                  车灯:{{ point.light_status === 1 ? '开' : '关' }}
                </el-tag>
              </div>
            </div>
            
            <el-empty v-if="trackPoints.length === 0" description="暂无轨迹数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getTrackList, getVehicleTrack } from '@/api/gps'
import { getVehicleList } from '@/api/vehicles'

const mapContainer = ref(null)
const map = ref(null)
const trackLine = ref(null)
const markers = ref([])
const selectedMarker = ref(null)
const selectedPointIndex = ref(null)

const loading = ref(false)
const trackPoints = ref([])
const vehicles = ref([])
const trackSummary = ref(null)

const searchForm = reactive({
  order_no: '',
  vehicle_id: null,
  dateRange: []
})

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const attribution = '&copy; OpenStreetMap contributors'

const formatDate = (date) => {
  return date ? dayjs(date).format('HH:mm:ss') : '-'
}

const initMap = () => {
  if (!mapContainer.value) return
  
  map.value = L.map(mapContainer.value).setView([39.9042, 116.4074], 11)
  
  L.tileLayer(tileUrl, {
    attribution: attribution,
    maxZoom: 19
  }).addTo(map.value)
}

const clearMap = () => {
  if (!map.value) return
  
  if (trackLine.value) {
    map.value.removeLayer(trackLine.value)
    trackLine.value = null
  }
  
  markers.value.forEach(marker => {
    map.value.removeLayer(marker)
  })
  markers.value = []
  
  if (selectedMarker.value) {
    map.value.removeLayer(selectedMarker.value)
    selectedMarker.value = null
  }
}

const createPointIcon = (index, isSelected = false) => {
  const color = isSelected ? '#f56c6c' : '#409eff'
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="white" stroke="${color}" stroke-width="2"/>
      <circle cx="10" cy="10" r="4" fill="${color}"/>
    </svg>
  `
  
  return L.divIcon({
    html: svgString,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
    className: 'point-marker'
  })
}

const createStartIcon = () => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#67c23a" stroke="white" stroke-width="2"/>
      <text x="14" y="18" text-anchor="middle" fill="white" font-size="12" font-weight="bold">起</text>
    </svg>
  `
  
  return L.divIcon({
    html: svgString,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    className: 'start-marker'
  })
}

const createEndIcon = () => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#f56c6c" stroke="white" stroke-width="2"/>
      <text x="14" y="18" text-anchor="middle" fill="white" font-size="12" font-weight="bold">终</text>
    </svg>
  `
  
  return L.divIcon({
    html: svgString,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    className: 'end-marker'
  })
}

const drawTrack = () => {
  if (!map.value || trackPoints.value.length === 0) return
  
  clearMap()
  
  const validPoints = trackPoints.value.filter(p => p.latitude != null && p.longitude != null)
  
  if (validPoints.length < 2) {
    ElMessage.warning('轨迹点数不足，无法绘制轨迹线')
    return
  }
  
  const latLngs = validPoints.map(p => [p.latitude, p.longitude])
  
  trackLine.value = L.polyline(latLngs, {
    color: '#409eff',
    weight: 4,
    opacity: 0.8,
    smoothFactor: 1
  }).addTo(map.value)
  
  if (validPoints.length >= 1) {
    const startMarker = L.marker(latLngs[0], { icon: createStartIcon() })
    startMarker.bindPopup(`
      <div>
        <strong>起点</strong><br/>
        位置: ${validPoints[0].address || '未知'}<br/>
        时间: ${formatDate(validPoints[0].report_time)}
      </div>
    `)
    startMarker.addTo(map.value)
    markers.value.push(startMarker)
  }
  
  if (validPoints.length >= 2) {
    const endMarker = L.marker(latLngs[latLngs.length - 1], { icon: createEndIcon() })
    endMarker.bindPopup(`
      <div>
        <strong>终点</strong><br/>
        位置: ${validPoints[validPoints.length - 1].address || '未知'}<br/>
        时间: ${formatDate(validPoints[validPoints.length - 1].report_time)}
      </div>
    `)
    endMarker.addTo(map.value)
    markers.value.push(endMarker)
  }
  
  for (let i = 0; i < validPoints.length; i++) {
    const point = validPoints[i]
    const marker = L.marker([point.latitude, point.longitude], { 
      icon: createPointIcon(i),
      zIndexOffset: 100
    })
    
    marker.bindPopup(`
      <div>
        <strong>轨迹点 #${i + 1}</strong><br/>
        位置: ${point.address || '未知'}<br/>
        时间: ${formatDate(point.report_time)}<br/>
        速度: ${point.speed || 0} km/h<br/>
        方向: ${point.direction || '未知'}
      </div>
    `)
    
    marker.on('click', () => {
      const index = trackPoints.value.findIndex(p => p.id === point.id)
      if (index !== -1) {
        selectedPointIndex.value = index
      }
    })
    
    marker.addTo(map.value)
    markers.value.push(marker)
  }
  
  map.value.fitBounds(trackLine.value.getBounds(), {
    padding: [50, 50]
  })
  
  updateTrackSummary(validPoints)
}

const updateTrackSummary = (points) => {
  if (points.length < 2) {
    trackSummary.value = null
    return
  }
  
  const startPoint = points[0]
  const endPoint = points[points.length - 1]
  const startTime = dayjs(startPoint.report_time)
  const endTime = dayjs(endPoint.report_time)
  const duration = endTime.diff(startTime, 'minute')
  
  let durationText = ''
  if (duration >= 60) {
    const hours = Math.floor(duration / 60)
    const mins = duration % 60
    durationText = `${hours}小时${mins}分钟`
  } else {
    durationText = `${duration}分钟`
  }
  
  trackSummary.value = {
    startAddress: startPoint.address || '未知',
    endAddress: endPoint.address || '未知',
    duration: durationText,
    pointCount: points.length
  }
}

const focusTrackPoint = (point, index) => {
  if (!map.value) return
  
  selectedPointIndex.value = index
  
  if (point.latitude == null || point.longitude == null) {
    ElMessage.warning('该轨迹点无经纬度信息')
    return
  }
  
  map.value.setView([point.latitude, point.longitude], 15)
  
  if (selectedMarker.value && map.value) {
    map.value.removeLayer(selectedMarker.value)
  }
  
  selectedMarker.value = L.circleMarker([point.latitude, point.longitude], {
    radius: 15,
    fillColor: '#f56c6c',
    fillOpacity: 0.5,
    color: '#f56c6c',
    weight: 2
  }).addTo(map.value)
}

const fetchVehicles = async () => {
  try {
    const res = await getVehicleList({
      page: 1,
      pageSize: 100
    })
    vehicles.value = res.data || []
  } catch (error) {
    console.error('获取车辆列表失败:', error)
  }
}

const fetchTrackList = async () => {
  loading.value = true
  try {
    let res
    if (searchForm.vehicle_id) {
      const params = {}
      if (searchForm.dateRange && searchForm.dateRange.length === 2) {
        params.start_date = searchForm.dateRange[0]
        params.end_date = searchForm.dateRange[1]
      }
      res = await getVehicleTrack(searchForm.vehicle_id, params)
      trackPoints.value = res || []
    } else {
      const params = {
        page: 1,
        pageSize: 100
      }
      if (searchForm.order_no) {
        params.order_no = searchForm.order_no
      }
      if (searchForm.dateRange && searchForm.dateRange.length === 2) {
        params.start_date = searchForm.dateRange[0]
        params.end_date = searchForm.dateRange[1]
      }
      res = await getTrackList(params)
      trackPoints.value = res.data || []
    }
    
    nextTick(() => {
      drawTrack()
    })
  } catch (error) {
    console.error('获取轨迹列表失败:', error)
    ElMessage.error('获取轨迹数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchTrackList()
}

const handleReset = () => {
  searchForm.order_no = ''
  searchForm.vehicle_id = null
  searchForm.dateRange = []
  trackPoints.value = []
  trackSummary.value = null
  clearMap()
}

onMounted(() => {
  fetchVehicles()
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>

<style scoped>
.track-query {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 0;
}

.map-container {
  height: 500px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.track-list-container {
  max-height: 550px;
  overflow-y: auto;
  padding-right: 10px;
}

.track-point-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.track-point-item:hover {
  border-color: #409eff;
}

.track-point-item.selected {
  border-color: #f56c6c;
  background: #fef0f0;
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.point-index {
  font-weight: bold;
  color: #409eff;
}

.point-time {
  font-size: 12px;
  color: #909399;
}

.point-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.point-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.point-status {
  display: flex;
  gap: 8px;
}

.track-summary {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

:deep(.point-marker),
:deep(.start-marker),
:deep(.end-marker) {
  background: transparent;
  border: none;
}
</style>
