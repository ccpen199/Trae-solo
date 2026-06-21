<template>
  <div class="admin-page">
    <van-nav-bar
      title="运营工作台"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div class="page-content">
      <div class="overview-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon user">
              <van-icon name="friends-o" size="22" color="#1976d2" />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.user_count || 0 }}</div>
              <div class="stat-label">注册用户</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon outlet">
              <van-icon name="shop-o" size="22" color="#43a047" />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.outlet_count || 0 }}</div>
              <div class="stat-label">服务网点</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon appt">
              <van-icon name="calendar-o" size="22" color="#ff9800" />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.today_appointments || 0 }}</div>
              <div class="stat-label">今日预约</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon cert">
              <van-icon name="description" size="22" color="#9c27b0" />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.cert_count || 0 }}</div>
              <div class="stat-label">电子证件</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot green"></span>
            窗口调度结果
          </div>
          <span class="section-link" @click="goToWindows">调度操作台 <van-icon name="arrow" size="12" /></span>
        </div>
        <div class="dispatch-results">
          <div
            v-for="item in scheduling"
            :key="item.outlet_id"
            class="dispatch-card"
          >
            <div class="dispatch-top">
              <div class="dispatch-name">{{ item.outlet_name }}</div>
              <span class="load-badge" :class="item.load_level">
                {{ item.load_level === 'high' ? '繁忙' : item.load_level === 'medium' ? '适中' : '空闲' }}
              </span>
            </div>
            <div class="dispatch-stats">
              <div class="d-stat">
                <span class="d-val">{{ item.open_windows }}/{{ item.total_windows }}</span>
                <span class="d-label">开放窗口</span>
              </div>
              <div class="d-stat">
                <span class="d-val">{{ item.current_queue }}</span>
                <span class="d-label">排队人数</span>
              </div>
              <div class="d-stat">
                <span class="d-val">{{ item.avg_wait_time }}min</span>
                <span class="d-label">平均等待</span>
              </div>
              <div class="d-stat">
                <span class="d-val highlight">+{{ item.suggested_windows - item.open_windows }}</span>
                <span class="d-label">建议增开</span>
              </div>
            </div>
            <div class="dispatch-windows">
              <div
                v-for="win in item.windows?.slice(0, 6)"
                :key="win.id"
                class="mini-window"
                :class="{ open: win.is_open, busy: win.current_queue > 5 }"
              >
                <span class="win-no">{{ win.window_no }}</span>
                <span class="win-q">{{ win.current_queue }}人</span>
              </div>
            </div>
            <div class="dispatch-action">
              <van-button
                v-if="item.suggested_windows > item.open_windows"
                size="mini"
                type="primary"
                round
                plain
                @click="quickDispatch(item)"
              >
                一键调度至{{ item.suggested_windows }}窗
              </van-button>
              <span v-else class="dispatch-ok">
                <van-icon name="checked" color="#43a047" /> 窗口配置合理
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot orange"></span>
            热度预测明细
          </div>
          <span class="section-link" @click="goToHeat">查看完整报表 <van-icon name="arrow" size="12" /></span>
        </div>
        <div class="heat-summary" v-if="heatData.length > 0">
          <div class="heat-outlet-tabs">
            <div
              v-for="outlet in heatData.slice(0, 4)"
              :key="outlet.outlet_id"
              class="heat-tab"
              :class="{ active: selectedHeatOutlet === outlet.outlet_id }"
              @click="selectedHeatOutlet = outlet.outlet_id"
            >
              {{ outlet.outlet_name?.replace('政务服务中心', '') }}
            </div>
          </div>
          <div class="heat-chart" v-if="currentHeatOutlet">
            <div
              v-for="slot in currentHeatOutlet.time_slots"
              :key="slot.time_slot"
              class="heat-col"
            >
              <div class="heat-bar-wrap">
                <div
                  class="heat-bar"
                  :style="{ height: getBarHeight(slot.predicted_count) + '%' }"
                  :class="{ peak: slot.predicted_count >= peakThreshold }"
                ></div>
              </div>
              <div class="heat-label">{{ slot.time_slot.split('-')[0] }}</div>
              <div class="heat-count">{{ slot.predicted_count }}</div>
            </div>
          </div>
          <div class="heat-legend">
            <span class="legend-item"><span class="dot normal"></span>正常</span>
            <span class="legend-item"><span class="dot peak"></span>高峰</span>
          </div>
          <div class="heat-detail" v-if="currentHeatOutlet">
            <div class="heat-stat-row">
              <div class="heat-stat">
                <span class="hs-val">{{ currentHeatOutlet.total_predicted }}</span>
                <span class="hs-label">预测总人数</span>
              </div>
              <div class="heat-stat">
                <span class="hs-val">{{ getPeakTime() }}</span>
                <span class="hs-label">高峰时段</span>
              </div>
              <div class="heat-stat">
                <span class="hs-val">{{ getMaxSuggested() }}</span>
                <span class="hs-label">建议窗口</span>
              </div>
            </div>
          </div>
        </div>
        <van-empty v-else description="暂无预测数据" image="search" />
        <div class="heat-actions">
          <van-button size="small" type="primary" round @click="generatePrediction">
            生成明日预测
          </van-button>
        </div>
      </div>

      <div class="section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot purple"></span>
            审计复核
          </div>
          <span class="section-link" @click="goToLogs">查看全部日志 <van-icon name="arrow" size="12" /></span>
        </div>
        <div class="audit-filters">
          <van-dropdown-menu active-color="#9c27b0">
            <van-dropdown-item v-model="logModule" :options="moduleOptions" />
          </van-dropdown-menu>
        </div>
        <div v-if="operationLogs.length > 0" class="audit-list">
          <div
            v-for="log in operationLogs"
            :key="log.id"
            class="audit-item"
          >
            <div class="audit-left">
              <div class="audit-icon" :class="getModuleClass(log.module)">
                <van-icon :name="getModuleIcon(log.module)" size="16" />
              </div>
            </div>
            <div class="audit-body">
              <div class="audit-op">{{ log.operation }}</div>
              <div class="audit-meta">
                <span class="audit-module">{{ log.module || '系统' }}</span>
                <span class="audit-time">{{ formatLogTime(log.created_at) }}</span>
              </div>
              <div class="audit-detail" v-if="log.user_id">
                <span>操作人ID: {{ log.user_id }}</span>
                <span v-if="log.ip">IP: {{ log.ip }}</span>
              </div>
            </div>
            <div class="audit-status">
              <van-tag type="success" size="mini" plain>已记录</van-tag>
            </div>
          </div>
        </div>
        <van-empty v-else description="暂无审计记录" image="search" />
      </div>

      <div class="section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot blue"></span>
            区县分布
          </div>
          <span class="section-link" @click="goToReport">数据报表 <van-icon name="arrow" size="12" /></span>
        </div>
        <div class="district-list">
          <div
            v-for="item in overview.district_stats || []"
            :key="item.district"
            class="district-item"
          >
            <span class="district-name">{{ item.district }}</span>
            <div class="district-bar">
              <div
                class="bar-fill"
                :style="{ width: getDistrictPercent(item.count) + '%' }"
              ></div>
            </div>
            <span class="district-count">{{ item.count }}个</span>
          </div>
        </div>
      </div>

      <div class="bottom-space"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import {
  getAdminOverview,
  getWindowScheduling,
  getHeatPrediction,
  getOperationLogs,
  generatePrediction as genPred,
  dispatchWindow
} from '../api/admin'

