<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-1">管理驾驶舱</h1>
      <p class="text-neutral-400 text-sm">实时监控政务服务运行态势</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div v-for="(stat, index) in statCards" :key="index"
           @click="handleStatClick(stat)"
           class="relative overflow-hidden rounded-xl p-5 border border-neutral-800 cursor-pointer hover:border-neutral-600 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group"
           :class="stat.gradient">
        <div class="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
             :class="stat.glow"></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-neutral-400 text-sm">{{ stat.label }}</span>
            <component :is="stat.icon" class="w-5 h-5 group-hover:scale-110 transition-transform" :class="stat.iconColor" />
          </div>
          <div class="text-3xl font-bold mb-1 animate-number-roll">
            <CountUp :end-val="stat.value" :duration="1.5" />
            <span class="text-lg font-normal text-neutral-400">{{ stat.suffix }}</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1">
              <TrendingUp v-if="stat.trend > 0" class="w-3 h-3 text-green-400" />
              <TrendingDown v-else-if="stat.trend < 0" class="w-3 h-3 text-red-400" />
              <span :class="stat.trend > 0 ? 'text-green-400' : stat.trend < 0 ? 'text-red-400' : 'text-neutral-400'">
                {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
              </span>
              <span class="text-neutral-500">较昨日</span>
            </div>
            <ChevronRight class="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-colors group cursor-pointer"
             @click="handleTrendChartClick">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold flex items-center gap-2">
              <Activity class="w-4 h-4 text-blue-400" />
              办件趋势（近30天）
            </h3>
            <div class="flex items-center gap-2">
              <el-radio-group v-model="trendType" size="small" @click.stop>
                <el-radio-button label="applications">办件量</el-radio-button>
                <el-radio-button label="tickets">工单数</el-radio-button>
              </el-radio-group>
              <span class="text-xs text-neutral-500 group-hover:text-blue-400 flex items-center gap-0.5 transition-colors">
                查看详情 <ChevronRight class="w-3 h-3" />
              </span>
            </div>
          </div>
          <div ref="trendChartRef" class="h-72"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-colors group cursor-pointer"
               @click="handleBarChartClick">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-white font-semibold flex items-center gap-2">
                <BarChart3 class="w-4 h-4 text-cyan-400" />
                部门办件量排名
              </h3>
              <span class="text-xs text-neutral-500 group-hover:text-cyan-400 flex items-center gap-0.5 transition-colors">
                查看详情 <ChevronRight class="w-3 h-3" />
              </span>
            </div>
            <div ref="barChartRef" class="h-64"></div>
          </div>

          <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-colors group cursor-pointer"
               @click="handlePieChartClick">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-white font-semibold flex items-center gap-2">
                <PieChart class="w-4 h-4 text-purple-400" />
                事项类型分布
              </h3>
              <span class="text-xs text-neutral-500 group-hover:text-purple-400 flex items-center gap-0.5 transition-colors">
                查看详情 <ChevronRight class="w-3 h-3" />
              </span>
            </div>
            <div ref="pieChartRef" class="h-64"></div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-colors group cursor-pointer"
             @click="handleAlertsClick">
          <div class="flex items-center justify-between mb-4">
            <span class="flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-red-400" />
              实时告警
            </span>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                {{ activeAlerts.length }} 条告警
              </span>
              <ChevronRight class="w-3 h-3 text-neutral-500 group-hover:text-red-400 transition-colors" />
            </div>
          </div>
          <div class="space-y-3 max-h-56 overflow-y-auto scrollbar-thin">
            <div v-for="alert in activeAlerts" :key="alert.id"
                 class="p-3 rounded-lg border-l-4"
                 :class="alert.level === 'critical' ? 'bg-red-500/10 border-red-500' : 'bg-yellow-500/10 border-yellow-500'">
              <div class="flex items-start justify-between mb-1">
                <span class="text-sm font-medium" :class="alert.level === 'critical' ? 'text-red-400' : 'text-yellow-400'">
                  {{ alert.title }}
                </span>
                <span class="text-xs px-1.5 py-0.5 rounded"
                      :class="alert.level === 'critical' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'">
                  {{ alert.level === 'critical' ? '严重' : '警告' }}
                </span>
              </div>
              <p class="text-xs text-neutral-400 mb-1">{{ alert.message }}</p>
              <p class="text-xs text-neutral-500">{{ alert.createTime }}</p>
            </div>
            <div v-if="activeAlerts.length === 0" class="text-center py-6 text-neutral-500 text-sm">
              暂无告警
            </div>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-colors group cursor-pointer"
             @click="handleTicketsClick">
          <div class="flex items-center justify-between mb-4">
            <span class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-orange-400" />
              待办工单
            </span>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
                {{ pendingTickets.length }} 条待办
              </span>
              <ChevronRight class="w-3 h-3 text-neutral-500 group-hover:text-orange-400 transition-colors" />
            </div>
          </div>
          <div class="space-y-3 max-h-56 overflow-y-auto scrollbar-thin">
            <div v-for="ticket in pendingTickets" :key="ticket.id"
                 class="p-3 rounded-lg bg-neutral-700/30 border border-neutral-700/50 hover:border-neutral-600 transition-colors cursor-pointer">
              <div class="flex items-start justify-between mb-1">
                <span class="text-sm text-white font-medium truncate pr-2">{{ ticket.title }}</span>
                <span class="text-xs px-1.5 py-0.5 rounded shrink-0"
                      :class="getPriorityClass(ticket.priority)">
                  {{ getPriorityLabel(ticket.priority) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-xs text-neutral-400">
                <span>{{ ticket.departmentName || '待分配' }}</span>
                <span :class="ticket.isOverdue ? 'text-red-400 font-medium' : ''">
                  {{ ticket.isOverdue ? '已超时' : ticket.remainingHours + '小时' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-colors group cursor-pointer"
             @click="handleMonitorClick">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold flex items-center gap-2">
              <Server class="w-4 h-4 text-green-400" />
              系统状态监控
            </h3>
            <ChevronRight class="w-3 h-3 text-neutral-500 group-hover:text-green-400 transition-colors" />
          </div>
          <div class="grid grid-cols-4 gap-3">
            <div v-for="monitor in systemMonitors" :key="monitor.id"
                 class="text-center p-2 rounded-lg bg-neutral-700/30 border border-neutral-700/50"
                 :title="monitor.name">
              <div class="w-2.5 h-2.5 rounded-full mx-auto mb-1.5"
                   :class="getStatusDotClass(monitor.status)">
              </div>
              <span class="text-xs text-neutral-400 truncate block">{{ monitor.shortName }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4 pt-4 border-t border-neutral-700/50 text-xs">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span>正常 {{ statusCounts.healthy }}</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-yellow-500"></span>警告 {{ statusCounts.warning }}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span>异常 {{ statusCounts.critical }}</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-neutral-500"></span>离线 {{ statusCounts.offline }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  Activity, BarChart3, PieChart, AlertTriangle, Clock, Server,
  FileText, Users, ThumbsUp, Timer, Ticket, TrendingUp, TrendingDown,
  ChevronRight
} from 'lucide-vue-next'
import { getDashboardStats, getMonitorAlerts, getMonitorList } from '@/api/admin'
import { getTicketList } from '@/api/tickets'
import type { MonitorStatus } from '@/types'

const router = useRouter()

const CountUp = {
  props: {
    endVal: { type: Number, required: true },
    duration: { type: Number, default: 1.5 }
  },
  setup(props) {
    const displayValue = ref(0)
    let startTime: number | null = null
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (props.duration * 1000), 1)
      displayValue.value = Math.floor(progress * props.endVal)
      if (progress < 1) requestAnimationFrame(animate)
      else displayValue.value = props.endVal
    }
    onMounted(() => requestAnimationFrame(animate))
    return () => displayValue.value.toLocaleString()
  }
}

const trendChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
const trendType = ref<'applications' | 'tickets'>('applications')

const statCards = computed(() => [
  { label: '总办件量', value: 28560, suffix: '件', trend: 12.5, icon: FileText, iconColor: 'text-blue-400', gradient: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5', glow: 'bg-blue-500', route: '/admin/services' },
  { label: '今日办件', value: 1234, suffix: '件', trend: 8.3, icon: Activity, iconColor: 'text-cyan-400', gradient: 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5', glow: 'bg-cyan-500', route: '/admin/services' },
  { label: '办结率', value: 89.2, suffix: '%', trend: 2.1, icon: ThumbsUp, iconColor: 'text-green-400', gradient: 'bg-gradient-to-br from-green-500/10 to-green-600/5', glow: 'bg-green-500', route: '/admin/reports' },
  { label: '平均办理时长', value: 2.3, suffix: '天', trend: -5.2, icon: Timer, iconColor: 'text-yellow-400', gradient: 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5', glow: 'bg-yellow-500', route: '/admin/reports' },
  { label: '满意度', value: 96.8, suffix: '%', trend: 1.8, icon: Users, iconColor: 'text-purple-400', gradient: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5', glow: 'bg-purple-500', route: '/admin/evaluations' },
  { label: '诉求工单', value: 178, suffix: '件', trend: -3.5, icon: Ticket, iconColor: 'text-orange-400', gradient: 'bg-gradient-to-br from-orange-500/10 to-orange-600/5', glow: 'bg-orange-500', route: '/admin/tickets' }
])

const activeAlerts = ref<any[]>([])
const pendingTickets = ref<any[]>([])
const systemMonitors = ref<any[]>([])

const statusCounts = computed(() => {
  const counts = { healthy: 0, warning: 0, critical: 0, offline: 0 }
  systemMonitors.value.forEach(m => {
    if (counts[m.status as keyof typeof counts] !== undefined) counts[m.status as keyof typeof counts]++
  })
  return counts
})

const getPriorityClass = (priority: string) => {
  const map: Record<string, string> = {
    urgent: 'bg-red-500/30 text-red-300',
    high: 'bg-orange-500/30 text-orange-300',
    medium: 'bg-yellow-500/30 text-yellow-300',
    low: 'bg-green-500/30 text-green-300'
  }
  return map[priority] || map.medium
}

const getPriorityLabel = (priority: string) => {
  const map: Record<string, string> = { urgent: '紧急', high: '高', medium: '中', low: '低' }
  return map[priority] || '中'
}

const getStatusDotClass = (status: MonitorStatus) => {
  const map: Record<MonitorStatus, string> = {
    healthy: 'bg-green-500 animate-pulse',
    warning: 'bg-yellow-500 animate-pulse',
    critical: 'bg-red-500 animate-pulse',
    offline: 'bg-neutral-500'
  }
  return map[status] || map.offline
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  const chart = echarts.init(trendChartRef.value)
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-06-20')
    d.setDate(d.getDate() - (29 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  const applicationData = [
    820, 850, 910, 890, 950, 1020, 980,
    1050, 1120, 1080, 1150, 1200, 1180, 1250,
    1300, 1280, 1350, 1400, 1380, 1450, 1500,
    1480, 1550, 1600, 1580, 1650, 1700, 1680,
    1750, 12856
  ]
  const completionData = [
    720, 760, 810, 790, 850, 920, 890,
    960, 1020, 990, 1060, 1100, 1080, 1150,
    1200, 1180, 1250, 1300, 1280, 1350, 1400,
    1380, 1450, 1500, 1480, 1550, 1600, 1580,
    1650, 12456
  ]
  const ticketData = [
    110, 115, 120, 118, 125, 130, 128,
    135, 140, 138, 145, 150, 148, 155,
    160, 158, 165, 170, 168, 175, 180,
    178, 185, 190, 188, 195, 200, 198,
    205, 178
  ]
  const resolvedData = [
    95, 100, 105, 103, 110, 115, 113,
    120, 125, 123, 130, 135, 133, 140,
    145, 143, 150, 155, 153, 160, 165,
    163, 170, 175, 173, 180, 185, 183,
    190, 168
  ]
  const getSeries = () => {
    if (trendType.value === 'applications') {
      return [
        { name: '办件量', type: 'line', smooth: true, symbol: 'none', data: applicationData,
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.4)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.02)' } ]) },
          lineStyle: { color: '#3B82F6', width: 2 }, itemStyle: { color: '#3B82F6' } },
        { name: '办结量', type: 'line', smooth: true, symbol: 'none', data: completionData,
          lineStyle: { color: '#2ECC71', width: 2 }, itemStyle: { color: '#2ECC71' } }
      ]
    }
    return [
      { name: '工单数', type: 'line', smooth: true, symbol: 'none', data: ticketData,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(243, 156, 18, 0.4)' }, { offset: 1, color: 'rgba(243, 156, 18, 0.02)' } ]) },
        lineStyle: { color: '#F39C12', width: 2 }, itemStyle: { color: '#F39C12' } },
      { name: '已解决', type: 'line', smooth: true, symbol: 'none', data: resolvedData,
        lineStyle: { color: '#2ECC71', width: 2 }, itemStyle: { color: '#2ECC71' } }
    ]
  }
  chart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(26, 31, 41, 0.95)', borderColor: '#374151', textStyle: { color: '#fff' } },
    legend: { data: trendType.value === 'applications' ? ['办件量', '办结量'] : ['工单数', '已解决'],
      textStyle: { color: '#9CA3AF' }, right: 0, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#6B7280', fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 11 } },
    series: getSeries()
  })
  return chart
}

const initBarChart = () => {
  if (!barChartRef.value) return
  const chart = echarts.init(barChartRef.value)
  const depts = ['市人社局', '市医保局', '市公积金', '市教体局', '市公安局', '市市监局']
  const values = [6780, 5860, 4520, 3890, 3450, 2890]
  chart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(26, 31, 41, 0.95)', borderColor: '#374151', textStyle: { color: '#fff' } },
    grid: { left: 80, right: 20, top: 10, bottom: 20 },
    xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 11 } },
    yAxis: { type: 'category', data: depts.reverse(), axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF', fontSize: 11 } },
    series: [{ type: 'bar', data: values.reverse(), barWidth: 16,
      itemStyle: { borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#06B6D4' }, { offset: 1, color: '#0891B2' } ]) },
      label: { show: true, position: 'right', color: '#9CA3AF', fontSize: 11 } }]
  })
  return chart
}

const initPieChart = () => {
  if (!pieChartRef.value) return
  const chart = echarts.init(pieChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item', backgroundColor: 'rgba(26, 31, 41, 0.95)', borderColor: '#374151', textStyle: { color: '#fff' } },
    legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: '#9CA3AF', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{ type: 'pie', radius: ['45%', '72%'], center: ['35%', '50%'], avoidLabelOverlap: false,
      label: { show: false }, emphasis: { label: { show: true, fontSize: 12, color: '#fff', fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 25, name: '社会保障', itemStyle: { color: '#3B82F6' } },
        { value: 22, name: '医疗保险', itemStyle: { color: '#2ECC71' } },
        { value: 18, name: '住房公积金', itemStyle: { color: '#F39C12' } },
        { value: 12, name: '教育服务', itemStyle: { color: '#9B59B6' } },
        { value: 10, name: '交通出行', itemStyle: { color: '#06B6D4' } },
        { value: 13, name: '其他', itemStyle: { color: '#6B7280' } }
      ] }]
  })
  return chart
}

const loadData = async () => {
  try {
    const [alertsRes, ticketsRes, monitorsRes] = await Promise.all([
      getMonitorAlerts(),
      getTicketList({ page: 1, pageSize: 5, status: 'pending' }),
      getMonitorList({ page: 1, pageSize: 20 })
    ])
    activeAlerts.value = alertsRes.data.filter((a: any) => a.status === 'active').slice(0, 5)
    pendingTickets.value = ticketsRes.data.list
    systemMonitors.value = monitorsRes.data.list.map((m: any) => ({
      ...m,
      shortName: m.name.replace(/业务系统|报名系统|预约系统|征管系统|监管系统|户政系统|服务系统/g, '').substring(0, 4)
    }))
  } catch (e) {
    console.error(e)
  }
}

let trendChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

onMounted(async () => {
  await nextTick()
  trendChart = initTrendChart()
  barChart = initBarChart()
  pieChart = initPieChart()
  loadData()

  window.addEventListener('resize', () => {
    trendChart?.resize()
    barChart?.resize()
    pieChart?.resize()
  })
})

watch(trendType, () => {
  nextTick(() => {
    trendChart?.dispose()
    trendChart = initTrendChart()
  })
})

const handleStatClick = (stat: any) => {
  if (stat.route) {
    router.push(stat.route)
  }
}

const handleTrendChartClick = () => {
  if (trendType.value === 'applications') {
    router.push('/admin/services')
  } else {
    router.push('/admin/tickets')
  }
}

const handleBarChartClick = () => {
  router.push('/admin/reports')
}

const handlePieChartClick = () => {
  router.push('/admin/services')
}

const handleAlertsClick = () => {
  router.push('/admin/monitor')
}

const handleTicketsClick = () => {
  router.push('/admin/tickets')
}

const handleMonitorClick = () => {
  router.push('/admin/monitor')
}
</script>
