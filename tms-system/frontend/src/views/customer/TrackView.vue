<template>
  <div class="page-container">
    <h2>订单追踪</h2>
    <el-card v-if="trackInfo">
      <div class="track-header">
        <div class="track-status">
          <el-tag type="success" size="large">{{ getStatusText(trackInfo.status) }}</el-tag>
        </div>
        <div class="track-info">
          <p>{{ trackInfo.vehicle_no }} - {{ trackInfo.driver_name }}</p>
          <p>{{ trackInfo.driver_phone }}</p>
        </div>
      </div>
      <el-divider />
      <div class="current-location">
        <p class="label">当前位置</p>
        <p class="address">{{ trackInfo.current_location?.address || '暂无位置' }}</p>
      </div>
      <el-divider />
      <div class="timeline">
        <div v-for="item in trackInfo.timeline" :key="item.time" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <p class="title">{{ item.title }}</p>
            <p class="time">{{ item.time }}</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { customerApi } from '@/api'

const route = useRoute()
const trackInfo = ref(null)
let timer = null

onMounted(() => {
  fetchTrack()
  timer = setInterval(fetchTrack, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function fetchTrack() {
  try {
    trackInfo.value = await customerApi.track(route.params.id)
  } catch (error) {
    console.error('获取追踪信息失败', error)
  }
}

function getStatusText(status) {
  const texts = { CREATED: '已创建', ASSIGNED: '已分配', ACCEPTED: '已接单', PICKED_UP: '已提货', DEPARTED: '已出发', IN_TRANSIT: '运输中', ARRIVED: '已到达', SIGNED: '已签收', COMPLETED: '已完成' }
  return texts[status] || status
}
</script>

<style lang="scss" scoped>
.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.track-info {
  text-align: right;
}

.current-location {
  padding: 16px 0;
  .label { font-size: 12px; color: #909399; }
  .address { font-size: 16px; margin-top: 8px; }
}

.timeline {
  .timeline-item {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    position: relative;
    &:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 28px;
      bottom: 0;
      width: 2px;
      background: #dcdfe6;
    }
    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #409eff;
      margin-top: 4px;
      flex-shrink: 0;
    }
    .timeline-content {
      .title { font-weight: 500; }
      .time { font-size: 12px; color: #909399; margin-top: 4px; }
    }
  }
}
</style>
