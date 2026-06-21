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
        <van-field
          v-model="dateStr"
          type="date"
          label="选择日期"
          input-align="right"
          @update:model-value="onDateChange"
        />
      </div>

      <van-tabs v-model:active="activeTab" scrollable shrink animated>
        <van-tab
          v-for="outlet in heatData"
          :key="outlet.outlet_id"
          :title="outlet.outlet_name"
          :name="outlet.outlet_id"
        />
      </van-tabs>

      <template v-if="currentOutlet">
        <div class="chart-section card">
          <div class="section-title">{{ currentOutlet.outlet_name }} - 时段热度</div>
          <div class="heat-chart">
            <div
              v-for="slot in currentOutlet.time_slots"
              :key="slot.time_slot"
              class="chart-item"
              :class="{ peak: isPeak(slot) }"
            >
              <div class="bar-group">
                <div class="bar-item">
                  <div
                    class="bar predicted"
                    :class="{ 'peak-bar': isPeak(slot) }"
                    :style="{ height: getBarHeight(slot.predicted_count) + '%' }"
                  ></div>
                  <span class="bar-label">预测</span>
                </div>
                <div class="bar-item">
                  <div
                    class="bar actual"
                    :class="{ 'peak-bar': isPeak(slot) }"
                    :style="{ height: getBarHeight(slot.actual_count) + '%' }"
                  ></div>
                  <span class="bar-label">实际</span>
                </div>
              </div>
              <div class="slot-label">{{ formatSlot(slot.time_slot) }}</div>
              <div v-if="isPeak(slot)" class="peak-badge">高峰</div>
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
            <span class="legend-item">
              <span class="legend-color peak"></span>
              高峰时段
            </span>
          </div>
        </div>

        <div class="table-section card">
          <div class="section-title">详细预测数据</div>
          <div class="table-wrapper">
            <table class="pred-table">
              <thead>
                <tr>
                  <th>时段</th>
                  <th>预测</th>
                  <th>实际</th>
                  <th>偏差</th>
                  <th>建议窗口</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="slot in currentOutlet.time_slots" :key="slot.time_slot">
                  <td>{{ formatSlot(slot.time_slot) }}</td>
                  <td>{{ slot.predicted_count }}</td>
                  <td>{{ slot.actual_count }}</td>
                  <td :class="deviationClass(slot)">{{ deviationPercent(slot) }}</td>
                  <td>{{ slot.suggested_windows }}</td>
                  <td>
                    <van-tag :type="statusType(slot)" size="medium">{{ statusText(slot) }}</van-tag>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="summary-card card">
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
              <div class="summary-value">{{ accuracyRate }}%</div>
              <div class="summary-label">预测准确率</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">{{ peakTime }}</div>
              <div class="summary-label">高峰时段</div>
            </div>
            <div class="summary-item summary-item-wide">
              <div class="summary-value">{{ maxSuggestedWindows }}</div>
              <div class="summary-label">最大建议窗口数</div>
            </div>
          </div>
        </div>

        <div class="action-row">
          <van-button type="primary" block round @click="onGenerate">重新生成预测</van-button>
        </div>
      </template>

      <van-empty v-if="!currentOutlet && !loading" description="暂无预测数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getHeatPrediction, generatePrediction as genPred } from '../api/admin'

const router = useRouter()

const dateStr = ref(new Date().toISOString().split('T')[0])
const heatData = ref([])
const activeTab = ref(null)
const loading = ref(false)

const currentOutlet = computed(() => {
  return heatData.value.find(o => o.outlet_id === activeTab.value) || null
})

const peakThreshold = computed(() => {
  if (!currentOutlet.value?.time_slots?.length) return 0
  const counts = currentOutlet.value.time_slots.map(s => s.predicted_count || 0)
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length
  return avg * 1.3
})

const accuracyRate = computed(() => {
  if (!currentOutlet.value) return 0
  const { total_predicted, total_actual } = currentOutlet.value
  if (!total_predicted || !total_actual) return 0
  return Math.round((1 - Math.abs(total_predicted - total_actual) / total_actual) * 100)
})

const peakTime = computed(() => {
  if (!currentOutlet.value?.time_slots?.length) return '-'
  const slots = currentOutlet.value.time_slots
  const max = Math.max(...slots.map(s => s.predicted_count || 0))
  const peak = slots.find(s => s.predicted_count === max)
  return peak?.time_slot ? formatSlot(peak.time_slot) : '-'
})

const maxSuggestedWindows = computed(() => {
  if (!currentOutlet.value?.time_slots?.length) return 0
  return Math.max(...currentOutlet.value.time_slots.map(s => s.suggested_windows || 0))
})

function onBack() {
  router.back()
}

function onDateChange() {
  loadData()
}

function formatSlot(timeSlot) {
  if (!timeSlot) return ''
  return timeSlot.split('-')[0]
}

