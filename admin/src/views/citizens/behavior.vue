<template>
  <div class="behavior-container">
    <div class="behavior-header">
      <div>
        <h2>市民行为分析</h2>
        <p class="header-sub">行为热力 · 转化漏斗 · 轨迹追踪</p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="timeRange === 'custom'"
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="default"
          style="width: 260px;"
        />
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><User /></div>
          <div class="stat-label">日均活跃</div>
          <div class="stat-value">{{ formatNum(stats.dailyActive) }}</div>
          <div class="stat-sub"><TrendCharts class="up" />较上周 +12.3%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><Timer /></div>
          <div class="stat-label">平均会话时长</div>
          <div class="stat-value">{{ stats.avgSession }} <span style="font-size: 14px;">分钟</span></div>
          <div class="stat-sub"><TrendCharts class="up" />较上周 +0.8min</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><Warning /></div>
          <div class="stat-label">跳出率</div>
          <div class="stat-value">{{ stats.bounceRate }}<span style="font-size: 14px;">%</span></div>
          <div class="stat-sub"><TrendCharts class="down" />较上周 -2.1%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><CircleCheck /></div>
          <div class="stat-label">核心转化率</div>
          <div class="stat-value">{{ stats.conversionRate }}<span style="font-size: 14px;">%</span></div>
          <div class="stat-sub"><TrendCharts class="up" />较上周 +1.5%</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">办件行为时间热力图（7×24）</div>
            <el-tag type="info" round size="small">按时段统计</el-tag>
          </div>
          <v-chart :option="heatmapOption" style="height: 340px;" autoresize />
        </div>
      </el-col>
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">服务类别偏好</div>
          </div>
          <v-chart :option="radarOption" style="height: 340px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">缴费频次分布</div>
          </div>
          <v-chart :option="barOption" style="height: 300px;" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">点击热区排行</div>
          </div>
          <v-chart :option="clickRankOption" style="height: 300px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">行为转化漏斗</div>
            <el-tag type="info" round size="small">浏览 → 办结</el-tag>
          </div>
          <div class="funnel-container">
            <div
              v-for="(step, idx) in funnelSteps"
              :key="idx"
              class="funnel-step"
              :style="{ width: `${70 - idx * 10}%`, background: step.color }"
            >
              <div class="funnel-label">{{ step.name }}</div>
              <div class="funnel-value">{{ formatNum(step.count) }}</div>
              <div class="funnel-rate" v-if="idx > 0">
                转化率 {{ step.rate }}%
                <span :class="step.rateChange >= 0 ? 'rate-up' : 'rate-down'">
                  {{ step.rateChange >= 0 ? '↑' : '↓' }}{{ Math.abs(step.rateChange) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">行为轨迹明细</div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <el-select v-model="behaviorFilter" placeholder="行为类型" clearable size="small" style="width: 130px;">
            <el-option label="浏览" value="browse" />
            <el-option label="点击" value="click" />
            <el-option label="申请" value="apply" />
            <el-option label="提交" value="submit" />
          </el-select>
          <el-input v-model="trackSearch" placeholder="搜索市民ID/服务" clearable size="small" style="width: 180px;" :prefix-icon="Search" />
        </div>
      </div>
      <el-table :data="filteredTracks" stripe size="default">
        <el-table-column prop="citizenId" label="市民ID" width="130" />
        <el-table-column label="行为类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="behaviorTagType(row.type)" effect="plain" round size="small">{{ behaviorLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="serviceName" label="服务名称" min-width="160" />
        <el-table-column prop="time" label="时间" width="170" />
        <el-table-column label="设备" width="90" align="center">
          <template #default="{ row }">
            <el-icon :size="16"><component :is="row.device === 'mobile' ? 'Cellphone' : 'Monitor'" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="停留时长" width="110" align="right">
          <template #default="{ row }">{{ row.duration }}s</template>
        </el-table-column>
      </el-table>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          :total="256"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart, RadarChart, BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  VisualMapComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Search, User, Timer, Warning, CircleCheck, TrendCharts, Cellphone, Monitor } from '@element-plus/icons-vue'

use([CanvasRenderer, HeatmapChart, RadarChart, BarChart, LineChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent])

const timeRange = ref('7d')
const customRange = ref<[Date, Date] | null>(null)
const behaviorFilter = ref('')
const trackSearch = ref('')
const pagination = reactive({ page: 1, size: 10 })

const stats = reactive({
  dailyActive: 34521,
  avgSession: 8.6,
  bounceRate: 23.4,
  conversionRate: 34.8
})

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)

