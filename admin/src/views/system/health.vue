<template>
  <div class="health-container">
    <div class="page-header">
      <div>
        <h2>系统健康监控</h2>
        <p class="header-sub">
          实时监控 · {{ currentTime }} · 每5秒刷新
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> LIVE
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshAll">立即刷新</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="gauge-row">
      <el-col :span="8">
        <div class="card-wrapper gauge-card">
          <div class="card-title">CPU 使用率</div>
          <v-chart :option="cpuGaugeOption" style="height: 220px;" autoresize />
          <div class="gauge-meta">
            <span>核心数: 8</span>
            <span>进程: {{ cpuProcesses }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper gauge-card">
          <div class="card-title">内存使用率</div>
          <v-chart :option="memoryGaugeOption" style="height: 220px;" autoresize />
          <div class="gauge-meta">
            <span>总量: 32GB</span>
            <span>已用: {{ (32 * memory / 100).toFixed(1) }}GB</span>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper gauge-card">
          <div class="card-title">磁盘使用率</div>
          <v-chart :option="diskGaugeOption" style="height: 220px;" autoresize />
          <div class="gauge-meta">
            <span>总量: 500GB</span>
            <span>已用: {{ (500 * disk / 100).toFixed(0) }}GB</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">CPU / 内存使用率趋势（近1小时）</div>
          </div>
          <v-chart :option="cpuMemoryTrendOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">API 响应时间分布</div>
          </div>
          <v-chart :option="apiResponseOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">各委办局接口健康度</div>
        <el-tag type="success" effect="plain" round size="small" style="margin-right: 8px;">在线 {{ onlineCount }}</el-tag>
        <el-tag type="warning" effect="plain" round size="small" style="margin-right: 8px;">降级 {{ degradedCount }}</el-tag>
        <el-tag type="danger" effect="plain" round size="small">离线 {{ offlineCount }}</el-tag>
      </div>
      <v-chart :option="deptHealthOption" style="height: 360px;" autoresize />
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">服务状态列表</div>
            <el-tag type="info" round size="small">共 {{ services.length }} 个接口</el-tag>
          </div>
          <el-table :data="services" size="default" stripe max-height="520">
            <el-table-column prop="name" label="委办局" min-width="120" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small" effect="dark">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastHeartbeat" label="最后心跳" width="170" />
            <el-table-column label="平均响应" width="100" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.avgResponse > 500 ? '#E74C3C' : row.avgResponse > 200 ? '#F39C12' : '#27AE60' }">
                  {{ row.avgResponse }}ms
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="todayCalls" label="今日调用" width="100" align="center">
              <template #default="{ row }">
                {{ formatNum(row.todayCalls) }}
              </template>
            </el-table-column>
            <el-table-column label="错误率" width="100" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.errorRate > 5 ? '#E74C3C' : row.errorRate > 1 ? '#F39C12' : '#27AE60', fontWeight: 600 }">
                  {{ row.errorRate }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">告警列表</div>
            <el-tag type="danger" effect="plain" round size="small">最近20条</el-tag>
          </div>
          <div class="alert-list">
            <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="'alert-' + alert.level">
              <div class="alert-header">
                <el-tag :type="alertLevelType(alert.level)" size="small" effect="dark" class="alert-level-tag">
                  {{ alertLevelLabel(alert.level) }}
                </el-tag>
                <span class="alert-time">{{ alert.time }}</span>
                <el-tag v-if="alert.status === 'resolved'" type="success" size="small" effect="plain">已处理</el-tag>
                <el-tag v-else-if="alert.status === 'processing'" type="warning" size="small" effect="plain">处理中</el-tag>
                <el-tag v-else type="danger" size="small" effect="plain">待处理</el-tag>
              </div>
              <div class="alert-source">{{ alert.source }}</div>
              <div class="alert-content">{{ alert.content }}</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, GaugeChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { Refresh, Odometer } from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, BarChart, GaugeChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const currentTime = ref('')
const cpu = ref(28.5)
const memory = ref(62.3)
const disk = ref(54.8)
const cpuProcesses = ref(247)

const gaugeColor = (value: number) => {
  if (value < 60) return '#27AE60'
  if (value < 80) return '#F39C12'
  return '#E74C3C'
}

const makeGaugeOption = (value: number, name: string) => ({
  series: [{
    type: 'gauge',
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 100,
    radius: '90%',
    progress: { show: true, width: 16, itemStyle: { color: gaugeColor(value) } },
    axisLine: { lineStyle: { width: 16, color: [[1, '#EBEEF5']] } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    pointer: { show: false },
    title: { show: false },
    detail: {
      valueAnimation: true, fontSize: 28, fontWeight: 700, color: gaugeColor(value),
      offsetCenter: [0, '0%'], formatter: '{value}%'
    },
    data: [{ value: Math.round(value * 10) / 10, name }]
  }]
})

const cpuGaugeOption = computed(() => makeGaugeOption(cpu.value, 'CPU'))
const memoryGaugeOption = computed(() => makeGaugeOption(memory.value, '内存'))
const diskGaugeOption = computed(() => makeGaugeOption(disk.value, '磁盘'))

const trendTimes = Array.from({ length: 60 }, (_, i) => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - (59 - i))
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const cpuTrend = ref(Array.from({ length: 60 }, () => 20 + Math.random() * 40))
const memTrend = ref(Array.from({ length: 60 }, () => 50 + Math.random() * 25))

const cpuMemoryTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['CPU使用率', '内存使用率'], right: 10 },
  grid: { left: 50, right: 30, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: trendTimes, boundaryGap: false, axisLabel: { interval: 9 } },
  yAxis: { type: 'value', min: 0, max: 100, name: '%', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
  series: [
    {
      name: 'CPU使用率', type: 'line', smooth: true, data: cpuTrend.value.map(v => Math.round(v * 10) / 10),
      lineStyle: { color: '#1E4FA5', width: 2 }, itemStyle: { color: '#1E4FA5' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(30,79,165,0.3)' }, { offset: 1, color: 'rgba(30,79,165,0.02)' }] } },
      showSymbol: false
    },
    {
      name: '内存使用率', type: 'line', smooth: true, data: memTrend.value.map(v => Math.round(v * 10) / 10),
      lineStyle: { color: '#27AE60', width: 2 }, itemStyle: { color: '#27AE60' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(39,174,96,0.3)' }, { offset: 1, color: 'rgba(39,174,96,0.02)' }] } },
      showSymbol: false
    }
  ]
}))

const apiBuckets = [
  { range: '0-50ms', count: 2345 },
  { range: '50-100ms', count: 4567 },
  { range: '100-200ms', count: 3214 },
  { range: '200-500ms', count: 1897 },
  { range: '500ms-1s', count: 623 },
  { range: '1s-3s', count: 234 },
  { range: '>3s', count: 56 }
]

const apiResponseOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 80, right: 30, top: 20, bottom: 30 },
  xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
  yAxis: { type: 'category', data: apiBuckets.map(b => b.range) },
  series: [{
    type: 'bar', barWidth: 20,
    data: apiBuckets.map(b => b.count),
    itemStyle: {
      borderRadius: [0, 4, 4, 0],
      color: (params: any) => {
        const idx = params.dataIndex
        if (idx <= 1) return '#27AE60'
        if (idx <= 3) return '#1E4FA5'
        if (idx <= 4) return '#F39C12'
        return '#E74C3C'
      }
    },
    label: { show: true, position: 'right', formatter: '{c}', fontSize: 11, color: '#606266' }
  }]
}))

