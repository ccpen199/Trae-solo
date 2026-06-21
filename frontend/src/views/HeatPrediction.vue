<template>
  <div class="heat-page">
    <van-nav-bar
      title="服务热度预测"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div class="page-content">
      <div class="date-selector card">
        <van-datetime-picker
          v-model="currentDate"
          type="date"
          :show-toolbar="false"
          title="选择日期"
        />
      </div>

      <div class="outlet-tabs">
        <div 
          v-for="outlet in heatData" 
          :key="outlet.outlet_id"
          class="outlet-tab"
          :class="{ active: selectedOutlet === outlet.outlet_id }"
          @click="selectedOutlet = outlet.outlet_id"
        >
          {{ outlet.outlet_name }}
        </div>
      </div>

      <div class="chart-section card" v-if="currentOutlet">
        <div class="section-title">{{ currentOutlet.outlet_name }} - 今日热度</div>
        <div class="heat-chart">
          <div 
            v-for="slot in currentOutlet.time_slots" 
            :key="slot.time_slot"
            class="chart-item"
          >
            <div class="bar-group">
              <div class="bar-item">
                <div 
                  class="bar predicted"
                  :style="{ height: getBarHeight(slot.predicted_count) + '%' }"
                ></div>
                <span class="bar-label">预测</span>
              </div>
              <div class="bar-item">
                <div 
                  class="bar actual"
                  :style="{ height: getBarHeight(slot.actual_count) + '%' }"
                ></div>
                <span class="bar-label">实际</span>
              </div>
            </div>
            <div class="slot-label">{{ slot.time_slot.split('-')[0] }}</div>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-color predicted"></span>
            预测人数
          </span>
          <span class="legend-item">
            <span class="legend-color actual"></span>
            实际人数
          </span>
        </div>
      </div>

      <div class="summary-card card" v-if="currentOutlet">
        <div class="section-title">统计摘要</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">{{ currentOutlet.total_predicted }}</div>
            <div class="summary-label">预测总人数</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ currentOutlet.total_actual }}</div>
            <div class="summary-label">实际总人数</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ getSuggestedWindows() }}</div>
            <div class="summary-label">建议窗口数</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ getPeakTime() }}</div>
            <div class="summary-label">高峰时段</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHeatPrediction } from '../api/admin'

const router = useRouter()

const currentDate = ref(new Date())
const heatData = ref([])
const selectedOutlet = ref(null)

const currentOutlet = computed(() => {
  return heatData.value.find(o => o.outlet_id === selectedOutlet.value)
})

function onBack() {
  router.back()
}

async function loadData() {
  try {
    const dateStr = new Date().toISOString().split('T')[0]
    const data = await getHeatPrediction({ date: dateStr })
    heatData.value = data || []
    if (heatData.value.length > 0) {
      selectedOutlet.value = heatData.value[0].outlet_id
    }
  } catch (e) {
    console.error(e)
  }
}

function getBarHeight(count) {
  if (!count) return 10
  return Math.min(100, (count / 60) * 100)
}

function getSuggestedWindows() {
  if (!currentOutlet.value?.time_slots?.length) return 0
  const slots = currentOutlet.value.time_slots
  return Math.max(...slots.map(s => s.suggested_windows || 0))
}

function getPeakTime() {
  if (!currentOutlet.value?.time_slots?.length) return '-'
  const slots = currentOutlet.value.time_slots
  const max = Math.max(...slots.map(s => s.predicted_count || 0))
  const peak = slots.find(s => s.predicted_count === max)
  return peak?.time_slot?.split('-')[0] || '-'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.heat-page {
  min-height: 100vh;
  background: #f5f7fa;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-content {
  padding: 12px;
}

.outlet-tabs {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding: 12px 0;
  margin-bottom: 12px;
}

.outlet-tab {
  flex-shrink: 0;
  padding: 8px 16px;
  background: #fff;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  border: 2px solid transparent;
}

.outlet-tab.active {
  background: #e3f2fd;
  color: #1976d2;
  border-color: #1976d2;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.heat-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
  padding: 0 4px;
}

.chart-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-group {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 140px;
  margin-bottom: 10px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar {
  width: 18px;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s;
}

.bar.predicted {
  background: linear-gradient(180deg, #64b5f6, #1976d2);
}

.bar.actual {
  background: linear-gradient(180deg, #81c784, #43a047);
}

.bar-label {
  font-size: 10px;
  color: #999;
  margin-top: 6px;
}

.slot-label {
  font-size: 11px;
  color: #666;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.predicted {
  background: #1976d2;
}

.legend-color.actual {
  background: #43a047;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 6px;
}

.summary-label {
  font-size: 13px;
  color: #999;
}

.date-selector {
  :deep(.van-picker) {
    background: transparent;
  }
}
</style>
