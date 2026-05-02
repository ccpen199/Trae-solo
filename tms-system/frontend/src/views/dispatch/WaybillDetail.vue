<template>
  <div class="page-container">
    <el-page-header @back="goBack" :content="waybill?.waybill_no || '运单详情'" />
    <div v-if="waybill" class="waybill-detail">
      <div class="detail-section">
        <div class="section-title">运单信息</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">运单号</span>
            <span class="value">{{ waybill.waybill_no }}</span>
          </div>
          <div class="detail-item">
            <span class="label">状态</span>
            <el-tag :type="getStatusType(waybill.status)">{{ getStatusText(waybill.status) }}</el-tag>
          </div>
          <div class="detail-item">
            <span class="label">车牌号</span>
            <span class="value">{{ waybill.vehicle_no }}</span>
          </div>
          <div class="detail-item">
            <span class="label">司机</span>
            <span class="value">{{ waybill.driver_name }} {{ waybill.driver_phone }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">运输进度</div>
        <el-steps :active="currentStep" align-center>
          <el-step title="已分配" :description="waybill.assigned_at" />
          <el-step title="已接单" :description="waybill.accepted_at" />
          <el-step title="已提货" :description="waybill.picked_up_at" />
          <el-step title="已出发" :description="waybill.departed_at" />
          <el-step title="运输中" :description="waybill.in_transit_at" />
          <el-step title="已到达" :description="waybill.arrived_at" />
          <el-step title="已签收" :description="waybill.signed_at" />
        </el-steps>
      </div>

      <div class="detail-section">
        <div class="section-title">当前位置</div>
        <div class="current-location">
          <div v-if="waybill.current_location">
            <p>{{ waybill.current_location.address }}</p>
            <p class="text-secondary">速度: {{ waybill.current_location.speed }} km/h</p>
          </div>
          <div v-else class="text-secondary">暂无位置信息</div>
        </div>
      </div>

      <div class="detail-section" v-if="waybill.exception">
        <div class="section-title" style="color: #f56c6c">异常信息</div>
        <el-alert type="error" :closable="false">
          <template #title>
            {{ waybill.exception.type }} - {{ waybill.exception.description }}
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { waybillApi } from '@/api'

const router = useRouter()
const route = useRoute()
const waybill = ref(null)
let refreshTimer = null

const statusOrder = ['CREATED', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'SIGNED', 'COMPLETED']
const currentStep = computed(() => {
  if (!waybill.value) return 0
  const index = statusOrder.indexOf(waybill.value.status)
  return index >= 0 ? index : 0
})

onMounted(() => {
  fetchWaybill()
  refreshTimer = setInterval(fetchWaybill, 10000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

async function fetchWaybill() {
  try {
    waybill.value = await waybillApi.detail(route.params.id)
  } catch (error) {
    console.error('获取运单详情失败', error)
  }
}

function goBack() {
  router.back()
}

function getStatusType(status) {
  const types = {
    CREATED: 'info', ASSIGNED: 'info', ACCEPTED: 'info',
    PICKED_UP: 'primary', DEPARTED: 'primary', IN_TRANSIT: 'success',
    ARRIVED: 'warning', SIGNED: 'success', COMPLETED: 'success'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    CREATED: '已创建', ASSIGNED: '已分配', ACCEPTED: '已接单',
    PICKED_UP: '已提货', DEPARTED: '已出发', IN_TRANSIT: '运输中',
    ARRIVED: '已到达', SIGNED: '已签收', COMPLETED: '已完成'
  }
  return texts[status] || status
}
</script>

<style lang="scss" scoped>
.current-location {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.text-secondary {
  color: #909399;
  font-size: 12px;
}
</style>