interface ServiceItem {
  name: string
  status: string
  lastHeartbeat: string
  avgResponse: number
  todayCalls: number
  errorRate: number
  healthScore: number
}

const deptNames = [
  '人社局', '医保局', '公积金中心', '公安局', '民政局',
  '教育局', '交警支队', '税务局', '自然资源局', '住建局',
  '卫健委', '市场监管局', '交通局', '水利局', '应急管理局',
  '城管局', '文旅局', '农业农村局', '生态环境局', '司法局'
]

const now = new Date()

const services = ref<ServiceItem[]>(deptNames.map((name, i) => {
  const statusRoll = Math.random()
  const status = statusRoll < 0.75 ? 'online' : statusRoll < 0.9 ? 'degraded' : 'offline'
  const t = new Date(now.getTime() - Math.floor(Math.random() * 300000))
  return {
    name,
    status,
    lastHeartbeat: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`,
    avgResponse: status === 'online' ? Math.floor(80 + Math.random() * 200) : status === 'degraded' ? Math.floor(300 + Math.random() * 700) : Math.floor(1000 + Math.random() * 3000),
    todayCalls: Math.floor(5000 + Math.random() * 40000),
    errorRate: status === 'online' ? +(Math.random() * 0.8).toFixed(2) : status === 'degraded' ? +(1 + Math.random() * 5).toFixed(2) : +(10 + Math.random() * 30).toFixed(2),
    healthScore: status === 'online' ? Math.floor(90 + Math.random() * 10) : status === 'degraded' ? Math.floor(60 + Math.random() * 30) : Math.floor(10 + Math.random() * 40)
  }
}))

const onlineCount = computed(() => services.value.filter(s => s.status === 'online').length)
const degradedCount = computed(() => services.value.filter(s => s.status === 'degraded').length)
const offlineCount = computed(() => services.value.filter(s => s.status === 'offline').length)

const statusTagType = (s: string): 'success' | 'warning' | 'danger' => ({ online: 'success', degraded: 'warning', offline: 'danger' }[s] as 'success' | 'warning' | 'danger')
const statusLabel = (s: string) => ({ online: '在线', degraded: '降级', offline: '离线' }[s] || s)

const deptHealthOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params: any) => {
    const d = params[0]
    return `${d.name}<br/>健康度: ${d.value}分`
  }},
  grid: { left: 100, right: 50, top: 10, bottom: 30 },
  xAxis: { type: 'value', min: 0, max: 100, splitLine: { lineStyle: { type: 'dashed' } } },
  yAxis: { type: 'category', data: [...deptNames].reverse() },
  series: [{
    type: 'bar', barWidth: 14,
    data: [...services.value].reverse().map(s => s.healthScore),
    itemStyle: {
      borderRadius: [0, 4, 4, 0],
      color: (params: any) => {
        const v = params.data
        if (v >= 90) return '#27AE60'
        if (v >= 70) return '#1E4FA5'
        if (v >= 50) return '#F39C12'
        return '#E74C3C'
      }
    },
    label: { show: true, position: 'right', formatter: '{c}分', fontSize: 11, color: '#606266' }
  }]
}))

interface AlertItem {
  id: string
  time: string
  level: string
  source: string
  content: string
  status: string
}

const alertSources = ['人社局接口', '医保局接口', '公积金接口', '公安局接口', '系统监控', '数据库', '消息队列', '缓存服务', 'CDN节点', '负载均衡']
const alertContents = [
  '接口响应时间超过阈值 (>3000ms)，当前平均 4521ms',
  '连接池使用率超过 90%，存在连接耗尽风险',
  '5分钟内连续3次心跳检测失败',
  '数据库慢查询数量激增，近5分钟 127 条',
  'SSL证书将于7天后过期',
  '内存使用率超过 85%，建议扩容或优化',
  '磁盘IO延迟超过 50ms，影响写入性能',
  '错误率从 0.3% 上升至 5.2%',
  'API网关返回429状态码，触发限流',
  'Redis主从同步延迟超过 5秒',
  '数据导出任务超时，已自动终止',
  '委办局接口返回数据格式异常',
  'OAuth Token刷新失败，影响认证流程',
  '消息积压超过 10000 条，消费端滞后',
  'CPU使用率持续超过 80% 达10分钟',
  '配置变更未经过审批流程',
  '异常登录尝试：同一IP5分钟内登录失败8次',
  '数据备份任务执行失败',
  'K8s Pod重启次数异常，近1小时重启5次',
  'JVM Full GC频率异常，近5分钟 12 次'
]

const alertLevels = ['critical', 'warning', 'info']
const alertStatuses = ['pending', 'processing', 'resolved']

const alerts = ref<AlertItem[]>(Array.from({ length: 20 }, (_, i) => {
  const t = new Date(now.getTime() - i * Math.floor(120000 + Math.random() * 600000))
  const levelRoll = Math.random()
  const level = levelRoll < 0.25 ? 'critical' : levelRoll < 0.65 ? 'warning' : 'info'
  const statusRoll = Math.random()
  const status = i < 5 ? 'pending' : i < 12 ? (statusRoll < 0.5 ? 'processing' : 'resolved') : 'resolved'
  return {
    id: `ALT-${String(20240618001 + i)}`,
    time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`,
    level,
    source: alertSources[Math.floor(Math.random() * alertSources.length)],
    content: alertContents[i % alertContents.length],
    status
  }
}))