function genHeatmapData() {
  const data: [number, number, number][] = []
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const isWorkHour = h >= 8 && h <= 20 && d < 5
      const peak = (h >= 9 && h <= 11) || (h >= 14 && h <= 17) ? 1.5 : 1
      const base = isWorkHour ? 300 : 50
      data.push([h, d, Math.floor((base + Math.random() * 200) * peak)])
    }
  }
  return data
}

const heatmapData = genHeatmapData()

const heatmapOption = computed(() => ({
  tooltip: {
    position: 'top',
    formatter: (params: any) => `${days[params.value[1]]} ${hours[params.value[0]]}<br/>访问量: ${params.value[2]}`
  },
  grid: { left: 60, right: 40, top: 10, bottom: 50 },
  xAxis: {
    type: 'category', data: hours, splitArea: { show: true },
    axisLabel: { fontSize: 10, interval: 2 }
  },
  yAxis: { type: 'category', data: days, axisLabel: { fontSize: 11 } },
  visualMap: {
    min: 0, max: 800, show: false,
    inRange: { color: ['#EBEEF5', '#C6E2FF', '#79BBFF', '#337ECC', '#1E4FA5', '#0D3A7C'] }
  },
  series: [{
    type: 'heatmap', data: heatmapData,
    itemStyle: { borderRadius: 3, borderColor: '#fff', borderWidth: 1 },
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } }
  }]
}))

const radarOption = computed(() => ({
  tooltip: {},
  radar: {
    indicator: [
      { name: '社会保障', max: 100 },
      { name: '医疗保障', max: 100 },
      { name: '住房公积金', max: 100 },
      { name: '教育服务', max: 100 },
      { name: '住房服务', max: 100 },
      { name: '户籍证件', max: 100 }
    ],
    shape: 'polygon',
    splitArea: { areaStyle: { color: ['rgba(30,79,165,0.02)', 'rgba(30,79,165,0.05)'] } },
    axisLine: { lineStyle: { color: '#E4E7ED' } },
    splitLine: { lineStyle: { color: '#E4E7ED' } }
  },
  series: [{
    type: 'radar',
    data: [
      {
        value: [92, 85, 68, 54, 47, 72],
        name: '服务偏好指数',
        lineStyle: { color: '#1E4FA5', width: 2 },
        itemStyle: { color: '#1E4FA5' },
        areaStyle: { color: 'rgba(30,79,165,0.2)' }
      },
      {
        value: [78, 70, 82, 63, 55, 60],
        name: '上月对比',
        lineStyle: { color: '#F39C12', width: 2, type: 'dashed' },
        itemStyle: { color: '#F39C12' },
        areaStyle: { color: 'rgba(243,156,18,0.1)' }
      }
    ]
  }]
}))

const barOption = computed(() => {
  const categories = ['社保缴费', '医保缴费', '公积金缴存', '水费', '电费', '燃气费', '物业费']
  const counts = [8234, 7652, 5893, 4321, 3987, 2654, 1234]
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 90, right: 30, top: 20, bottom: 40 },
    xAxis: {
      type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } }
    },
    yAxis: { type: 'category', data: categories },
    series: [{
      type: 'bar', barWidth: 20, data: counts,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{ offset: 0, color: '#79BBFF' }, { offset: 1, color: '#1E4FA5' }]
        }
      },
      label: { show: true, position: 'right', formatter: '{c}', fontSize: 11, color: '#606266' }
    }]
  }
})

