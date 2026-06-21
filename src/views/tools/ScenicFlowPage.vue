<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { EChartsOption } from 'echarts'
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sun,
  Cloud,
  Thermometer,
  Calendar,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)

interface ScenicSpot {
  id: string
  name: string
  level: string
  address: string
  image: string
  currentVisitors: number
  maxCapacity: number
  status: 'comfortable' | 'moderate' | 'crowded' | 'full'
  comfortLevel: string
  todayForecast: Array<{
    time: string
    count: number
    level: string
  }>
  weekForecast: Array<{
    day: string
    count: number
    level: string
  }>
  openTime: string
  ticketPrice: string
  rating: number
}

const scenicSpots = ref<ScenicSpot[]>([
  {
    id: 'sc1',
    name: '抚州名人雕塑园',
    level: 'AAAA',
    address: '抚州市临川区临川大道',
    image: '',
    currentVisitors: 1280,
    maxCapacity: 5000,
    status: 'comfortable',
    comfortLevel: '舒适',
    todayForecast: [
      { time: '08:00', count: 300, level: '舒适' },
      { time: '10:00', count: 800, level: '舒适' },
      { time: '12:00', count: 1500, level: '适中' },
      { time: '14:00', count: 1800, level: '适中' },
      { time: '16:00', count: 1600, level: '适中' },
      { time: '18:00', count: 900, level: '舒适' },
    ],
    weekForecast: [
      { day: '周一', count: 1500, level: '舒适' },
      { day: '周二', count: 1800, level: '舒适' },
      { day: '周三', count: 2000, level: '舒适' },
      { day: '周四', count: 2200, level: '适中' },
      { day: '周五', count: 3500, level: '适中' },
      { day: '周六', count: 4200, level: '拥挤' },
      { day: '周日', count: 3800, level: '适中' },
    ],
    openTime: '08:00-18:00',
    ticketPrice: '免费',
    rating: 4.7,
  },
  {
    id: 'sc2',
    name: '大觉山景区',
    level: 'AAAAA',
    address: '抚州市资溪县',
    image: '',
    currentVisitors: 3200,
    maxCapacity: 8000,
    status: 'moderate',
    comfortLevel: '适中',
    todayForecast: [
      { time: '08:00', count: 500, level: '舒适' },
      { time: '10:00', count: 1800, level: '适中' },
      { time: '12:00', count: 3500, level: '适中' },
      { time: '14:00', count: 4200, level: '拥挤' },
      { time: '16:00', count: 3800, level: '适中' },
      { time: '18:00', count: 2000, level: '舒适' },
    ],
    weekForecast: [
      { day: '周一', count: 3000, level: '适中' },
      { day: '周二', count: 3200, level: '适中' },
      { day: '周三', count: 3500, level: '适中' },
      { day: '周四', count: 4000, level: '适中' },
      { day: '周五', count: 5500, level: '拥挤' },
      { day: '周六', count: 7200, level: '拥挤' },
      { day: '周日', count: 6500, level: '拥挤' },
    ],
    openTime: '07:30-17:30',
    ticketPrice: '¥120',
    rating: 4.8,
  },
  {
    id: 'sc3',
    name: '流坑古村',
    level: 'AAAA',
    address: '抚州市乐安县',
    image: '',
    currentVisitors: 860,
    maxCapacity: 3000,
    status: 'comfortable',
    comfortLevel: '舒适',
    todayForecast: [
      { time: '08:00', count: 200, level: '舒适' },
      { time: '10:00', count: 600, level: '舒适' },
      { time: '12:00', count: 1000, level: '舒适' },
      { time: '14:00', count: 1200, level: '适中' },
      { time: '16:00', count: 950, level: '舒适' },
      { time: '18:00', count: 400, level: '舒适' },
    ],
    weekForecast: [
      { day: '周一', count: 1200, level: '舒适' },
      { day: '周二', count: 1000, level: '舒适' },
      { day: '周三', count: 1500, level: '舒适' },
      { day: '周四', count: 1800, level: '舒适' },
      { day: '周五', count: 2200, level: '适中' },
      { day: '周六', count: 2800, level: '适中' },
      { day: '周日', count: 2500, level: '适中' },
    ],
    openTime: '08:00-17:30',
    ticketPrice: '¥60',
    rating: 4.6,
  },
  {
    id: 'sc4',
    name: '临川温泉景区',
    level: 'AAAA',
    address: '抚州市临川区温泉镇',
    image: '',
    currentVisitors: 680,
    maxCapacity: 2000,
    status: 'comfortable',
    comfortLevel: '舒适',
    todayForecast: [
      { time: '08:00', count: 150, level: '舒适' },
      { time: '10:00', count: 400, level: '舒适' },
      { time: '12:00', count: 700, level: '舒适' },
      { time: '14:00', count: 850, level: '舒适' },
      { time: '16:00', count: 750, level: '舒适' },
      { time: '18:00', count: 500, level: '舒适' },
    ],
    weekForecast: [
      { day: '周一', count: 800, level: '舒适' },
      { day: '周二', count: 900, level: '舒适' },
      { day: '周三', count: 1000, level: '舒适' },
      { day: '周四', count: 1200, level: '舒适' },
      { day: '周五', count: 1500, level: '适中' },
      { day: '周六', count: 1800, level: '适中' },
      { day: '周日', count: 1600, level: '适中' },
    ],
    openTime: '09:00-22:00',
    ticketPrice: '¥168',
    rating: 4.5,
  },
])