function getBarHeight(count) {
  if (!count) return 5
  const max = currentOutlet.value?.time_slots?.length
    ? Math.max(...currentOutlet.value.time_slots.map(s => Math.max(s.predicted_count || 0, s.actual_count || 0)))
    : 60
  if (max === 0) return 5
  return Math.min(100, (count / max) * 100)
}

function isPeak(slot) {
  return (slot.predicted_count || 0) >= peakThreshold.value
}

function deviationPercent(slot) {
  if (!slot.actual_count) return slot.predicted_count ? '+100%' : '0%'
  const diff = slot.predicted_count - slot.actual_count
  const pct = ((diff / slot.actual_count) * 100).toFixed(1)
  return (diff >= 0 ? '+' : '') + pct + '%'
}

function deviationClass(slot) {
  if (!slot.actual_count) return 'dev-high'
  const diff = slot.predicted_count - slot.actual_count
  const pct = Math.abs(diff / slot.actual_count) * 100
  if (pct > 20) return 'dev-high'
  if (pct > 10) return 'dev-mid'
  return 'dev-low'
}

function statusType(slot) {
  if (!slot.actual_count) return 'warning'
  const diff = slot.predicted_count - slot.actual_count
  const pct = Math.abs(diff / slot.actual_count) * 100
  if (pct > 20) return diff > 0 ? 'danger' : 'warning'
  return 'success'
}

function statusText(slot) {
  if (!slot.actual_count) return '偏高'
  const diff = slot.predicted_count - slot.actual_count
  const pct = Math.abs(diff / slot.actual_count) * 100
  if (pct <= 10) return '正常'
  return diff > 0 ? '偏高' : '偏低'
}

async function loadData() {
  loading.value = true
  try {
    const data = await getHeatPrediction({ date: dateStr.value })
    heatData.value = data || []
    if (heatData.value.length > 0 && !heatData.value.find(o => o.outlet_id === activeTab.value)) {
      activeTab.value = heatData.value[0].outlet_id
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function onGenerate() {
  try {
    await genPred({ date: dateStr.value })
    showToast('预测数据已重新生成')
    loadData()
  } catch (e) {
    showToast('生成失败，请重试')
  }
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
  padding-bottom: 30px;
}

.card {
  border-radius: 14px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;
}

.date-selector {
  padding: 0;
  overflow: hidden;
}

.date-selector :deep(.van-cell) {
  background: transparent;
}

.date-selector :deep(.van-field__label) {
  color: #333;
  font-weight: 500;
}

:deep(.van-tabs) {
  margin-bottom: 12px;
}

:deep(.van-tabs__nav) {
  background: #fff;
  border-radius: 14px;
  padding: 0 4px;
}

:deep(.van-tab) {
  font-size: 13px;
  padding: 10px 12px;
}

:deep(.van-tab--active) {
  color: #1976d2;
  font-weight: 600;
}

:deep(.van-tabs__line) {
  background: #1976d2;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.heat-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
  padding: 0 2px;
}

.chart-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.chart-item.peak {
  background: rgba(255, 152, 0, 0.06);
  border-radius: 8px;
  padding: 0 2px;
}

.bar-group {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 140px;
  margin-bottom: 8px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar {
  width: 16px;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s;
}

.bar.predicted {
  background: linear-gradient(180deg, #64b5f6, #1976d2);
}

.bar.actual {
  background: linear-gradient(180deg, #81c784, #43a047);
}

.bar.predicted.peak-bar {
  background: linear-gradient(180deg, #ffb74d, #f57c00);
}

.bar.actual.peak-bar {
  background: linear-gradient(180deg, #ffb74d, #f57c00);
}

.bar-label {
  font-size: 9px;
  color: #999;
  margin-top: 4px;
}

.slot-label {
  font-size: 10px;
  color: #666;
  white-space: nowrap;
}

.peak-badge {
  font-size: 9px;
  color: #f57c00;
  font-weight: 600;
  margin-top: 2px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-color.predicted {
  background: #1976d2;
}

.legend-color.actual {
  background: #43a047;
}

.legend-color.peak {
  background: #f57c00;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.pred-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.pred-table th {
  padding: 10px 6px;
  background: #f8f9fa;
  color: #666;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  border-bottom: 1px solid #f0f0f0;
}

.pred-table td {
  padding: 10px 6px;
  text-align: center;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
  white-space: nowrap;
}

.dev-high {
  color: #e53935;
  font-weight: 600;
}

.dev-mid {
  color: #ff9800;
  font-weight: 500;
}

.dev-low {
  color: #43a047;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.summary-item {
  text-align: center;
  padding: 14px 8px;
  background: #f8f9fa;
  border-radius: 10px;
}

.summary-item-wide {
  grid-column: 1 / -1;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 12px;
  color: #999;
}

.action-row {
  margin-top: 16px;
}
</style>
