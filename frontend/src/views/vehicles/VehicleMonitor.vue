<template>
  <div class="vehicle-monitor">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>车辆实时监控</span>
          <div class="header-actions">
            <el-tag type="info">
              车辆总数: {{ vehicles.length }}
            </el-tag>
            <el-tag :type="onlineCount > 0 ? 'success' : 'info'">
              在线: {{ onlineCount }}
            </el-tag>
            <el-button type="primary" @click="refreshData" :loading="loading">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
            <el-switch
              v-model="autoRefresh"
              active-text="自动刷新"
              inactive-text="手动刷新"
              @change="toggleAutoRefresh"
            />
          </div>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="16">
          <div class="map-container" ref="mapContainer"></div>
        </el-col>
        
        <el-col :span="8">
          <div class="vehicle-list-panel">
            <h4 style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <span>车辆列表</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索车牌号/司机"
                clearable
                size="small"
                style="width: 160px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </h4>
            
            <div 
              v-for="vehicle in filteredVehicles" 
              :key="vehicle.id" 
              class="vehicle-item"
              :class="{ 'selected': selectedVehicle?.id === vehicle.id }"
              @click="focusVehicle(vehicle)"
            >
              <div class="vehicle-header">
                <span class="plate-number">{{ vehicle.plate_number }}</span>
                <el-tag :type="getStatusType(vehicle.status)" size="small">
                  {{ getStatusText(vehicle.status) }}
                </el-tag>
              </div>
              <div class="vehicle-info">
                <span>{{ vehicle.vehicle_type }} - {{ vehicle.vehicle_model }}</span>
              </div>
              <div class="vehicle-info" v-if="vehicle.driver_name">
                <span>司机: {{ vehicle.driver_name }}</span>
              </div>
              <div class="vehicle-location" v-if="vehicle.current_address">
                <el-icon><Location /></el-icon>
                <span>{{ vehicle.current_address }}</span>
              </div>
              <div class="vehicle-stats">
                <span v-if="vehicle.speed !== null && vehicle.speed !== undefined">
                  速度: {{ vehicle.speed }} km/h
                </span>
                <span v-if="vehicle.current_load !== null && vehicle.current_load !== undefined">
                  载重: {{ vehicle.current_load }} kg
                </span>
              </div>
              <div class="vehicle-status-badge">
                <el-tag :type="vehicle.door_status === 1 ? 'warning' : 'success'" size="small">
                  车门:{{ vehicle.door_status === 1 ? '开' : '关' }}
                </el-tag>
                <el-tag :type="vehicle.light_status === 1 ? 'warning' : 'info'" size="small">
                  车灯:{{ vehicle.light_status === 1 ? '开' : '关' }}
                </el-tag>
                <el-tag :type="vehicle.cargo_door_status === 1 ? 'warning' : 'success'" size="small">
                  货箱门:{{ vehicle.cargo_door_status === 1 ? '开' : '关' }}
                </el-tag>
              </div>
              <div class="last-report" v-if="vehicle.last_report_time">
                最后上报: {{ formatDate(vehicle.last_report_time) }}
              </div>
            </div>
            
            <el-empty v-if="filteredVehicles.length === 0" description="暂无车辆数据" />
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getRealtimeVehicles } from '@/api/vehicles'

const router = useRouter()

const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const selectedCircle = ref(null)
const loading = ref(false)
const autoRefresh = ref(false)
const searchKeyword = ref('')
const selectedVehicle = ref(null)
const vehicles = ref([])
let refreshInterval = null

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const attribution = '&copy; OpenStreetMap contributors'

const vehiclesWithLocation = computed(() => {
  return vehicles.value.filter(v => v.latitude != null && v.longitude != null)
})

const onlineCount = computed(() => {
  return vehicles.value.filter(v => v.last_report_time).length
})

const filteredVehicles = computed(() => {
  if (!searchKeyword.value) return vehicles.value
  const keyword = searchKeyword.value.toLowerCase()
  return vehicles.value.filter(v => 
    v.plate_number?.toLowerCase().includes(keyword) ||
    v.driver_name?.toLowerCase().includes(keyword)
  )
})

