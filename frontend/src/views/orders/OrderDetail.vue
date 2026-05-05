<template>
  <div class="order-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>返回
          </el-button>
          <span>订单详情</span>
          <div>
            <el-button type="primary" link @click="editOrder" v-if="order.status === 'pending'">编辑订单</el-button>
            <el-button type="primary" @click="doReviewOrder" v-if="order.status === 'pending'">审核通过</el-button>
            <el-button type="primary" @click="openAssignDialog" v-if="['reviewed', 'planned'].includes(order.status)">分配车辆</el-button>
            <el-button type="primary" @click="openStartDialog" v-if="['planned', 'loading', 'transit', 'unloading'].includes(order.status)">执行操作</el-button>
            <el-button type="danger" @click="doCancelOrder" v-if="['pending', 'reviewed', 'planned'].includes(order.status)">取消订单</el-button>
          </div>
        </div>
      </template>
      
      <el-descriptions title="基本信息" :column="3" border>
        <el-descriptions-item label="订单号">{{ order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ order.order_type === 'normal' ? '普通运输' : order.order_type === 'urgent' ? '急件运输' : order.order_type === 'cold' ? '冷藏运输' : '危险品运输' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ order.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ order.customer_phone }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="order.priority === 3 ? 'danger' : order.priority === 2 ? 'warning' : 'info'">
            {{ order.priority === 3 ? '特急' : order.priority === 2 ? '紧急' : '普通' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ order.created_by_name }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(order.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="审核人">{{ order.reviewed_by_name || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-descriptions title="起点信息" :column="1" border>
            <el-descriptions-item label="地址">{{ order.origin_address }}</el-descriptions-item>
            <el-descriptions-item label="坐标">
              经度: {{ order.origin_lng }}, 纬度: {{ order.origin_lat }}
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
        <el-col :span="12">
          <el-descriptions title="终点信息" :column="1" border>
            <el-descriptions-item label="地址">{{ order.dest_address }}</el-descriptions-item>
            <el-descriptions-item label="坐标">
              经度: {{ order.dest_lng }}, 纬度: {{ order.dest_lat }}
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
      
      <el-divider />
      
      <div v-if="hasRoutePoints" class="map-section">
        <div class="map-header">
          <span>运输路线地图</span>
          <div>
            <el-tag v-if="hasValidRoutePoints" type="success">
              路线已绘制
            </el-tag>
            <el-tag v-else type="info" style="margin-left: 8px;">
              仅显示起点/终点
            </el-tag>
          </div>
        </div>
        <div class="map-container" ref="mapContainer"></div>
      </div>
      
      <el-divider />
      
      <el-descriptions title="分配信息" :column="2" border>
        <el-descriptions-item label="分配车辆">
          <span v-if="order.vehicle_plate">{{ order.vehicle_plate }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="分配司机">
          <span v-if="order.driver_name">{{ order.driver_name }} ({{ order.driver_phone }})</span>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <el-descriptions title="时间与费用" :column="3" border>
        <el-descriptions-item label="计划出发时间">{{ formatDate(order.plan_departure_time) }}</el-descriptions-item>
        <el-descriptions-item label="计划到达时间">{{ formatDate(order.plan_arrival_time) }}</el-descriptions-item>
        <el-descriptions-item label="运费金额">¥{{ order.total_fee || 0 }}</el-descriptions-item>
        <el-descriptions-item label="实际出发时间">{{ formatDate(order.actual_departure_time) }}</el-descriptions-item>
        <el-descriptions-item label="实际到达时间">{{ formatDate(order.actual_arrival_time) }}</el-descriptions-item>
        <el-descriptions-item label="运输里程">{{ order.total_distance ? order.total_distance + ' km' : '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <h4 style="margin-bottom: 16px;">货物信息</h4>
      <el-table :data="order.cargo || []" style="width: 100%">
        <el-table-column prop="cargo_name" label="货物名称" width="150" />
        <el-table-column prop="cargo_type" label="货物类型" width="120">
          <template #default="{ row }">
            {{ row.cargo_type === 'normal' ? '普通货物' : row.cargo_type === 'fragile' ? '易碎品' : row.cargo_type === 'cold' ? '冷藏品' : '危险品' }}
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="重量(kg)" width="100" />
        <el-table-column prop="volume" label="体积(m³)" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="packaging" label="包装方式" width="120" />
        <el-table-column prop="special_requirements" label="特殊要求" />
      </el-table>
      
      <el-divider v-if="order.statusLogs && order.statusLogs.length > 0" />
      
      <h4 style="margin-bottom: 16px;" v-if="order.statusLogs && order.statusLogs.length > 0">状态流转记录</h4>
      <el-timeline v-if="order.statusLogs && order.statusLogs.length > 0">
        <el-timeline-item
          v-for="(log, index) in order.statusLogs.slice().reverse()"
          :key="log.id"
          :type="index === 0 ? 'primary' : ''"
          :timestamp="formatDate(log.created_at)"
          placement="top"
        >
          <el-card>
            <template #header>
              <div class="timeline-header">
                <el-tag :type="getStatusType(log.new_status)">{{ getStatusText(log.new_status) }}</el-tag>
                <span v-if="log.operator_name">操作人: {{ log.operator_name }}</span>
              </div>
            </template>
            <p v-if="log.remark">{{ log.remark }}</p>
            <p v-else class="empty-tip">无备注</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
    
    <el-dialog
      v-model="assignDialogVisible"
      title="分配车辆和司机"
      width="500px"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="选择车辆" required>
          <el-select v-model="assignForm.vehicle_id" placeholder="请选择车辆" style="width: 100%" @change="handleVehicleChange">
            <el-option
              v-for="item in idleVehicles"
              :key="item.id"
              :label="`${item.plate_number} - ${item.vehicle_type}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择司机" required>
          <el-select v-model="assignForm.driver_id" placeholder="请选择司机" style="width: 100%">
            <el-option
              v-for="item in idleDrivers"
              :key="item.id"
              :label="`${item.real_name} - ${item.phone}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign" :loading="submitLoading">确认分配</el-button>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="startDialogVisible"
      title="订单执行操作"
      width="400px"
    >
      <el-form :model="startForm" label-width="100px">
        <el-form-item label="操作类型">
          <el-radio-group v-model="startForm.status">
            <el-radio value="loading" v-if="order.status === 'planned'">开始装货</el-radio>
            <el-radio value="transit" v-if="order.status === 'loading'">开始运输</el-radio>
            <el-radio value="unloading" v-if="order.status === 'transit'">开始卸货</el-radio>
            <el-radio value="completed" v-if="order.status === 'unloading'">完成订单</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="startDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStart" :loading="submitLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getOrderDetail, reviewOrder, assignOrder, startOrder, cancelOrder } from '@/api/orders'
import { getIdleVehicles } from '@/api/vehicles'
import { getIdleDrivers } from '@/api/drivers'
import { getBatchDict } from '@/api/dictionary'
import { getOrderTrack } from '@/api/gps'

const router = useRouter()
const route = useRoute()

const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const routeLine = ref(null)

const order = ref({})
const orderStatusMap = ref({})
const idleVehicles = ref([])
const idleDrivers = ref([])
const submitLoading = ref(false)
const assignDialogVisible = ref(false)
const startDialogVisible = ref(false)
const trackPoints = ref([])

const assignForm = reactive({
  vehicle_id: '',
  driver_id: ''
})

const startForm = reactive({
  status: ''
})

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const attribution = '&copy; OpenStreetMap contributors'

const hasRoutePoints = computed(() => {
  return order.value.origin_lat != null && order.value.origin_lng != null &&
         order.value.dest_lat != null && order.value.dest_lng != null
})

const hasValidRoutePoints = computed(() => {
  return trackPoints.value.length >= 2
})

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    reviewed: 'info',
    planned: 'primary',
    loading: 'warning',
    transit: 'success',
    unloading: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  return orderStatusMap.value[status] || status
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const createStartIcon = () => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15" fill="#67c23a" stroke="white" stroke-width="3"/>
      <text x="18" y="23" text-anchor="middle" fill="white" font-size="14" font-weight="bold">起</text>
    </svg>
  `
  return L.divIcon({
    html: svgString,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
    className: 'start-marker'
  })
}

const createEndIcon = () => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15" fill="#f56c6c" stroke="white" stroke-width="3"/>
      <text x="18" y="23" text-anchor="middle" fill="white" font-size="14" font-weight="bold">终</text>
    </svg>
  `
  return L.divIcon({
    html: svgString,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
    className: 'end-marker'
  })
}

const createPointIcon = (index) => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="#409eff" stroke="white" stroke-width="2"/>
    </svg>
  `
  return L.divIcon({
    html: svgString,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: 'point-marker'
  })
}

const initMap = () => {
  if (!mapContainer.value) return
  
  if (map.value) {
    map.value.remove()
    map.value = null
  }
  
  map.value = L.map(mapContainer.value).setView([39.9042, 116.4074], 11)
  
  L.tileLayer(tileUrl, {
    attribution: attribution,
    maxZoom: 19
  }).addTo(map.value)
}

const clearMap = () => {
  if (!map.value) return
  
  markers.value.forEach(marker => {
    map.value.removeLayer(marker)
  })
  markers.value = []
  
  if (routeLine.value) {
    map.value.removeLayer(routeLine.value)
    routeLine.value = null
  }
}

const drawRoute = async () => {
  if (!map.value || !hasRoutePoints.value) return
  
  clearMap()
  
  const origin = [order.value.origin_lat, order.value.origin_lng]
  const dest = [order.value.dest_lat, order.value.dest_lng]
  
  if (trackPoints.value.length >= 2) {
    const validPoints = trackPoints.value.filter(p => p.latitude != null && p.longitude != null)
    
    if (validPoints.length >= 2) {
      const latLngs = validPoints.map(p => [p.latitude, p.longitude])
      
      routeLine.value = L.polyline(latLngs, {
        color: '#409eff',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(map.value)
      
      for (let i = 1; i < validPoints.length - 1; i++) {
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
            速度: ${point.speed || 0} km/h
          </div>
        `)
        marker.addTo(map.value)
        markers.value.push(marker)
      }
    }
  }
  
  const originMarker = L.marker(origin, { icon: createStartIcon() })
  originMarker.bindPopup(`
    <div>
      <strong>起点</strong><br/>
      地址: ${order.value.origin_address}<br/>
      经度: ${order.value.origin_lng}<br/>
      纬度: ${order.value.origin_lat}
    </div>
  `)
  originMarker.addTo(map.value)
  markers.value.push(originMarker)
  
  const endMarker = L.marker(dest, { icon: createEndIcon() })
  endMarker.bindPopup(`
    <div>
      <strong>终点</strong><br/>
      地址: ${order.value.dest_address}<br/>
      经度: ${order.value.dest_lng}<br/>
      纬度: ${order.value.dest_lat}
    </div>
  `)
  endMarker.addTo(map.value)
  markers.value.push(endMarker)
  
  if (trackPoints.value.length >= 2 && routeLine.value) {
    map.value.fitBounds(routeLine.value.getBounds(), {
      padding: [50, 50]
    })
  } else {
    map.value.fitBounds([origin, dest], {
      padding: [50, 50]
    })
  }
}

const fetchTrackData = async () => {
  if (!route.params.id) return
  
  try {
    const res = await getOrderTrack(route.params.id)
    trackPoints.value = res?.tracks || res || []
  } catch (error) {
    console.error('获取订单轨迹失败:', error)
  }
}

const goBack = () => {
  router.back()
}

const editOrder = () => {
  router.push(`/orders/${route.params.id}/edit`)
}

const fetchOrderDetail = async () => {
  try {
    const res = await getOrderDetail(route.params.id)
    order.value = res
  } catch (error) {
    console.error('获取订单详情失败:', error)
  }
}

const fetchDictData = async () => {
  try {
    const res = await getBatchDict(['order_status'])
    if (res.order_status) {
      res.order_status.forEach(item => {
        orderStatusMap.value[item.dict_key] = item.dict_value
      })
    }
  } catch (error) {
    console.error('获取字典数据失败:', error)
  }
}

const fetchIdleResources = async () => {
  try {
    const [vehiclesRes, driversRes] = await Promise.all([
      getIdleVehicles(),
      getIdleDrivers()
    ])
    idleVehicles.value = vehiclesRes || []
    idleDrivers.value = driversRes || []
  } catch (error) {
    console.error('获取空闲资源失败:', error)
  }
}

const doReviewOrder = async () => {
  await ElMessageBox.confirm('确定要审核通过该订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  await reviewOrder(order.value.id, {})
  ElMessage.success('审核成功')
  fetchOrderDetail()
}

const openAssignDialog = () => {
  assignForm.vehicle_id = order.value.vehicle_id || ''
  assignForm.driver_id = order.value.driver_id || ''
  fetchIdleResources()
  assignDialogVisible.value = true
}

const handleVehicleChange = (vehicleId) => {
  const vehicle = idleVehicles.value.find(v => v.id === vehicleId)
  if (vehicle?.driver_id) {
    assignForm.driver_id = vehicle.driver_id
  }
}

const submitAssign = async () => {
  if (!assignForm.vehicle_id || !assignForm.driver_id) {
    ElMessage.warning('请选择车辆和司机')
    return
  }
  
  submitLoading.value = true
  try {
    await assignOrder(order.value.id, {
      vehicle_id: assignForm.vehicle_id,
      driver_id: assignForm.driver_id
    })
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    fetchOrderDetail()
  } catch (error) {
    console.error('分配失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const openStartDialog = () => {
  const statusMap = {
    planned: 'loading',
    loading: 'transit',
    transit: 'unloading',
    unloading: 'completed'
  }
  startForm.status = statusMap[order.value.status]
  startDialogVisible.value = true
}

const submitStart = async () => {
  submitLoading.value = true
  try {
    await startOrder(order.value.id, { status: startForm.status })
    ElMessage.success('操作成功')
    startDialogVisible.value = false
    fetchOrderDetail()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const doCancelOrder = async () => {
  await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  await cancelOrder(order.value.id, {})
  ElMessage.success('取消成功')
  fetchOrderDetail()
}

watch(hasRoutePoints, () => {
  if (hasRoutePoints.value && map.value) {
    nextTick(() => {
      drawRoute()
    })
  }
})

onMounted(() => {
  fetchDictData()
  fetchOrderDetail()
  fetchTrackData()
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
.order-detail {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-tip {
  color: #909399;
}

.map-section {
  margin-top: 16px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: bold;
}

.map-container {
  height: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.start-marker),
:deep(.end-marker),
:deep(.point-marker) {
  background: transparent;
  border: none;
}
</style>
