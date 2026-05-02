<template>
  <div class="map-page">
    <el-row :gutter="20">
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>车辆位置监控</span>
              <div class="header-actions">
                <el-select 
                  v-model="currentProvider" 
                  placeholder="选择地图服务" 
                  @change="switchMapProvider"
                  style="width: 140px; margin-right: 10px"
                >
                  <el-option 
                    v-for="provider in availableProviders" 
                    :key="provider.value" 
                    :label="provider.label" 
                    :value="provider.value" 
                  />
                </el-select>
                
                <el-select v-model="selectedRoute" placeholder="筛选线路" clearable @change="filterVehicles" style="width: 200px; margin-right: 10px">
                  <el-option v-for="route in routeList" :key="route.route_id" :label="route.route_name" :value="route.route_id" />
                </el-select>
                
                <el-button type="primary" @click="refreshVehicles">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="map-wrapper">
            <div ref="mapContainer" class="map-container"></div>
            
            <div v-if="isLoading" class="map-loading">
              <div class="loading-spinner"></div>
              <p>加载地图中...</p>
            </div>
            
            <div v-if="mapError" class="map-error">
              <el-alert :title="mapError" type="error" show-icon>
                <template #default>
                  <p v-if="currentProvider === 'amap'">请先配置高德地图 API Key</p>
                  <p v-if="currentProvider === 'bmap'">请先配置百度地图 AK</p>
                  <p>当前使用模拟地图模式</p>
                </template>
              </el-alert>
            </div>
          </div>
        </el-card>

        <el-card v-if="selectedVehicle" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>轨迹回放 - {{ selectedVehicle.plate_number }}</span>
              <div>
                <el-button-group>
                  <el-button :type="isPlaying ? 'warning' : 'success'" @click="togglePlayback">
                    <el-icon v-if="isPlaying"><Pause /></el-icon>
                    <el-icon v-else><VideoPlay /></el-icon>
                    {{ isPlaying ? '暂停' : '播放' }}
                  </el-button>
                  <el-button @click="resetPlayback">
                    <el-icon><Refresh /></el-icon>
                    重置
                  </el-button>
                </el-button-group>
                <span style="margin-left: 15px; color: #909399">
                  速度: 
                  <el-slider v-model="playbackSpeed" :min="0.5" :max="5" :step="0.5" style="width: 100px; display: inline-block; margin: 0 10px"></el-slider>
                  {{ playbackSpeed }}x
                </span>
              </div>
            </div>
          </template>
          
          <div class="playback-info">
            <el-progress :percentage="playbackProgress" :status="playbackProgress >= 100 ? 'success' : ''" />
            <div class="playback-time">
              <span>{{ formatTime(playbackStartTime) }}</span>
              <span>{{ formatTime(playbackCurrentTime) }} / {{ formatTime(playbackEndTime) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>车辆列表 ({{ vehicleList.length }})</span>
            </div>
          </template>
          
          <div class="vehicle-list">
            <div 
              v-for="vehicle in filteredVehicles" 
              :key="vehicle.vehicle_id" 
              class="vehicle-item"
              :class="{ 'active': selectedVehicle?.vehicle_id === vehicle.vehicle_id }"
              @click="selectVehicle(vehicle)"
            >
              <div class="vehicle-header">
                <span class="plate">{{ vehicle.plate_number }}</span>
                <el-tag :type="vehicle.status === 'running' ? 'success' : 'info'" size="small">
                  {{ vehicle.status === 'running' ? '运行中' : '空闲' }}
                </el-tag>
              </div>
              <div class="vehicle-info">
                <span>{{ vehicle.vehicle_type }}</span>
                <span>容量: {{ vehicle.capacity }}座</span>
              </div>
              <div class="vehicle-route" v-if="vehicle.route_name">
                <el-icon><Guide /></el-icon>
                {{ vehicle.route_name }}
              </div>
              <div class="vehicle-location" v-if="vehicle.current_latitude">
                <span>经: {{ vehicle.current_longitude?.toFixed(4) }}</span>
                <span>纬: {{ vehicle.current_latitude?.toFixed(4) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px" v-if="selectedVehicle">
          <template #header>
            <span>车辆详情</span>
          </template>
          
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="车牌号">{{ selectedVehicle.plate_number }}</el-descriptions-item>
            <el-descriptions-item label="车型">{{ selectedVehicle.vehicle_type }}</el-descriptions-item>
            <el-descriptions-item label="容量">{{ selectedVehicle.capacity }}座</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="selectedVehicle.status === 'running' ? 'success' : 'info'">
                {{ selectedVehicle.status === 'running' ? '运行中' : '空闲' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前线路" v-if="selectedVehicle.route_name">
              {{ selectedVehicle.route_name }}
            </el-descriptions-item>
            <el-descriptions-item label="主单号" v-if="selectedVehicle.main_order_no">
              <el-link type="primary" @click="goToOrder(selectedVehicle.main_order_no)">
                {{ selectedVehicle.main_order_no }}
              </el-link>
            </el-descriptions-item>
          </el-descriptions>

          <div style="margin-top: 15px">
            <el-button 
              v-if="selectedVehicle.status === 'idle'" 
              type="primary" 
              size="small"
              style="width: 100%"
              @click="simulateTrack"
            >
              模拟上报轨迹
            </el-button>
            <el-button 
              type="info" 
              size="small"
              style="width: 100%; margin-top: 10px"
              @click="loadVehicleTracks"
            >
              加载历史轨迹
            </el-button>
          </div>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>地图配置</span>
          </template>
          
          <el-form label-position="top" size="small">
            <el-form-item v-if="currentProvider === 'amap'" label="高德地图 Key">
              <el-input 
                v-model="amapKeyInput" 
                placeholder="请输入高德地图 Key"
                show-password
                @change="saveMapKey('amap')"
              />
            </el-form-item>
            
            <el-form-item v-if="currentProvider === 'bmap'" label="百度地图 AK">
              <el-input 
                v-model="bmapAkInput" 
                placeholder="请输入百度地图 AK"
                show-password
                @change="saveMapKey('bmap')"
              />
            </el-form-item>
            
            <el-form-item label="显示选项">
              <el-checkbox v-model="showStations">显示站点</el-checkbox>
              <el-checkbox v-model="showRouteLine" style="margin-left: 10px">显示线路</el-checkbox>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { mapApi } from '@/api'
import { ElMessage } from 'element-plus'
import { 
  MapFactory, 
  MAP_PROVIDERS, 
  getMapProvider, 
  setMapProvider, 
  getAmapKey, 
  getBmapAk,
  setAmapKey,
  setBmapAk
} from '@/maps'

const router = useRouter()

const mapContainer = ref(null)
let mapAdapter = null

const vehicleList = ref([])
const routeList = ref([])
const stationList = ref([])
const selectedRoute = ref('')
const selectedVehicle = ref(null)
const vehicleTracks = ref([])

const currentProvider = ref(getMapProvider())
const isLoading = ref(false)
const mapError = ref(null)

const amapKeyInput = ref(getAmapKey())
const bmapAkInput = ref(getBmapAk())

const showStations = ref(true)
const showRouteLine = ref(true)

const isPlaying = ref(false)
const playbackSpeed = ref(1)
const playbackProgress = ref(0)
const playbackCurrentIndex = ref(0)
let playbackTimer = null

const playbackStartTime = computed(() => vehicleTracks.value[0]?.track_time)
const playbackEndTime = computed(() => vehicleTracks.value[vehicleTracks.value.length - 1]?.track_time)
const playbackCurrentTime = computed(() => vehicleTracks.value[playbackCurrentIndex.value]?.track_time)

const availableProviders = computed(() => MapFactory.getAvailableProviders())

const filteredVehicles = computed(() => {
  if (!selectedRoute.value) return vehicleList.value
  return vehicleList.value.filter(v => v.route_id === selectedRoute.value)
})

async function initMap() {
  if (mapAdapter) {
    mapAdapter.destroy()
    mapAdapter = null
  }

  isLoading.value = true
  mapError.value = null

  try {
    await nextTick()
    
    if (!mapContainer.value) {
      throw new Error('地图容器未找到')
    }

    mapAdapter = MapFactory.create(currentProvider.value, mapContainer.value)
    await mapAdapter.init()

    renderMapData()

    mapAdapter.on('click', (lngLat) => {
      console.log('地图点击:', lngLat)
    })

  } catch (err) {
    console.error('地图初始化失败:', err)
    mapError.value = err.message
    
    if (currentProvider.value !== MAP_PROVIDERS.SIMULATED) {
      try {
        mapAdapter = MapFactory.create(MAP_PROVIDERS.SIMULATED, mapContainer.value)
        await mapAdapter.init()
        renderMapData()
        ElMessage.warning('切换到模拟地图模式')
      } catch (fallbackErr) {
        console.error('模拟地图初始化也失败:', fallbackErr)
      }
    }
  } finally {
    isLoading.value = false
  }
}

function renderMapData() {
  if (!mapAdapter) return

  mapAdapter.removeAllMarkers()
  mapAdapter.removeAllPolylines()

  const allPoints = []

  if (showStations.value && stationList.value.length > 0) {
    stationList.value.forEach((station, index) => {
      if (station.longitude && station.latitude) {
        allPoints.push({ lng: station.longitude, lat: station.latitude })
        
        mapAdapter.addMarker(station.longitude, station.latitude, {
          label: station.station_name,
          content: `
            <div style="
              width: 24px; height: 24px;
              background: #fff; border: 2px solid #E6A23C;
              border-radius: 50%; display: flex;
              align-items: center; justify-content: center;
              font-size: 12px; color: #E6A23C; font-weight: bold;
            ">${index + 1}</div>
          `,
          onClick: () => {
            ElMessage.info(`站点: ${station.station_name}`)
          }
        })
      }
    })
  }

  if (showRouteLine.value && selectedRoute.value) {
    const route = routeList.value.find(r => r.route_id === selectedRoute.value)
    if (route && route.stations) {
      const path = route.stations
        .filter(s => s.longitude && s.latitude)
        .map(s => ({ lng: s.longitude, lat: s.latitude }))
      
      if (path.length >= 2) {
        mapAdapter.addPolyline(path, {
          strokeColor: '#409EFF',
          strokeWidth: 4,
          strokeDasharray: '10, 5'
        })
      }
    }
  }

  filteredVehicles.value.forEach(vehicle => {
    const lng = vehicle.current_longitude || vehicle.last_track?.longitude
    const lat = vehicle.current_latitude || vehicle.last_track?.latitude
    
    if (lng && lat) {
      allPoints.push({ lng, lat })
      
      const isSelected = selectedVehicle.value?.vehicle_id === vehicle.vehicle_id
      const isRunning = vehicle.status === 'running'
      
      const markerColor = isSelected 
        ? '#F56C6C' 
        : (isRunning ? '#67C23A' : '#909399')

      mapAdapter.addMarker(lng, lat, {
        label: vehicle.plate_number,
        content: `
          <div style="
            width: ${isSelected ? '44px' : '36px'}; 
            height: ${isSelected ? '44px' : '36px'};
            background: ${markerColor};
            border-radius: 50%; display: flex;
            align-items: center; justify-content: center;
            color: #fff; font-size: ${isSelected ? '20px' : '16px'};
            box-shadow: 0 2px 12px rgba(0,0,0,0.3);
            ${isRunning ? 'animation: pulse 2s infinite;' : ''}
          ">
            <svg viewBox="0 0 24 24" width="${isSelected ? '24' : '18'}" height="${isSelected ? '24' : '18'}" fill="currentColor">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
          </div>
        `,
        onClick: () => selectVehicle(vehicle)
      })
    }
  })

  if (allPoints.length > 0) {
    mapAdapter.fitBounds(allPoints)
  }
}

async function fetchData() {
  try {
    const [vehicles, routes, stations] = await Promise.all([
      mapApi.getVehicles(),
      mapApi.getRoutes(),
      mapApi.getStations()
    ])
    vehicleList.value = vehicles
    routeList.value = routes
    stationList.value = stations
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

function filterVehicles() {
  renderMapData()
}

function refreshVehicles() {
  fetchData()
  ElMessage.success('已刷新')
}

function selectVehicle(vehicle) {
  selectedVehicle.value = vehicle
  
  const lng = vehicle.current_longitude || vehicle.last_track?.longitude
  const lat = vehicle.current_latitude || vehicle.last_track?.latitude
  
  if (lng && lat && mapAdapter) {
    mapAdapter.setCenter(lng, lat)
    mapAdapter.setZoom(15)
  }
  
  renderMapData()
}

async function loadVehicleTracks() {
  if (!selectedVehicle.value) return
  
  try {
    const tracks = await mapApi.getTracks(selectedVehicle.value.vehicle_id, { limit: 100 })
    vehicleTracks.value = tracks
    
    if (tracks.length > 0) {
      const path = tracks
        .filter(t => t.longitude && t.latitude)
        .map(t => ({ lng: t.longitude, lat: t.latitude }))
      
      if (path.length >= 2 && mapAdapter) {
        mapAdapter.addPolyline(path, {
          strokeColor: '#67C23A',
          strokeWidth: 3,
          strokeOpacity: 0.8
        })
      }
      
      playbackCurrentIndex.value = 0
      playbackProgress.value = 0
      ElMessage.success(`加载了 ${tracks.length} 条轨迹记录`)
    } else {
      ElMessage.info('暂无历史轨迹')
    }
  } catch (error) {
    console.error('加载轨迹失败:', error)
    ElMessage.error('加载轨迹失败')
  }
}

function togglePlayback() {
  if (vehicleTracks.value.length < 2) {
    ElMessage.warning('请先加载历史轨迹')
    return
  }
  
  isPlaying.value = !isPlaying.value
  
  if (isPlaying.value) {
    startPlayback()
  } else {
    stopPlayback()
  }
}

function startPlayback() {
  const delay = 500 / playbackSpeed.value
  
  playbackTimer = setInterval(() => {
    if (playbackCurrentIndex.value < vehicleTracks.value.length - 1) {
      playbackCurrentIndex.value++
      playbackProgress.value = Math.round((playbackCurrentIndex.value / (vehicleTracks.value.length - 1)) * 100)
      
      const track = vehicleTracks.value[playbackCurrentIndex.value]
      if (track.longitude && track.latitude && mapAdapter) {
        mapAdapter.setCenter(track.longitude, track.latitude)
      }
    } else {
      isPlaying.value = false
      stopPlayback()
      ElMessage.success('轨迹播放完成')
    }
  }, delay)
}

function stopPlayback() {
  if (playbackTimer) {
    clearInterval(playbackTimer)
    playbackTimer = null
  }
}

function resetPlayback() {
  stopPlayback()
  isPlaying.value = false
  playbackCurrentIndex.value = 0
  playbackProgress.value = 0
  
  if (vehicleTracks.value.length > 0) {
    const track = vehicleTracks.value[0]
    if (track.longitude && track.latitude && mapAdapter) {
      mapAdapter.setCenter(track.longitude, track.latitude)
    }
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '--:--:--'
  const date = new Date(timeStr)
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

function goToOrder(mainOrderNo) {
  router.push(`/orders/${mainOrderNo}`)
}

async function simulateTrack() {
  if (!selectedVehicle.value) return
  
  const baseLat = selectedVehicle.value.current_latitude || 39.9
  const baseLng = selectedVehicle.value.current_longitude || 116.4
  
  const newLat = baseLat + (Math.random() - 0.5) * 0.01
  const newLng = baseLng + (Math.random() - 0.5) * 0.01
  
  try {
    await mapApi.submitTrack({
      vehicle_id: selectedVehicle.value.vehicle_id,
      main_order_no: selectedVehicle.value.main_order_no,
      latitude: newLat,
      longitude: newLng,
      speed: Math.random() * 60,
      direction: Math.random() * 360
    })
    ElMessage.success('轨迹上报成功')
    fetchData()
  } catch (error) {
    console.error('上报失败:', error)
  }
}

function switchMapProvider(provider) {
  setMapProvider(provider)
  currentProvider.value = provider
  initMap()
}

function saveMapKey(type) {
  if (type === 'amap') {
    setAmapKey(amapKeyInput.value)
    if (amapKeyInput.value) {
      ElMessage.success('高德地图 Key 已保存')
    }
  } else if (type === 'bmap') {
    setBmapAk(bmapAkInput.value)
    if (bmapAkInput.value) {
      ElMessage.success('百度地图 AK 已保存')
    }
  }
}

watch([showStations, showRouteLine, selectedRoute], () => {
  renderMapData()
})

onMounted(() => {
  fetchData()
  initMap()
})

onUnmounted(() => {
  stopPlayback()
  if (mapAdapter) {
    mapAdapter.destroy()
    mapAdapter = null
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.map-wrapper {
  position: relative;
  height: 550px;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading, .map-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(103, 194, 58, 0); }
  100% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0); }
}

.vehicle-list {
  max-height: 400px;
  overflow-y: auto;
}

.vehicle-item {
  padding: 12px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.vehicle-item:hover {
  border-color: #409EFF;
}

.vehicle-item.active {
  border-color: #409EFF;
  background: #ECF5FF;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.plate {
  font-weight: bold;
  color: #303133;
}

.vehicle-info {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
}

.vehicle-route {
  font-size: 13px;
  color: #409EFF;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.vehicle-location {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
}

.playback-info {
  padding: 10px 0;
}

.playback-time {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