const selectedSpot = ref<ScenicSpot | null>(null)
const viewMode = ref<'list' | 'detail'>('list')

function getStatusColor(status: string) {
  switch (status) {
    case 'comfortable':
      return 'text-accent-green'
    case 'moderate':
      return 'text-gov-blue'
    case 'crowded':
      return 'text-accent-yellow'
    case 'full':
      return 'text-red-500'
    default:
      return 'text-neutral-500'
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case 'comfortable':
      return 'bg-accent-green/10'
    case 'moderate':
      return 'bg-gov-blue/10'
    case 'crowded':
      return 'bg-accent-yellow/10'
    case 'full':
      return 'bg-red-50'
    default:
      return 'bg-neutral-100'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'comfortable':
      return '舒适'
    case 'moderate':
      return '适中'
    case 'crowded':
      return '拥挤'
    case 'full':
      return '已满'
    default:
      return '未知'
  }
}

function getOccupancyRate(current: number, max: number) {
  return Math.round((current / max) * 100)
}

const totalVisitors = computed(() => {
  return scenicSpots.value.reduce((sum, s) => sum + s.currentVisitors, 0)
})

const comfortableCount = computed(() => {
  return scenicSpots.value.filter((s) => s.status === 'comfortable').length
})

const todayChartOption = computed<EChartsOption>(() => {
  if (!selectedSpot.value) return {}
  const data = selectedSpot.value.todayForecast
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.time),
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
      axisLabel: { color: '#6B7280' },
    },
    series: [
      {
        type: 'line',
        data: data.map((d) => d.count),
        smooth: true,
        itemStyle: { color: '#1E5AA8' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30, 90, 168, 0.3)' },
              { offset: 1, color: 'rgba(30, 90, 168, 0.02)' },
            ],
          },
        },
        lineStyle: { width: 3 },
      },
    ],
  }
})

const weekChartOption = computed<EChartsOption>(() => {
  if (!selectedSpot.value) return {}
  const data = selectedSpot.value.weekForecast
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.day),
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
      axisLabel: { color: '#6B7280' },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#2ECC71' },
              { offset: 1, color: '#27AE60' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: 32,
      },
    ],
  }
})

function viewDetail(spot: ScenicSpot) {
  selectedSpot.value = spot
  viewMode.value = 'detail'
}

function goBack() {
  if (viewMode.value === 'detail') {
    viewMode.value = 'list'
    selectedSpot.value = null
  } else {
    router.push('/tools')
  }
}

