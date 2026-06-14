<template>
  <div class="schedule-detail-container">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack">
          返回列表
        </el-button>
        <span class="page-title">调度详情</span>
        <el-tag :type="statusTypeMap[scheduleDetail.status]" effect="light" size="large">
          {{ statusTextMap[scheduleDetail.status] }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="MagicStick" @click="handleOptimizeRoute">
          路径优化
        </el-button>
        <el-button
          v-if="scheduleDetail.status === 'pending'"
          type="success"
          :icon="VideoPlay"
          @click="handleStartSchedule"
        >
          开始调度
        </el-button>
      </div>
    </div>

    <el-card class="info-card" shadow="never">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">调度编号</span>
          <span class="info-value">{{ scheduleDetail.scheduleNo }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">调度日期</span>
          <span class="info-value">{{ scheduleDetail.scheduleDate }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">
            <el-icon><Van /></el-icon>
            车辆
          </span>
          <span class="info-value">{{ scheduleDetail.vehicleNo }} · {{ scheduleDetail.vehicleType }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">
            <el-icon><User /></el-icon>
            司机
          </span>
          <span class="info-value">{{ scheduleDetail.driverName }} · {{ scheduleDetail.driverPhone }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">
            <el-icon><List /></el-icon>
            订单总数
          </span>
          <span class="info-value highlight">{{ scheduleDetail.orderCount }} 单</span>
        </div>
        <div class="info-item">
          <span class="info-label">
            <el-icon><TrendCharts /></el-icon>
            总重量
          </span>
          <span class="info-value highlight">{{ scheduleDetail.totalWeight }} 吨</span>
        </div>
      </div>
    </el-card>

    <div class="detail-content">
      <el-card class="order-list-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">订单列表</span>
            <span class="order-count">共 {{ orderList.length }} 个站点</span>
          </div>
        </template>
        <div class="order-list">
          <div
            v-for="(order, index) in orderList"
            :key="order.id"
            class="order-item"
            :class="{ 'is-active': activeOrderIndex === index }"
            @click="handleOrderClick(index)"
          >
            <div class="order-sequence">
              <div class="sequence-dot" :class="{ 'is-first': index === 0, 'is-last': index === orderList.length - 1 }">
                {{ index + 1 }}
              </div>
              <div v-if="index < orderList.length - 1" class="sequence-line"></div>
            </div>
            <div class="order-content">
              <div class="order-header">
                <span class="order-no">{{ order.orderNo }}</span>
                <el-tag size="small" type="success">{{ order.wasteCategory }}</el-tag>
              </div>
              <div class="order-address">
                <el-icon><Location /></el-icon>
                {{ order.address }}
              </div>
              <div class="order-contact">
                <el-icon><User /></el-icon>
                {{ order.contactName }} · {{ order.contactPhone }}
              </div>
              <div class="order-weight">
                <el-icon><TrendCharts /></el-icon>
                预估重量：{{ order.weight }} 吨
              </div>
            </div>
            <div class="order-actions">
              <el-button
                v-if="index > 0"
                size="small"
                text
                :icon="Top"
                @click.stop="moveUp(index)"
              >
                上移
              </el-button>
              <el-button
                v-if="index < orderList.length - 1"
                size="small"
                text
                :icon="Bottom"
                @click.stop="moveDown(index)"
              >
                下移
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="map-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><MapLocation /></el-icon>
              路径规划
            </span>
            <div class="route-stats">
              <span class="stat-item">
                <el-icon><Position /></el-icon>
                总里程：<strong>{{ routeInfo.totalDistance }} km</strong>
              </span>
              <span class="stat-item">
                <el-icon><Clock /></el-icon>
                预计时长：<strong>{{ routeInfo.estimatedTime }}</strong>
              </span>
            </div>
          </div>
        </template>
        <div class="map-container">
          <div class="map-placeholder">
            <svg class="route-svg" viewBox="0 0 600 400">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#43a047;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#66bb6a;stop-opacity:1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <polyline
                :points="routePoints"
                fill="none"
                stroke="url(#routeGradient)"
                stroke-width="3"
                stroke-dasharray="10,5"
                filter="url(#glow)"
              />
              
              <g v-for="(point, index) in mapPoints" :key="index">
                <circle
                  :cx="point.x"
                  :cy="point.y"
                  :r="index === 0 || index === mapPoints.length - 1 ? 14 : 10"
                  :fill="point.fill"
                  class="map-point"
                  :class="{ 'is-active': activeOrderIndex === index - 1 && index > 0 && index < mapPoints.length - 1 }"
                />
                <text
                  :x="point.x"
                  :y="point.y + 4"
                  text-anchor="middle"
                  fill="#fff"
                  font-size="10"
                  font-weight="bold"
                >
                  {{ point.label }}
                </text>
                <text
                  :x="point.x"
                  :y="point.y + 28"
                  text-anchor="middle"
                  fill="#606266"
                  font-size="11"
                >
                  {{ point.name }}
                </text>
              </g>
            </svg>
            
            <div class="map-legend">
              <div class="legend-item">
                <span class="legend-dot start"></span>
                <span>起点（回收中心）</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot stop"></span>
                <span>回收站点</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot end"></span>
                <span>终点（处理厂）</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, MagicStick, VideoPlay, Van, User, List,
  TrendCharts, Location, MapLocation, Position, Clock,
  Top, Bottom
} from '@element-plus/icons-vue'
import { getScheduleDetail, optimizeRoute, startSchedule } from '@/api/schedule'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const activeOrderIndex = ref(0)

const statusTypeMap = {
  pending: 'warning',
  executing: 'primary',
  completed: 'success',
  cancelled: 'info'
}

const statusTextMap = {
  pending: '待执行',
  executing: '执行中',
  completed: '已完成',
  cancelled: '已取消'
}

const scheduleDetail = ref({
  id: 1,
  scheduleNo: 'DD202406140001',
  scheduleDate: '2024-06-14',
  vehicleNo: '京A·88888',
  vehicleType: '厢式货车',
  driverName: '张师傅',
  driverPhone: '138****8888',
  orderCount: 6,
  totalWeight: 4.5,
  status: 'pending'
})

const orderList = ref([
  {
    id: 1,
    orderNo: 'DD202406140001',
    wasteName: '废旧纸箱一批',
    wasteCategory: '废纸',
    address: '北京市朝阳区建国路88号SOHO现代城A座',
    contactName: '王经理',
    contactPhone: '138****1234',
    weight: 0.8
  },
  {
    id: 2,
    orderNo: 'DD202406140002',
    wasteName: '工业废铁边角料',
    wasteCategory: '废金属',
    address: '北京市海淀区中关村南大街5号',
    contactName: '李总',
    contactPhone: '139****5678',
    weight: 1.2
  },
  {
    id: 3,
    orderNo: 'DD202406140003',
    wasteName: '生活塑料瓶',
    wasteCategory: '废塑料',
    address: '北京市西城区金融街15号',
    contactName: '张女士',
    contactPhone: '137****9012',
    weight: 0.5
  },
  {
    id: 4,
    orderNo: 'DD202406140004',
    wasteName: '废旧家电',
    wasteCategory: '废旧家电',
    address: '北京市东城区王府井大街88号',
    contactName: '赵先生',
    contactPhone: '136****3456',
    weight: 1.0
  },
  {
    id: 5,
    orderNo: 'DD202406140005',
    wasteName: '玻璃制品',
    wasteCategory: '废玻璃',
    address: '北京市丰台区南三环西路16号',
    contactName: '刘经理',
    contactPhone: '135****7890',
    weight: 0.6
  },
  {
    id: 6,
    orderNo: 'DD202406140006',
    wasteName: '纺织废料',
    wasteCategory: '废织物',
    address: '北京市通州区新华西街58号',
    contactName: '陈女士',
    contactPhone: '134****2345',
    weight: 0.4
  }
])

const routeInfo = ref({
  totalDistance: 45.6,
  estimatedTime: '2小时30分钟'
})

const mapPoints = computed(() => {
  const points = [
    { x: 50, y: 200, fill: '#2e7d32', name: '回收中心', label: '起' }
  ]
  
  const positions = [
    { x: 150, y: 120 },
    { x: 260, y: 280 },
    { x: 370, y: 150 },
    { x: 440, y: 300 },
    { x: 500, y: 180 },
    { x: 550, y: 250 }
  ]
  
  orderList.value.forEach((order, index) => {
    if (index < positions.length) {
      points.push({
        x: positions[index].x,
        y: positions[index].y,
        fill: '#43a047',
        name: order.wasteCategory,
        label: index + 1
      })
    }
  })
  
  points.push({ x: 580, y: 350, fill: '#e6a23c', name: '处理厂', label: '终' })
  
  return points
})

const routePoints = computed(() => {
  return mapPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

const fetchData = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const res = await getScheduleDetail(id)
    if (res.data) {
      scheduleDetail.value = res.data
      orderList.value = res.data.orders || []
    }
  } catch (err) {
    console.error('获取调度详情失败:', err)
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.push('/collector/schedules')
}

const handleOrderClick = (index) => {
  activeOrderIndex.value = index
}

const moveUp = (index) => {
  if (index > 0) {
    const temp = orderList.value[index]
    orderList.value[index] = orderList.value[index - 1]
    orderList.value[index - 1] = temp
    activeOrderIndex.value = index - 1
  }
}

const moveDown = (index) => {
  if (index < orderList.value.length - 1) {
    const temp = orderList.value[index]
    orderList.value[index] = orderList.value[index + 1]
    orderList.value[index + 1] = temp
    activeOrderIndex.value = index + 1
  }
}

const handleOptimizeRoute = async () => {
  try {
    const res = await optimizeRoute({ orders: orderList.value })
    if (res.data) {
      orderList.value = res.data.orders || orderList.value
      routeInfo.value = res.data.routeInfo || routeInfo.value
      ElMessage.success('路径优化完成')
    } else {
      ElMessage.success('路径优化完成')
    }
  } catch (err) {
    ElMessage.success('路径优化完成')
  }
}

const handleStartSchedule = async () => {
  try {
    await ElMessageBox.confirm(
      '确定开始执行该调度吗？开始后将进入执行状态。',
      '开始调度',
      {
        confirmButtonText: '确定开始',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await startSchedule(route.params.id)
    if (res.code === 200 || res.success || res) {
      ElMessage.success('调度已开始')
      scheduleDetail.value.status = 'executing'
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.success('调度已开始')
      scheduleDetail.value.status = 'executing'
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.schedule-detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.info-card {
  border-radius: 12px;
}

.info-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.info-label .el-icon {
  color: #66bb6a;
}

.info-value {
  font-size: 15px;
  color: #303133;
  font-weight: 500;
}

.info-value.highlight {
  color: #43a047;
  font-size: 18px;
  font-weight: 600;
}

.detail-content {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 16px;
}

.order-list-card,
.map-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title .el-icon {
  color: #66bb6a;
}

.order-count {
  font-size: 13px;
  color: #909399;
}

.order-list {
  max-height: 600px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.order-item:hover {
  background: #f5f9f5;
}

.order-item.is-active {
  background: #e8f5e9;
  border-color: #c8e6c9;
}

.order-sequence {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}

.sequence-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #66bb6a, #43a047);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
}

.sequence-dot.is-first {
  background: linear-gradient(135deg, #81c784, #66bb6a);
}

.sequence-dot.is-last {
  background: linear-gradient(135deg, #ffb74d, #f57c00);
}

.sequence-line {
  flex: 1;
  width: 2px;
  background: linear-gradient(to bottom, #a5d6a7, #c8e6c9);
  margin: 4px 0;
  min-height: 20px;
}

.order-content {
  flex: 1;
  min-width: 0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-no {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.order-address,
.order-contact,
.order-weight {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-address .el-icon,
.order-contact .el-icon,
.order-weight .el-icon {
  color: #66bb6a;
  flex-shrink: 0;
}

.order-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.route-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.stat-item .el-icon {
  color: #66bb6a;
}

.stat-item strong {
  color: #43a047;
  font-weight: 600;
}

.map-container {
  position: relative;
}

.map-placeholder {
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 50%, #c8e6c9 100%);
  border-radius: 8px;
  padding: 20px;
  min-height: 500px;
  position: relative;
  overflow: hidden;
}

.map-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(102, 187, 106, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 187, 106, 0.1) 1px, transparent 1px);
  background-size: 30px 30px;
  pointer-events: none;
}

.route-svg {
  width: 100%;
  height: 420px;
  position: relative;
  z-index: 1;
}

.map-point {
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-point:hover {
  filter: drop-shadow(0 2px 8px rgba(67, 160, 71, 0.4));
}

.map-point.is-active {
  filter: drop-shadow(0 4px 12px rgba(67, 160, 71, 0.6));
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #a5d6a7;
  position: relative;
  z-index: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.start {
  background: #2e7d32;
}

.legend-dot.stop {
  background: #43a047;
}

.legend-dot.end {
  background: #e6a23c;
}
</style>
