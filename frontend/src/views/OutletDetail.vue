<template>
  <div class="outlet-detail">
    <van-nav-bar
      title="网点详情"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div v-if="outlet" class="page-content">
      <div class="outlet-header card">
        <div class="outlet-name">{{ outlet.name }}</div>
        <div class="outlet-rating">
          <van-icon name="star-o" color="#ff9800" />
          <span>{{ outlet.rating }}分</span>
          <span class="divider">|</span>
          <span>{{ outlet.window_count }}个服务窗口</span>
        </div>
        <div class="outlet-address">
          <van-icon name="location-o" />
          <span>{{ outlet.address }}</span>
        </div>
        <div class="outlet-time">
          <van-icon name="clock-o" />
          <span>营业时间：{{ outlet.open_time }} - {{ outlet.close_time }}</span>
        </div>
      </div>

      <div class="action-btns card">
        <div class="action-btn" @click="navigate">
          <van-icon name="location-o" size="24" />
          <span>AR导航</span>
        </div>
        <div class="action-btn" @click="callOutlet">
          <van-icon name="phone-o" size="24" />
          <span>电话咨询</span>
        </div>
        <div class="action-btn" @click="bookNow">
          <van-icon name="calendar-o" size="24" />
          <span>立即预约</span>
        </div>
      </div>

      <div class="wait-time card">
        <div class="section-title">实时排队</div>
        <div class="wait-stats">
          <div class="stat-item">
            <div class="stat-number">{{ waitData.total_queue || 0 }}</div>
            <div class="stat-label">当前排队</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ waitData.avg_wait_time || 0 }}分钟</div>
            <div class="stat-label">平均等待</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ waitData.open_windows || 0 }}</div>
            <div class="stat-label">开放窗口</div>
          </div>
        </div>
      </div>

      <div class="heat-prediction card">
        <div class="section-title">今日热度预测</div>
        <div class="heat-chart">
          <div 
            v-for="pred in outlet.predictions" 
            :key="pred.time_slot"
            class="heat-bar"
          >
            <div class="bar-label">{{ pred.time_slot.split('-')[0] }}</div>
            <div class="bar-wrapper">
              <div 
                class="bar-fill"
                :class="getHeatLevel(pred.predicted_count)"
                :style="{ height: getBarHeight(pred.predicted_count) + '%' }"
              ></div>
            </div>
            <div class="bar-value">{{ pred.predicted_count || 0 }}人</div>
          </div>
        </div>
        <div class="heat-legend">
          <span class="legend-item low">空闲</span>
          <span class="legend-item medium">一般</span>
          <span class="legend-item high">繁忙</span>
        </div>
      </div>

      <div class="service-types card">
        <div class="section-title">可办理业务</div>
        <div class="type-list">
          <span 
            v-for="type in outlet.service_types" 
            :key="type"
            class="type-tag"
          >
            {{ type }}
          </span>
        </div>
      </div>

      <div class="windows card">
        <div class="section-title">窗口情况</div>
        <div class="window-grid">
          <div 
            v-for="win in outlet.windows" 
            :key="win.id"
            class="window-item"
            :class="{ open: win.is_open }"
          >
            <div class="window-no">{{ win.window_no }}</div>
            <div class="window-type">{{ win.service_type }}</div>
            <div class="window-queue">{{ win.current_queue }}人排队</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <van-button block type="primary" size="large" @click="bookNow">
        预约办理
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getOutletDetail, getWaitTime } from '../api/outlets'

const route = useRoute()
const router = useRouter()

const outlet = ref(null)
const waitData = ref({})

function onBack() {
  router.back()
}

async function loadDetail() {
  try {
    const data = await getOutletDetail(route.params.id)
    outlet.value = data
  } catch (e) {
    console.error(e)
  }
}

async function loadWaitTime() {
  try {
    const data = await getWaitTime(route.params.id)
    waitData.value = data
  } catch (e) {
    console.error(e)
  }
}

function navigate() {
  showToast('AR实景导航启动中...')
}

function callOutlet() {
  showToast('正在拨打服务热线...')
}

function bookNow() {
  router.push({
    path: '/outlets/appointment',
    query: { outletId: route.params.id }
  })
}

function getHeatLevel(count) {
  if (!count) return 'low'
  if (count < 30) return 'low'
  if (count < 50) return 'medium'
  return 'high'
}

function getBarHeight(count) {
  if (!count) return 10
  return Math.min(100, Math.max(10, (count / 60) * 100))
}

onMounted(() => {
  loadDetail()
  loadWaitTime()
})
</script>

<style scoped>
.outlet-detail {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 70px;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-content {
  padding: 12px;
}

.outlet-header {
  padding: 20px;
  margin-bottom: 12px;
}

.outlet-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
}

.outlet-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  margin-bottom: 14px;
  
  .divider {
    color: #ddd;
  }
}

.outlet-address,
.outlet-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.action-btns {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  margin-bottom: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #1976d2;
  font-size: 13px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.wait-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.heat-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 160px;
  padding: 0 8px;
}

.heat-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.bar-wrapper {
  width: 24px;
  height: 100px;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.3s;
}

.bar-fill.low {
  background: linear-gradient(180deg, #81c784, #43a047);
}

.bar-fill.medium {
  background: linear-gradient(180deg, #ffb74d, #ff9800);
}

.bar-fill.high {
  background: linear-gradient(180deg, #e57373, #e53935);
}

.bar-value {
  font-size: 11px;
  color: #666;
  margin-top: 8px;
}

.heat-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
}

.legend-item {
  font-size: 12px;
  color: #999;
  padding-left: 14px;
  position: relative;
}

.legend-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-item.low::before {
  background: #43a047;
}

.legend-item.medium::before {
  background: #ff9800;
}

.legend-item.high::before {
  background: #e53935;
}

.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-tag {
  padding: 6px 14px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 13px;
  border-radius: 16px;
}

.window-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.window-item {
  padding: 14px 8px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
  opacity: 0.5;
}

.window-item.open {
  background: #e8f5e9;
  opacity: 1;
}

.window-no {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.window-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.window-queue {
  font-size: 11px;
  color: #ff9800;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}
</style>
