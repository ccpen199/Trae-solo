<template>
  <div class="report-page">
    <van-nav-bar
      title="数据报表"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <span class="export-btn" @click="exportData">导出</span>
      </template>
    </van-nav-bar>

    <div class="tab-bar">
      <div
        class="tab-item"
        v-for="t in tabs"
        :key="t.key"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >{{ t.label }}</div>
    </div>

    <div class="page-content">
      <div class="date-selector">
        <div
          class="ds-item"
          v-for="d in dateOptions"
          :key="d.value"
          :class="{ active: selectedDate === d.value }"
          @click="selectedDate = d.value"
        >{{ d.label }}</div>
      </div>

      <div class="summary-card" v-if="activeTab === 'overview'">
        <div class="summary-grid">
          <div class="sum-item">
            <div class="sum-num">{{ overview.totalUsers }}</div>
            <div class="sum-label">累计用户</div>
            <div class="sum-trend up">+{{ overview.userGrowth }}%</div>
          </div>
          <div class="sum-item">
            <div class="sum-num">{{ overview.totalAppointments }}</div>
            <div class="sum-label">累计预约</div>
            <div class="sum-trend up">+{{ overview.apptGrowth }}%</div>
          </div>
          <div class="sum-item">
            <div class="sum-num">{{ overview.codeUsage }}</div>
            <div class="sum-label">亮码次数</div>
            <div class="sum-trend up">+{{ overview.codeGrowth }}%</div>
          </div>
          <div class="sum-item">
            <div class="sum-num">{{ overview.agentCount }}</div>
            <div class="sum-label">代办授权</div>
            <div class="sum-trend up">+{{ overview.agentGrowth }}%</div>
          </div>
        </div>
      </div>

      <div class="chart-card" v-if="activeTab === 'overview' || activeTab === 'appointment'">
        <div class="card-title">预约趋势</div>
        <div class="line-chart">
          <div class="chart-y-axis">
            <span v-for="n in 5" :key="n">{{ (4 - n + 1) * 100 }}</span>
          </div>
          <div class="chart-area">
            <div class="chart-grid">
              <div class="grid-line" v-for="n in 5" :key="n"></div>
            </div>
            <svg class="line-svg" viewBox="0 0 300 120" preserveAspectRatio="none">
              <path :d="trendPath" fill="none" stroke="#1976d2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <circle v-for="(p, i) in trendPoints" :key="i" :cx="p.x" :cy="p.y" r="3" fill="#fff" stroke="#1976d2" stroke-width="2" />
            </svg>
            <div class="chart-x-axis">
              <span v-for="l in chartLabels" :key="l">{{ l }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card" v-if="activeTab === 'overview' || activeTab === 'outlet'">
        <div class="card-title">网点业务量排名</div>
        <div class="rank-list">
          <div class="rank-item" v-for="(r, i) in outletRank" :key="r.name">
            <div class="rank-num" :class="'rank-' + (i + 1)">{{ i + 1 }}</div>
            <div class="rank-info">
              <div class="rank-name">{{ r.name }}</div>
              <div class="rank-bar-wrap">
                <div class="rank-bar" :style="{ width: r.percent + '%' }"></div>
              </div>
            </div>
            <div class="rank-value">{{ r.count }}</div>
          </div>
        </div>
      </div>

      <div class="chart-card" v-if="activeTab === 'overview' || activeTab === 'service'">
        <div class="card-title">服务类型分布</div>
        <div class="pie-wrap">
          <div class="pie-chart">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e3f2fd" stroke-width="20" />
              <circle v-for="(s, i) in pieSegments" :key="i"
                cx="50" cy="50" r="40" fill="none"
                :stroke="s.color" stroke-width="20"
                :stroke-dasharray="s.dash"
                :stroke-dashoffset="s.offset"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="pie-center">
              <div class="pie-total">{{ pieTotal }}</div>
              <div class="pie-label">总业务量</div>
            </div>
          </div>
          <div class="pie-legend">
            <div class="legend-item" v-for="s in serviceData" :key="s.name">
              <span class="legend-dot" :style="{ background: s.color }"></span>
              <span class="legend-name">{{ s.name }}</span>
              <span class="legend-value">{{ s.count }}（{{ s.percent }}%）</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card" v-if="activeTab === 'overview' || activeTab === 'elder'">
        <div class="card-title">长辈版使用情况</div>
        <div class="elder-stats">
          <div class="es-item">
            <div class="es-num">{{ elderStats.users }}</div>
            <div class="es-label">长辈用户</div>
          </div>
          <div class="es-item">
            <div class="es-num">{{ elderStats.voiceCount }}</div>
            <div class="es-label">语音办事</div>
          </div>
          <div class="es-item">
            <div class="es-num">{{ elderStats.agentCount }}</div>
            <div class="es-label">亲友代办</div>
          </div>
          <div class="es-item">
            <div class="es-num">{{ elderStats.serviceCount }}</div>
            <div class="es-label">人工坐席</div>
          </div>
        </div>
      </div>

      <div class="bottom-space"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const tabs = [
  { key: 'overview', label: '总览' },
  { key: 'appointment', label: '预约' },
  { key: 'outlet', label: '网点' },
  { key: 'service', label: '服务' },
  { key: 'elder', label: '长辈版' }
]
const activeTab = ref('overview')

const dateOptions = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' }
]
const selectedDate = ref('30d')

const overview = ref({
  totalUsers: 128600, userGrowth: 18.5,
  totalAppointments: 45680, apptGrowth: 12.3,
  codeUsage: 285400, codeGrowth: 25.6,
  agentCount: 8620, agentGrowth: 32.1
})