const alertLevelType = (l: string): 'danger' | 'warning' | 'info' => ({ critical: 'danger', warning: 'warning', info: 'info' }[l] as 'danger' | 'warning' | 'info')
const alertLevelLabel = (l: string) => ({ critical: '严重', warning: '警告', info: '提示' }[l] || l)

const formatNum = (n: number) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}

function refreshAll() {
  cpu.value = 20 + Math.random() * 45
  memory.value = 50 + Math.random() * 30
  disk.value = 52 + Math.random() * 8
  cpuProcesses.value = 230 + Math.floor(Math.random() * 40)

  cpuTrend.value = [...cpuTrend.value.slice(1), cpu.value]
  memTrend.value = [...memTrend.value.slice(1), memory.value]

  services.value.forEach(s => {
    if (s.status === 'online') {
      s.avgResponse = Math.floor(80 + Math.random() * 200)
      s.errorRate = +(Math.random() * 0.8).toFixed(2)
    } else if (s.status === 'degraded') {
      s.avgResponse = Math.floor(300 + Math.random() * 700)
      s.errorRate = +(1 + Math.random() * 5).toFixed(2)
    }
    s.todayCalls += Math.floor(Math.random() * 10)
  })

  const t = new Date()
  const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`
  services.value.forEach(s => {
    s.lastHeartbeat = timeStr
  })

  ElMessage.success('监控数据已刷新')
}

let timer: any
onMounted(() => {
  const updateTime = () => {
    const d = new Date()
    currentTime.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }
  updateTime()
  timer = setInterval(() => {
    updateTime()
    refreshAll()
  }, 5000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.health-container { padding: 0; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; display: flex; align-items: center; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.gauge-card {
  text-align: center;
  .card-title { font-size: 15px; font-weight: 600; color: $text-primary; margin-bottom: 8px; }
  .gauge-meta {
    display: flex; justify-content: center; gap: 24px; padding-top: 8px; border-top: 1px solid $border-lighter; margin-top: 4px;
    span { font-size: 12px; color: $text-secondary; }
  }
}

.card-wrapper {
  background: $bg-card; border-radius: $radius-lg; padding: 18px;
  border: 1px solid $border-lighter; box-shadow: $shadow-sm; margin-bottom: 20px;
}

.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid $border-lighter;
  .card-title { font-size: 15px; font-weight: 600; color: $text-primary; display: flex; align-items: center; gap: 8px; }
}

.alert-list {
  max-height: 520px; overflow-y: auto;
  .alert-item {
    padding: 12px; border-radius: 8px; border: 1px solid $border-lighter;
    margin-bottom: 10px; transition: all 0.2s;
    &:hover { border-color: $primary-light; background: #f0f7ff; }
    &.alert-critical { border-left: 3px solid $danger-color; }
    &.alert-warning { border-left: 3px solid $warning-color; }
    &.alert-info { border-left: 3px solid $info-color; }
  }
  .alert-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
    .alert-level-tag { flex-shrink: 0; }
    .alert-time { font-size: 12px; color: $text-secondary; flex: 1; }
  }
  .alert-source { font-size: 12px; color: $primary-color; font-weight: 500; margin-bottom: 4px; }
  .alert-content { font-size: 13px; color: $text-primary; line-height: 1.5; }
}
</style>