const getStatusType = (status) => {
  const typeMap = {
    idle: 'success',
    maintenance: 'warning',
    transit: 'primary',
    loading: 'warning',
    unloading: 'warning'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    idle: '空闲',
    maintenance: '维护中',
    transit: '运输中',
    loading: '装货中',
    unloading: '卸货中'
  }
  return textMap[status] || status
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const createVehicleIcon = (vehicle) => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="white" stroke="${vehicle.status === 'transit' ? '#409eff' : vehicle.status === 'maintenance' ? '#e6a23c' : '#67c23a'}" stroke-width="2"/>
      <path d="M10 20h12v-4h-2v-4h-6v4h-2v4zm1.5-7a2.5 2.5 0 0 1 0-5a1 1 0 0 1 0 2h-1.5a1 1 0 0 1 0-2 4.5 4.5 0 0 0 0 8 1 1 0 0 1 0-2h1.5a1 1 0 0 1 0-2z" fill="${vehicle.status === 'transit' ? '#409eff' : vehicle.status === 'maintenance' ? '#e6a23c' : '#67c23a'}"/>
      <circle cx="10" cy="24" r="2" fill="${vehicle.status === 'transit' ? '#409eff' : vehicle.status === 'maintenance' ? '#e6a23c' : '#67c23a'}"/>
      <circle cx="22" cy="24" r="2" fill="${vehicle.status === 'transit' ? '#409eff' : vehicle.status === 'maintenance' ? '#e6a23c' : '#67c23a'}"/>
    </svg>
  `
  
  return L.divIcon({
    html: svgString,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'vehicle-marker'
  })
}

const createPopupContent = (vehicle) => {
  return `
    <div class="vehicle-popup">
      <h4 style="margin: 0 0 8px 0; color: #409eff;">${vehicle.plate_number}</h4>
      <p style="margin: 4px 0; font-size: 13px;">
        <strong>状态:</strong> 
        <span style="color: ${vehicle.status === 'transit' ? '#409eff' : vehicle.status === 'maintenance' ? '#e6a23c' : '#67c23a'}">
          ${getStatusText(vehicle.status)}
        </span>
      </p>
      <p style="margin: 4px 0; font-size: 13px;">
        <strong>司机:</strong> ${vehicle.driver_name || '未分配'}
      </p>
      ${vehicle.speed !== null && vehicle.speed !== undefined ? `
        <p style="margin: 4px 0; font-size: 13px;">
          <strong>速度:</strong> ${vehicle.speed} km/h
        </p>
      ` : ''}
      ${vehicle.current_address ? `
        <p style="margin: 4px 0; font-size: 13px;">
          <strong>位置:</strong> ${vehicle.current_address}
        </p>
      ` : ''}
      ${vehicle.last_report_time ? `
        <p style="margin: 4px 0; font-size: 13px;">
          <strong>最后上报:</strong> ${formatDate(vehicle.last_report_time)}
        </p>
      ` : ''}
    </div>
  `
}

const initMap = () => {
  if (!mapContainer.value) return
  
  map.value = L.map(mapContainer.value).setView([39.9042, 116.4074], 11)
  
  L.tileLayer(tileUrl, {
    attribution: attribution,
    maxZoom: 19
  }).addTo(map.value)
}

const clearMarkers = () => {
  markers.value.forEach(marker => {
    if (map.value) {
      map.value.removeLayer(marker)
    }
  })
  markers.value = []
  
  if (selectedCircle.value && map.value) {
    map.value.removeLayer(selectedCircle.value)
    selectedCircle.value = null
  }
}

const updateMarkers = () => {
  if (!map.value) return
  
  clearMarkers()
  
  vehiclesWithLocation.value.forEach(vehicle => {
    const icon = createVehicleIcon(vehicle)
    const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon })
    
    marker.bindPopup(createPopupContent(vehicle))
    
    marker.on('click', () => {
      focusVehicle(vehicle)
    })
    
    marker.addTo(map.value)
    markers.value.push(marker)
    
    if (selectedVehicle.value && selectedVehicle.value.id === vehicle.id) {
      marker.openPopup()
    }
  })
}

const focusVehicle = (vehicle) => {
  selectedVehicle.value = vehicle
  
  if (vehicle.latitude != null && vehicle.longitude != null && map.value) {
    map.value.setView([vehicle.latitude, vehicle.longitude], 14)
    
    if (selectedCircle.value && map.value) {
      map.value.removeLayer(selectedCircle.value)
    }
    
    selectedCircle.value = L.circle([vehicle.latitude, vehicle.longitude], {
      radius: 500,
      color: '#409eff',
      fillColor: '#409eff',
      fillOpacity: 0.1,
      weight: 2
    }).addTo(map.value)
  }
}

const fetchVehicles = async () => {
  loading.value = true
  try {
    const res = await getRealtimeVehicles()
    vehicles.value = res || []
    
    if (vehicles.value.length > 0 && map.value) {
      const withLocation = vehicles.value.filter(v => v.latitude != null && v.longitude != null)
      if (withLocation.length > 0) {
        updateMarkers()
      }
    }
  } catch (error) {
    console.error('获取车辆数据失败:', error)
    ElMessage.error('获取车辆数据失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchVehicles()
}

const toggleAutoRefresh = (val) => {
  if (val) {
    refreshInterval = setInterval(() => {
      fetchVehicles()
    }, 10000)
    ElMessage.info('已开启自动刷新 (10秒/次)')
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
    ElMessage.info('已关闭自动刷新')
  }
}

onMounted(() => {
  nextTick(() => {
    initMap()
    fetchVehicles()
  })
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>

<style scoped>
.vehicle-monitor {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.map-container {
  height: 600px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.vehicle-list-panel {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 10px;
}

.vehicle-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.vehicle-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.vehicle-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.plate-number {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.vehicle-info {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.vehicle-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.vehicle-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.vehicle-status-badge {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.last-report {
  font-size: 12px;
  color: #c0c4cc;
}

:deep(.vehicle-marker) {
  background: transparent;
  border: none;
}
</style>