const trendData = ref([120, 180, 160, 220, 280, 240, 320, 380, 350, 410, 380, 450])
const chartLabels = computed(() => {
  if (selectedDate.value === '7d') return ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  if (selectedDate.value === '30d') return ['W1', 'W2', 'W3', 'W4']
  return ['1月', '2月', '3月']
})
const trendPoints = computed(() => {
  const data = trendData.value
  const max = Math.max(...data)
  return data.map((v, i) => ({
    x: (i / (data.length - 1)) * 300,
    y: 120 - (v / max) * 100
  }))
})
const trendPath = computed(() => {
  const pts = trendPoints.value
  if (pts.length === 0) return ''
  return pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
})

const outletRank = ref([
  { name: '渝中区政务服务中心', count: 8620, percent: 100 },
  { name: '江北区行政服务中心', count: 7240, percent: 84 },
  { name: '南岸区政务服务大厅', count: 6580, percent: 76 },
  { name: '渝北区政务服务中心', count: 5890, percent: 68 },
  { name: '九龙坡区政务中心', count: 4520, percent: 52 }
])

const serviceData = ref([
  { name: '身份户籍', count: 12680, percent: 28, color: '#1e88e5' },
  { name: '社保医保', count: 15420, percent: 34, color: '#43a047' },
  { name: '住房公积金', count: 8260, percent: 18, color: '#ff9800' },
  { name: '交通出行', count: 5880, percent: 13, color: '#9c27b0' },
  { name: '其他服务', count: 3440, percent: 7, color: '#546e7a' }
])
const pieTotal = computed(() => serviceData.value.reduce((a, b) => a + b.count, 0))
const pieSegments = computed(() => {
  const total = 2 * Math.PI * 40
  let offset = 0
  return serviceData.value.map(s => {
    const dash = (s.percent / 100) * total
    const seg = { color: s.color, dash: `${dash} ${total}`, offset: -offset }
    offset += dash
    return seg
  })
})

const elderStats = ref({
  users: 18620,
  voiceCount: 4520,
  agentCount: 8620,
  serviceCount: 2380
})

function exportData() { showToast('报表导出中...') }
</script>

<style scoped>
.report-page { min-height: 100vh; background: #f5f7fa; }
.export-btn { font-size: 14px; color: #1976d2; padding-right: 14px; }

.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  overflow-x: auto;
}
.tab-item {
  flex-shrink: 0;
  padding: 12px 18px;
  font-size: 14px;
  color: #666;
  position: relative;
}
.tab-item.active {
  color: #1976d2;
  font-weight: 600;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #1976d2;
  border-radius: 2px;
}

.page-content { padding: 12px; padding-bottom: 30px; }

.date-selector {
  display: flex;
  background: #fff;
  border-radius: 10px;
  padding: 6px;
  margin-bottom: 12px;
}
.ds-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 13px;
  color: #666;
  border-radius: 8px;
}
.ds-item.active {
  background: #1976d2;
  color: #fff;
  font-weight: 500;
}

.summary-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.sum-item {
  position: relative;
  padding: 4px;
}
.sum-num {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}
.sum-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}
.sum-trend {
  display: inline-flex;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 8px;
  background: #e8f5e9;
  color: #43a047;
  font-weight: 500;
}
.sum-trend.down { background: #ffebee; color: #e53935; }

.chart-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.line-chart {
  display: flex;
  height: 160px;
  gap: 8px;
}
.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 24px;
  font-size: 10px;
  color: #999;
  width: 30px;
  text-align: right;
}
.chart-area {
  flex: 1;
  position: relative;
}
.chart-grid {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.grid-line {
  height: 1px;
  background: #f0f0f0;
}
.line-svg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 24px;
  width: 100%;
  height: calc(100% - 24px);
}
.chart-x-axis {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #999;
}

.rank-list { display: flex; flex-direction: column; gap: 14px; }
.rank-item { display: flex; align-items: center; gap: 12px; }
.rank-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rank-num.rank-1 { background: linear-gradient(135deg, #ffd54f, #ffb300); color: #fff; }
.rank-num.rank-2 { background: linear-gradient(135deg, #e0e0e0, #bdbdbd); color: #fff; }
.rank-num.rank-3 { background: linear-gradient(135deg, #ffab91, #ff8a65); color: #fff; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 13px; color: #333; margin-bottom: 6px; }
.rank-bar-wrap {
  height: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}
.rank-bar {
  height: 100%;
  background: linear-gradient(90deg, #1e88e5, #1565c0);
  border-radius: 4px;
}
.rank-value {
  font-size: 15px;
  font-weight: 700;
  color: #1976d2;
  flex-shrink: 0;
  width: 50px;
  text-align: right;
}

.pie-wrap { display: flex; align-items: center; gap: 20px; }
.pie-chart {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}
.pie-chart svg {
  width: 100%;
  height: 100%;
}
.pie-center {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.pie-total {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}
.pie-label {
  font-size: 10px;
  color: #999;
}
.pie-legend { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.legend-item {
  display: flex; align-items: center;
  font-size: 12px;
  color: #333;
}
.legend-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}
.legend-name { flex: 1; color: #666; }
.legend-value { font-weight: 500; }

.elder-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.es-item {
  text-align: center;
  padding: 14px 6px;
  background: #fff8e1;
  border-radius: 10px;
}
.es-num {
  font-size: 20px;
  font-weight: 700;
  color: #f57c00;
  margin-bottom: 4px;
}
.es-label {
  font-size: 11px;
  color: #999;
}

.bottom-space { height: 10px; }
</style>