const clickRankOption = computed(() => {
  const areas = ['社保查询入口', '医保电子凭证', '公积金提取', '办事指南页', '政策解读区', '在线预约入口', '证明开具入口', '个人中心']
  const clicks = [12856, 10342, 8923, 7654, 6321, 5890, 4567, 3421]
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 110, right: 40, top: 20, bottom: 30 },
    xAxis: {
      type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } }
    },
    yAxis: { type: 'category', data: areas, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar', barWidth: 16, data: clicks.map((v, i) => ({
        value: v,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: i < 3 ? '#1E4FA5' : i < 5 ? '#3B7DD8' : '#79BBFF'
        }
      })),
      label: { show: true, position: 'right', formatter: '{c}', fontSize: 11, color: '#606266' }
    }]
  }
})

const funnelSteps = reactive([
  { name: '浏览', count: 892340, rate: 0, rateChange: 0, color: '#1E4FA5' },
  { name: '点击', count: 456720, rate: 51.2, rateChange: 2.3, color: '#3B7DD8' },
  { name: '申请', count: 234560, rate: 51.4, rateChange: -1.2, color: '#F39C12' },
  { name: '提交', count: 156890, rate: 66.9, rateChange: 3.5, color: '#27AE60' },
  { name: '办结', count: 134520, rate: 85.7, rateChange: 1.8, color: '#2ECC71' }
])

const trackData = ref(
  Array.from({ length: 30 }, (_, i) => {
    const types = ['browse', 'click', 'apply', 'submit'] as const
    const services = ['社保参保证明打印', '医保电子凭证激活', '公积金账户余额查询', '义务教育入学报名', '不动产登记查询', '新生儿落户登记', '交通违法查询处理', '个税纳税记录开具']
    const type = types[i % 4]
    return {
      citizenId: `CIT-${String(20250010 + (i % 15)).padStart(8, '0')}`,
      type,
      serviceName: services[i % services.length],
      time: new Date(Date.now() - i * 3600000 * (1 + Math.random() * 3)).toLocaleString('zh-CN'),
      device: i % 3 === 0 ? 'pc' as const : 'mobile' as const,
      duration: Math.floor(3 + Math.random() * 120)
    }
  })
)

const filteredTracks = computed(() =>
  trackData.value
    .filter(t => !behaviorFilter.value || t.type === behaviorFilter.value)
    .filter(t => !trackSearch.value || t.citizenId.includes(trackSearch.value) || t.serviceName.includes(trackSearch.value))
)

function behaviorLabel(type: string) {
  return { browse: '浏览', click: '点击', apply: '申请', submit: '提交' }[type] || type
}

function behaviorTagType(type: string) {
  return { browse: 'info', click: 'primary', apply: 'warning', submit: 'success' }[type] as any || 'info'
}

function formatNum(n: number) {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.behavior-container { padding: 0; }
.behavior-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.stat-row { margin-bottom: 20px; }

.stat-card {
  padding: 20px; border-radius: $radius-lg; background: $bg-card;
  border: 1px solid $border-lighter; transition: all 0.25s;
  &:hover { box-shadow: $shadow-md; transform: translateY(-2px); }
  .stat-icon { width: 40px; height: 40px; border-radius: $radius-md; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; color: #fff; }
  .stat-label { font-size: 13px; color: $text-secondary; margin-bottom: 6px; }
  .stat-value { font-size: 28px; font-weight: 700; color: $text-primary; }
  .stat-sub { font-size: 12px; color: $text-secondary; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
  &.stat-primary .stat-icon { background: $primary-color; }
  &.stat-success .stat-icon { background: $success-color; }
  &.stat-warning .stat-icon { background: $warning-color; }
  &.stat-info .stat-icon { background: $info-color; }
}

.up { color: #27AE60; }
.down { color: #E74C3C; }

.funnel-container {
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 0;
}
.funnel-step {
  text-align: center; padding: 14px 20px; border-radius: $radius-md;
  color: #fff; transition: all 0.3s;
  &:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .funnel-label { font-size: 14px; font-weight: 600; }
  .funnel-value { font-size: 22px; font-weight: 700; margin: 4px 0; }
  .funnel-rate { font-size: 12px; opacity: 0.9; }
  .rate-up { color: #A9DFBF; }
  .rate-down { color: #F5B7B1; }
}

.pagination-bar { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