function refreshData() {
  loading.value = true
  setTimeout(() => {
    scenicSpots.value = scenicSpots.value.map((spot): ScenicSpot => {
      const newVisitors = Math.max(
        100,
        Math.round(spot.currentVisitors + Math.floor(Math.random() * 400 - 200))
      )
      const rate = getOccupancyRate(newVisitors, spot.maxCapacity)
      let status: ScenicSpot['status']
      if (rate < 30) status = 'comfortable'
      else if (rate < 60) status = 'moderate'
      else if (rate < 90) status = 'crowded'
      else status = 'full'
      return {
        ...spot,
        currentVisitors: newVisitors,
        status,
      }
    })
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 800)
}

onMounted(() => {
})
</script>

<template>
  <div class="container py-8">
    <button @click="goBack" class="flex items-center gap-2 text-neutral-500 hover:text-gov-blue mb-4 transition-colors">
      <ArrowLeft class="w-4 h-4" />
      <span>{{ viewMode === 'detail' ? '返回列表' : '返回工具列表' }}</span>
    </button>

    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <Users class="w-5 h-5 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-neutral-800">景区客流查询</h1>
      </div>
      <p class="text-neutral-500 ml-13">实时查询各景区人流情况，错峰出行</p>
    </div>

    <template v-if="viewMode === 'list'">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-500 mb-1">实时在园人数</p>
              <p class="text-2xl font-bold text-gov-blue">{{ totalVisitors.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 bg-gov-blue/10 rounded-xl flex items-center justify-center">
              <Users class="w-6 h-6 text-gov-blue" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-500 mb-1">舒适景区</p>
              <p class="text-2xl font-bold text-accent-green">{{ comfortableCount }}</p>
            </div>
            <div class="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center">
              <CheckCircle class="w-6 h-6 text-accent-green" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-500 mb-1">适中景区</p>
              <p class="text-2xl font-bold text-accent-yellow">
                {{ scenicSpots.filter((s) => s.status === 'moderate').length }}
              </p>
            </div>
            <div class="w-12 h-12 bg-accent-yellow/10 rounded-xl flex items-center justify-center">
              <AlertTriangle class="w-6 h-6 text-accent-yellow" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-500 mb-1">今日天气</p>
              <div class="flex items-center gap-2">
                <Sun class="w-5 h-5 text-amber-500" />
                <span class="text-lg font-semibold text-neutral-700">26°C</span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-neutral-400">晴</p>
              <p class="text-xs text-neutral-400">适宜出行</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <h3 class="font-medium text-neutral-700">景区列表</h3>
        <button @click="refreshData" :disabled="loading" class="text-sm text-gov-blue flex items-center gap-1">
          <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
          刷新数据
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="spot in scenicSpots"
          :key="spot.id"
          @click="viewDetail(spot)"
          class="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div class="flex items-start gap-4">
            <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin class="w-8 h-8 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-semibold text-neutral-800">{{ spot.name }}</h4>
                <span class="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">{{ spot.level }}</span>
              </div>
              <p class="text-sm text-neutral-500 mb-3 flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5" />
                {{ spot.address }}
              </p>
              
              <div class="mb-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-neutral-500">当前客流</span>
                  <span :class="['text-sm font-medium', getStatusColor(spot.status)]">
                    {{ getStatusText(spot.status) }}
                  </span>
                </div>
                <div class="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    :class="[
                      'h-full rounded-full transition-all',
                      spot.status === 'comfortable' && 'bg-accent-green',
                      spot.status === 'moderate' && 'bg-gov-blue',
                      spot.status === 'crowded' && 'bg-accent-yellow',
                      spot.status === 'full' && 'bg-red-500',
                    ]"
                    :style="{ width: getOccupancyRate(spot.currentVisitors, spot.maxCapacity) + '%' }"
                  ></div>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-xs text-neutral-400">{{ spot.currentVisitors }}人</span>
                  <span class="text-xs text-neutral-400">最大承载 {{ spot.maxCapacity }}人</span>
                </div>
              </div>

              <div class="flex items-center gap-4 text-xs text-neutral-500">
                <span class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" />
                  {{ spot.openTime }}
                </span>
                <span class="flex items-center gap-1">
                  <span class="text-accent-yellow font-medium">{{ spot.ticketPrice }}</span>
                </span>
                <span class="flex items-center gap-1">
                  <span class="text-amber-500">★ {{ spot.rating }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="viewMode === 'detail' && selectedSpot">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <div class="flex items-start gap-4 mb-6">
              <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <MapPin class="w-8 h-8 text-white" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h2 class="text-xl font-bold text-neutral-800">{{ selectedSpot.name }}</h2>
                  <span class="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded">{{ selectedSpot.level }}</span>
                </div>
                <p class="text-sm text-neutral-500 flex items-center gap-1">
                  <MapPin class="w-4 h-4" />
                  {{ selectedSpot.address }}
                </p>
              </div>
              <div :class="['px-4 py-2 rounded-lg text-center', getStatusBg(selectedSpot.status)]">
                <p :class="['text-lg font-bold', getStatusColor(selectedSpot.status)]">
                  {{ getStatusText(selectedSpot.status) }}
                </p>
                <p class="text-xs text-neutral-500">当前状态</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-4 bg-neutral-50 rounded-lg">
                <p class="text-2xl font-bold text-gov-blue">{{ selectedSpot.currentVisitors }}</p>
                <p class="text-sm text-neutral-500">当前在园</p>
              </div>
              <div class="text-center p-4 bg-neutral-50 rounded-lg">
                <p class="text-2xl font-bold text-neutral-700">{{ selectedSpot.maxCapacity }}</p>
                <p class="text-sm text-neutral-500">最大承载</p>
              </div>
              <div class="text-center p-4 bg-neutral-50 rounded-lg">
                <p class="text-2xl font-bold text-accent-green">{{ getOccupancyRate(selectedSpot.currentVisitors, selectedSpot.maxCapacity) }}%</p>
                <p class="text-sm text-neutral-500">饱和度</p>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="section-title mb-0">今日客流趋势</h3>
              <span class="text-xs text-neutral-400 flex items-center gap-1">
                <TrendingUp class="w-3.5 h-3.5 text-accent-green" />
                实时更新
              </span>
            </div>
            <v-chart class="h-64" :option="todayChartOption" autoresize />
          </div>

          <div class="card">
            <h3 class="section-title">未来7天客流预测</h3>
            <v-chart class="h-64" :option="weekChartOption" autoresize />
          </div>
        </div>

        <div class="space-y-6">
          <div class="card">
            <h3 class="section-title">景区信息</h3>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <Clock class="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm text-neutral-700 font-medium">开放时间</p>
                  <p class="text-sm text-neutral-500">{{ selectedSpot.openTime }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-lg">🎫</span>
                <div>
                  <p class="text-sm text-neutral-700 font-medium">门票价格</p>
                  <p class="text-sm text-accent-yellow font-semibold">{{ selectedSpot.ticketPrice }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-lg">⭐</span>
                <div>
                  <p class="text-sm text-neutral-700 font-medium">景区评分</p>
                  <p class="text-sm text-amber-500 font-medium">{{ selectedSpot.rating }} 分</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-lg">☀️</span>
                <div>
                  <p class="text-sm text-neutral-700 font-medium">今日天气</p>
                  <p class="text-sm text-neutral-500">晴 24°C - 28°C</p>
                  <p class="text-xs text-neutral-400">紫外线中等</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">出行建议</h3>
            <div class="space-y-3">
              <div class="flex items-start gap-2 p-3 bg-accent-green/5 rounded-lg">
                <CheckCircle class="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-neutral-700">推荐出行</p>
                  <p class="text-xs text-neutral-500">当前客流适中，体验较好</p>
                </div>
              </div>
              <div class="flex items-start gap-2 p-3 bg-gov-blue/5 rounded-lg">
                <Clock class="w-5 h-5 text-gov-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-neutral-700">最佳时段</p>
                  <p class="text-xs text-neutral-500">上午 9:00-11:00</p>
                  <p class="text-xs text-neutral-500">下午 15:00-17:00</p>
                </div>
              </div>
              <div class="flex items-start gap-2 p-3 bg-accent-yellow/5 rounded-lg">
                <AlertTriangle class="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-neutral-700">避开高峰</p>
                  <p class="text-xs text-neutral-500">周末下午 13:00-15:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