const router = useRouter()

const overview = ref({})
const scheduling = ref([])
const heatData = ref([])
const selectedHeatOutlet = ref(null)
const operationLogs = ref([])
const logModule = ref('all')

const moduleOptions = [
  { text: '全部模块', value: 'all' },
  { text: '身份认证', value: 'identity' },
  { text: '网点服务', value: 'outlet' },
  { text: '代办授权', value: 'agent' },
  { text: '窗口调度', value: 'window' },
]

const currentHeatOutlet = computed(() => {
  return heatData.value.find(o => o.outlet_id === selectedHeatOutlet.value)
})

const peakThreshold = computed(() => {
  if (!currentHeatOutlet.value?.time_slots?.length) return 50
  const counts = currentHeatOutlet.value.time_slots.map(s => s.predicted_count || 0)
  return Math.max(...counts) * 0.8
})

const maxDistrictCount = computed(() => {
  if (!overview.value.district_stats?.length) return 1
  return Math.max(...overview.value.district_stats.map(d => d.count))
})

function onBack() { router.back() }

function goToWindows() { router.push('/admin/windows') }
function goToHeat() { router.push('/admin/heat') }
function goToLogs() { router.push('/admin/logs') }
function goToReport() { router.push('/admin/report') }

async function loadOverview() {
  try {
    const data = await getAdminOverview()
    overview.value = data
  } catch (e) { console.error(e) }
}

async function loadScheduling() {
  try {
    const data = await getWindowScheduling()
    scheduling.value = data || []
  } catch (e) { console.error(e) }
}

async function loadHeatData() {
  try {
    const dateStr = new Date().toISOString().split('T')[0]
    const data = await getHeatPrediction({ date: dateStr })
    heatData.value = data || []
    if (heatData.value.length > 0) {
      selectedHeatOutlet.value = heatData.value[0].outlet_id
    }
  } catch (e) { console.error(e) }
}

async function loadOperationLogs() {
  try {
    const params = { page: 1, pageSize: 20 }
    if (logModule.value && logModule.value !== 'all') {
      params.module = logModule.value
    }
    const data = await getOperationLogs(params)
    operationLogs.value = data || []
  } catch (e) { console.error(e) }
}

async function quickDispatch(item) {
  try {
    await dispatchWindow({
      outletId: item.outlet_id,
      windowCount: item.suggested_windows
    })
    showToast(`${item.outlet_name} 已调度至 ${item.suggested_windows} 窗`)
    loadScheduling()
  } catch (e) { console.error(e) }
}

async function generatePrediction() {
  try {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await genPred({ date: tomorrow })
    showToast('明日预测数据已生成')
    loadHeatData()
  } catch (e) { console.error(e) }
}

