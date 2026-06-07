<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getDeviceHeatmapApi } from '@/api/device'
import * as L from 'leaflet'

const loading = ref(false)
const heatmapData = ref<any[]>([])
const mapRef = ref<HTMLDivElement>()
let map: L.Map | null = null
let heatLayer: any = null

async function loadHeatmapData() {
  loading.value = true
  try {
    const res = await getDeviceHeatmapApi()
    heatmapData.value = res.data || []
    renderHeatmap()
  } catch (error) {
    console.error('Load heatmap error:', error)
    heatmapData.value = generateMockData()
    renderHeatmap()
  } finally {
    loading.value = false
  }
}

function generateMockData() {
  const data = []
  const baseLat = 39.9042
  const baseLng = 116.4074
  for (let i = 0; i < 50; i++) {
    data.push({
      lat: baseLat + (Math.random() - 0.5) * 0.1,
      lng: baseLng + (Math.random() - 0.5) * 0.1,
      intensity: Math.random() * 100,
      deviceId: i + 1,
      deviceName: `设备${i + 1}`,
      status: ['idle', 'running', 'fault'][Math.floor(Math.random() * 3)]
    })
  }
  return data
}

function initMap() {
  if (!mapRef.value) return

  map = L.map(mapRef.value).setView([39.9042, 116.4074], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  const canvas = document.createElement('canvas')
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.pointerEvents = 'none'

  const overlay = L.layerGroup().addTo(map)

  map.on('moveend', () => renderHeatmap())
  map.on('zoomend', () => renderHeatmap())
}

function renderHeatmap() {
  if (!map) return

  const canvas = document.createElement('canvas')
  const size = map.getSize()
  canvas.width = size.x
  canvas.height = size.y
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.pointerEvents = 'none'

  const ctx = canvas.getContext('2d')!
  const bounds = map.getBounds()

  heatmapData.value.forEach((point) => {
    if (!bounds.contains([point.lat, point.lng])) return

    const latLng = L.latLng(point.lat, point.lng)
    const containerPoint = map!.latLngToContainerPoint(latLng)
    const radius = 30 + (point.intensity / 100) * 30

    const gradient = ctx.createRadialGradient(
      containerPoint.x,
      containerPoint.y,
      0,
      containerPoint.x,
      containerPoint.y,
      radius
    )

    const intensity = point.intensity / 100
    if (intensity > 0.7) {
      gradient.addColorStop(0, `rgba(255, 0, 0, ${0.6 * intensity})`)
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${0.4 * intensity})`)
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)')
    } else if (intensity > 0.3) {
      gradient.addColorStop(0, `rgba(255, 165, 0, ${0.6 * intensity})`)
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${0.4 * intensity})`)
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0)')
    } else {
      gradient.addColorStop(0, `rgba(0, 255, 0, ${0.6 * intensity})`)
      gradient.addColorStop(0.5, `rgba(0, 255, 255, ${0.4 * intensity})`)
      gradient.addColorStop(1, 'rgba(0, 0, 255, 0)')
    }

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(containerPoint.x, containerPoint.y, radius, 0, Math.PI * 2)
    ctx.fill()
  })

  if (heatLayer) {
    map.removeLayer(heatLayer)
  }

  heatLayer = L.imageOverlay(
    canvas.toDataURL(),
    map!.getBounds()
  ).addTo(map!)

  heatmapData.value.forEach((point) => {
    if (!bounds.contains([point.lat, point.lng])) return

    const statusColor = point.status === 'fault' ? '#f56c6c' : point.status === 'running' ? '#409eff' : '#67c23a'
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: 8,
      fillColor: statusColor,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    }).addTo(map!)

    marker.bindPopup(`
      <div style="padding: 4px;">
        <h4 style="margin: 0 0 4px 0; font-size: 14px;">${point.deviceName}</h4>
        <p style="margin: 2px 0; font-size: 12px;">强度: ${Math.round(point.intensity)}</p>
        <p style="margin: 2px 0; font-size: 12px;">状态: ${point.status}</p>
      </div>
    `)
  })
}

const stats = [
  { label: '覆盖设备', value: 50, color: '#409eff' },
  { label: '高活跃区域', value: 12, color: '#f56c6c' },
  { label: '中活跃区域', value: 18, color: '#e6a23c' },
  { label: '低活跃区域', value: 20, color: '#67c23a' }
]

onMounted(() => {
  initMap()
  loadHeatmapData()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<template>
  <div class="gis-map-page">
    <el-card class="header-card">
      <div class="stats-row">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="stat-item"
        >
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color" style="background: #f56c6c;"></span>
          <span>高活跃</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #e6a23c;"></span>
          <span>中活跃</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #67c23a;"></span>
          <span>低活跃</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #409eff;"></span>
          <span>设备点位</span>
        </div>
      </div>
    </el-card>

    <el-card class="map-card" v-loading="loading">
      <div ref="mapRef" class="map-container"></div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.gis-map-page {
  .header-card {
    margin-bottom: 20px;

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 16px;

      .stat-item {
        text-align: center;

        .stat-value {
          font-size: 28px;
          font-weight: 700;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }

    .legend {
      display: flex;
      gap: 24px;
      justify-content: center;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #606266;

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
      }
    }
  }

  .map-card {
    .map-container {
      height: calc(100vh - 300px);
      min-height: 500px;
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
  }
}

@media (max-width: 768px) {
  .gis-map-page {
    .header-card {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .legend {
        flex-wrap: wrap;
        gap: 12px;
      }
    }
  }
}
</style>