function getBarHeight(count) {
  if (!count) return 5
  const max = Math.max(...(currentHeatOutlet.value?.time_slots?.map(s => s.predicted_count || 0) || [1]))
  return Math.min(100, (count / max) * 100)
}

function getPeakTime() {
  if (!currentHeatOutlet.value?.time_slots?.length) return '-'
  const slots = currentHeatOutlet.value.time_slots
  const max = Math.max(...slots.map(s => s.predicted_count || 0))
  const peak = slots.find(s => s.predicted_count === max)
  return peak?.time_slot || '-'
}

function getMaxSuggested() {
  if (!currentHeatOutlet.value?.time_slots?.length) return 0
  return Math.max(...currentHeatOutlet.value.time_slots.map(s => s.suggested_windows || 0))
}

function getModuleClass(mod) {
  const map = { identity: 'mod-identity', outlet: 'mod-outlet', agent: 'mod-agent', window: 'mod-window' }
  return map[mod] || 'mod-system'
}

function getModuleIcon(mod) {
  const map = { identity: 'shield-o', outlet: 'location-o', agent: 'friends-o', window: 'shop-o' }
  return map[mod] || 'setting-o'
}

function formatLogTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getDistrictPercent(count) {
  return (count / maxDistrictCount.value) * 100
}

onMounted(() => {
  loadOverview()
  loadScheduling()
  loadHeatData()
  loadOperationLogs()
})
</script>

<style scoped>
.admin-page {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stat-icon.user { background: #e3f2fd; }
.stat-icon.outlet { background: #e8f5e9; }
.stat-icon.appt { background: #fff3e0; }
.stat-icon.cert { background: #f3e5f5; }

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.section {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.title-dot {
  width: 4px;
  height: 16px;
  border-radius: 2px;
}

.title-dot.green { background: #43a047; }
.title-dot.orange { background: #ff9800; }
.title-dot.purple { background: #9c27b0; }
.title-dot.blue { background: #1976d2; }

.section-link {
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 2px;
}

.dispatch-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dispatch-card {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
}

.dispatch-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dispatch-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.load-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.load-badge.high { background: #ffebee; color: #e53935; }
.load-badge.medium { background: #fff3e0; color: #ff9800; }
.load-badge.low { background: #e8f5e9; color: #43a047; }

.dispatch-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.d-stat {
  text-align: center;
}

.d-val {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.d-val.highlight {
  color: #e53935;
}

.d-label {
  font-size: 11px;
  color: #999;
}

.dispatch-windows {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.mini-window {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  background: #f0f0f0;
  min-width: 50px;
}

.mini-window.open {
  background: #e8f5e9;
}

.mini-window.busy {
  background: #fff3e0;
}

.win-no {
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.win-q {
  font-size: 10px;
  color: #999;
}

.dispatch-action {
  display: flex;
  justify-content: flex-end;
}

.dispatch-ok {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #43a047;
}

.heat-outlet-tabs {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  margin-bottom: 14px;
}

.heat-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  border: 1px solid transparent;
}

.heat-tab.active {
  background: #fff3e0;
  color: #ff9800;
  border-color: #ff9800;
}

.heat-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 120px;
  padding: 0 4px;
  margin-bottom: 10px;
}

.heat-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.heat-bar-wrap {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 4px;
}

.heat-bar {
  width: 20px;
  border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, #64b5f6, #1976d2);
  transition: height 0.3s;
}

.heat-bar.peak {
  background: linear-gradient(180deg, #ff9800, #e65100);
}

.heat-label {
  font-size: 10px;
  color: #999;
  margin-bottom: 2px;
}

.heat-count {
  font-size: 10px;
  color: #333;
  font-weight: 600;
}

.heat-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #666;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.dot.normal { background: #1976d2; }
.dot.peak { background: #ff9800; }

.heat-detail {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.heat-stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.heat-stat {
  text-align: center;
}

.hs-val {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #ff9800;
  margin-bottom: 2px;
}

.hs-label {
  font-size: 11px;
  color: #999;
}

.heat-actions {
  margin-top: 12px;
  text-align: center;
}

.audit-filters {
  margin-bottom: 12px;
}

.audit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audit-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.audit-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mod-identity { background: #e3f2fd; color: #1976d2; }
.mod-outlet { background: #e8f5e9; color: #43a047; }
.mod-agent { background: #fff3e0; color: #ff9800; }
.mod-window { background: #f3e5f5; color: #9c27b0; }
.mod-system { background: #f5f5f5; color: #666; }

.audit-body {
  flex: 1;
  min-width: 0;
}

.audit-op {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
}

.audit-module {
  background: #f0f0f0;
  padding: 1px 6px;
  border-radius: 4px;
}

.audit-detail {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #bbb;
}

.audit-status {
  flex-shrink: 0;
  padding-top: 4px;
}

.district-list {
  display: flex;
  flex-direction: column;
}

.district-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.district-name {
  width: 65px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.district-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin: 0 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1976d2, #1565c0);
  border-radius: 4px;
  transition: width 0.3s;
}

.district-count {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  width: 40px;
  text-align: right;
}

.bottom-space {
  height: 20px;
}
</style>
