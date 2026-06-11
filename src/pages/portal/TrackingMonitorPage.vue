<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">运单追踪监控</h1>
      <p class="text-gray-500">实时查看运单位置、温湿度及运输状态</p>
    </div>

    <div class="card-base p-6 mb-8">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <component :is="icons.Search" class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchWaybillNo"
            class="input-base pl-12"
            placeholder="请输入运单号，如：DB2026061100001"
            @keyup.enter="queryTracking"
          />
        </div>
        <button class="btn-primary px-8" @click="queryTracking">
          <component :is="icons.Search" class="w-4 h-4 mr-1" />
          查询
        </button>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <span class="text-xs text-gray-500">快速查询：</span>
        <button
          v-for="no in quickWaybills"
          :key="no"
          class="text-xs px-2 py-1 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 rounded transition-colors"
          @click="searchWaybillNo = no; queryTracking()"
        >
          {{ no }}
        </button>
      </div>
    </div>

    <div class="card-base p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center">
            <component :is="icons.FileText" class="w-7 h-7 text-brand-500" />
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">运单号</div>
            <div class="font-semibold text-gray-900">{{ waybillNo }}</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center">
            <component :is="icons.Truck" class="w-7 h-7 text-green-500" />
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">运单状态</div>
            <div class="font-semibold text-green-600">运输中</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-alert-50 flex items-center justify-center">
            <component :is="icons.MapPin" class="w-7 h-7 text-alert-500" />
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">当前位置</div>
            <div class="font-semibold text-gray-900">{{ latestData?.location || '-' }}</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center">
            <component :is="icons.Clock" class="w-7 h-7 text-brand-500" />
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">预计到达</div>
            <div class="font-semibold text-gray-900">2026-06-13 18:00</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card-base p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <component :is="icons.Thermometer" class="w-5 h-5 text-red-500" />
                <span class="text-sm text-gray-600">当前温度</span>
              </div>
              <span :class="temperatureAbnormal ? 'badge badge-danger' : 'badge badge-info'">
                {{ temperatureAbnormal ? '异常' : '正常' }}
              </span>
            </div>
            <div class="font-din text-3xl font-bold text-gray-900">
              {{ latestData?.temperature.toFixed(1) }}<span class="text-lg font-normal text-gray-500 ml-1">℃</span>
            </div>
            <div class="text-xs text-gray-400 mt-1">正常范围: -5~40℃</div>
          </div>
          <div class="card-base p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <component :is="icons.Droplets" class="w-5 h-5 text-blue-500" />
                <span class="text-sm text-gray-600">当前湿度</span>
              </div>
              <span :class="humidityAbnormal ? 'badge badge-danger' : 'badge badge-info'">
                {{ humidityAbnormal ? '异常' : '正常' }}
              </span>
            </div>
            <div class="font-din text-3xl font-bold text-gray-900">
              {{ latestData?.humidity.toFixed(1) }}<span class="text-lg font-normal text-gray-500 ml-1">%RH</span>
            </div>
            <div class="text-xs text-gray-400 mt-1">正常范围: 30~80%RH</div>
          </div>
          <div class="card-base p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <component :is="icons.Activity" class="w-5 h-5 text-alert-500" />
                <span class="text-sm text-gray-600">震动加速度</span>
              </div>
              <span :class="vibrationAbnormal ? 'badge badge-danger' : 'badge badge-info'">
                {{ vibrationAbnormal ? '超标' : '正常' }}
              </span>
            </div>
            <div class="font-din text-3xl font-bold text-gray-900">
              {{ latestData?.vibration.toFixed(2) }}<span class="text-lg font-normal text-gray-500 ml-1">g</span>
            </div>
            <div class="text-xs text-gray-400 mt-1">阈值: 5g</div>
          </div>
        </div>

        <div class="card-base p-6">
          <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <component :is="icons.Thermometer" class="w-5 h-5 text-brand-500" />
            温度趋势（近24小时）
          </h3>
          <div ref="tempChartRef" class="h-64"></div>
        </div>

        <div class="card-base p-6">
          <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <component :is="icons.Droplets" class="w-5 h-5 text-brand-500" />
            湿度趋势（近24小时）
          </h3>
          <div ref="humidityChartRef" class="h-64"></div>
        </div>

        <div class="card-base p-6">
          <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <component :is="icons.Activity" class="w-5 h-5 text-brand-500" />
            震动趋势（近24小时）
          </h3>
          <div ref="vibrationChartRef" class="h-64"></div>
        </div>
      </div>

      <div class="space-y-8">
        <div class="card-base p-6">
          <h3 class="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <component :is="icons.Route" class="w-5 h-5 text-brand-500" />
            运输轨迹
          </h3>

          <div class="relative">
            <div class="flex items-center justify-between mb-6">
              <div class="text-center">
                <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-2">
                  <component :is="icons.MapPin" class="w-5 h-5 text-white" />
                </div>
                <div class="text-xs font-medium text-gray-900">深圳</div>
                <div class="text-xs text-gray-500">6/11 08:00</div>
              </div>
              <div class="text-center">
                <div class="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center mx-auto mb-2 relative">
                  <div class="absolute inset-0 rounded-full bg-brand-500/30 animate-ping"></div>
                  <component :is="icons.Truck" class="w-5 h-5 text-white relative z-10" />
                </div>
                <div class="text-xs font-medium text-brand-600">郑州</div>
                <div class="text-xs text-gray-500">{{ progress }}%</div>
              </div>
              <div class="text-center">
                <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-2">
                  <component :is="icons.Flag" class="w-5 h-5 text-white" />
                </div>
                <div class="text-xs font-medium text-gray-900">北京</div>
                <div class="text-xs text-gray-500">预计6/13</div>
              </div>
            </div>

            <div class="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div
                class="h-full bg-gradient-to-r from-green-500 via-brand-500 to-brand-500 rounded-full transition-all duration-1000"
                :style="{ width: progress + '%' }"
              ></div>
              <div
                class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-brand-500 shadow-lg transition-all duration-1000"
                :style="{ left: `calc(${progress}% - 8px)` }"
              ></div>
            </div>

            <div class="space-y-1 text-xs">
              <div class="flex justify-between text-gray-500">
                <span>车速</span>
                <span class="text-gray-900 font-medium">{{ latestData?.speed || 0 }} km/h</span>
              </div>
              <div class="flex justify-between text-gray-500">
                <span>经度</span>
                <span class="text-gray-900 font-mono">{{ latestData?.longitude?.toFixed(6) || '-' }}</span>
              </div>
              <div class="flex justify-between text-gray-500">
                <span>纬度</span>
                <span class="text-gray-900 font-mono">{{ latestData?.latitude?.toFixed(6) || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-base p-6">
          <h3 class="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <component :is="icons.AlertTriangle" class="w-5 h-5 text-alert-500" />
            告警事件
            <span v-if="unacknowledgedCount > 0" class="badge badge-danger ml-auto">{{ unacknowledgedCount }} 未处理</span>
          </h3>

          <div v-if="alerts.length === 0" class="text-center py-8 text-gray-400">
            <component :is="icons.CheckCircle" class="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p class="text-sm">暂无告警事件</p>
          </div>

          <div v-else class="space-y-4 max-h-96 overflow-y-auto">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="pl-4 py-3 border-l-4 relative"
              :class="alert.level === 'critical' ? 'border-red-500 bg-red-50/50' : 'border-alert-500 bg-alert-50/50'"
            >
              <div class="flex items-start justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span
                    class="badge"
                    :class="alert.level === 'critical' ? 'badge-danger' : 'badge-warning'"
                  >
                    {{ alert.level === 'critical' ? '严重' : '警告' }}
                  </span>
                  <span class="text-sm font-medium text-gray-900">{{ getAlertTypeName(alert.type) }}</span>
                </div>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="alert.acknowledged ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                >
                  {{ alert.acknowledged ? '已处理' : '待处理' }}
                </span>
              </div>
              <div class="text-sm text-gray-700 mb-1">{{ alert.message }}</div>
              <div class="text-xs text-gray-500 flex items-center gap-3">
                <span class="flex items-center gap-1">
                  <component :is="icons.MapPin" class="w-3 h-3" />
                  {{ alert.location }}
                </span>
                <span class="flex items-center gap-1">
                  <component :is="icons.Clock" class="w-3 h-3" />
                  {{ alert.timestamp }}
                </span>
              </div>
              <div v-if="alert.acknowledged && alert.acknowledgedBy" class="text-xs text-green-600 mt-1">
                处置记录：{{ alert.acknowledgedBy }} · {{ alert.acknowledgedAt }}
              </div>
              <div v-if="!alert.acknowledged" class="mt-2">
                <button
                  class="text-xs px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
                  @click="handleAcknowledge(alert)"
                >
                  确认处理
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import {
  Search, FileText, Truck, MapPin, Clock, Thermometer, Droplets,
  Activity, Route, Flag, AlertTriangle, CheckCircle
} from 'lucide-vue-next'
import { generateMonitorData, mockAlerts } from '@/mock'
import { checkThreshold } from '@/utils/logistics'
import type { MonitorData, AlertEvent, AlertType } from '@/types'

const icons = {
  Search, FileText, Truck, MapPin, Clock, Thermometer, Droplets,
  Activity, Route, Flag, AlertTriangle, CheckCircle
}

const route = useRoute()

const searchWaybillNo = ref('DB2026061100001')
const waybillNo = ref('DB2026061100001')
const quickWaybills = ['DB2026061100001', 'DB2026061100002', 'DB2026061100003']

const monitorDataCache = new Map<string, MonitorData[]>()
const monitorData = ref<MonitorData[]>([])
const alerts = ref<AlertEvent[]>([])
const progressCache = new Map<string, number>()

const tempChartRef = ref<HTMLElement | null>(null)
const humidityChartRef = ref<HTMLElement | null>(null)
const vibrationChartRef = ref<HTMLElement | null>(null)

let tempChart: echarts.ECharts | null = null
let humidityChart: echarts.ECharts | null = null
let vibrationChart: echarts.ECharts | null = null

const latestData = computed(() => monitorData.value[monitorData.value.length - 1])
const progress = ref(62)

const unacknowledgedCount = computed(() => alerts.value.filter(a => !a.acknowledged).length)

const temperatureAbnormal = computed(() => {
  const t = latestData.value?.temperature
  return t !== undefined && (t > 40 || t < -5)
})

const humidityAbnormal = computed(() => {
  const h = latestData.value?.humidity
  return h !== undefined && (h > 80 || h < 30)
})

const vibrationAbnormal = computed(() => {
  const v = latestData.value?.vibration
  return v !== undefined && v > 5
})

let alertIdCounter = 0

function getAlertTypeName(type: string) {
  const map: Record<string, string> = {
    temperature: '温度异常',
    humidity: '湿度异常',
    vibration: '震动异常',
    geo: '地理围栏'
  }
  return map[type] || type
}

function scanAlertsFromData(data: MonitorData[], wbn: string): AlertEvent[] {
  const result: AlertEvent[] = []
  const seen = new Set<string>()

  for (const d of data) {
    const types: AlertType[] = ['temperature', 'humidity', 'vibration']
    for (const type of types) {
      const value = type === 'temperature' ? d.temperature : type === 'humidity' ? d.humidity : d.vibration
      const profile = type === 'vibration' ? 'standard' : 'standard'
      const check = checkThreshold(type, value, profile)
      if (check.level && check.message) {
        const key = `${type}-${d.timestamp}`
        if (!seen.has(key)) {
          seen.add(key)
          alertIdCounter++
          result.push({
            id: `dynamic-${alertIdCounter}`,
            waybillNo: wbn,
            type,
            level: check.level,
            value,
            threshold: check.threshold,
            unit: type === 'temperature' ? '℃' : type === 'humidity' ? '%RH' : 'g',
            timestamp: d.timestamp,
            location: d.location,
            message: check.message,
            acknowledged: false
          })
        }
      }
    }
  }

  return result
}

function buildAlerts(data: MonitorData[], wbn: string) {
  const dynamicAlerts = scanAlertsFromData(data, wbn)
  const staticAlerts = mockAlerts.filter(a => a.waybillNo === wbn)
  if (staticAlerts.length === 0) {
    const fallback = mockAlerts.slice(0, 2).map(a => ({ ...a, waybillNo: wbn }))
    staticAlerts.push(...fallback)
  }

  const seen = new Set<string>()
  const merged: AlertEvent[] = []

  for (const a of staticAlerts) {
    const key = `${a.type}-${a.timestamp}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push({ ...a })
    }
  }

  for (const a of dynamicAlerts) {
    const key = `${a.type}-${a.timestamp}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(a)
    }
  }

  merged.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  alerts.value = merged
}

function queryTracking() {
  if (!searchWaybillNo.value) return
  waybillNo.value = searchWaybillNo.value

  if (!monitorDataCache.has(waybillNo.value)) {
    monitorDataCache.set(waybillNo.value, generateMonitorData(24))
  }
  monitorData.value = monitorDataCache.get(waybillNo.value)!

  if (!progressCache.has(waybillNo.value)) {
    progressCache.set(waybillNo.value, 30 + Math.floor(Math.random() * 50))
  }
  progress.value = progressCache.get(waybillNo.value)!

  buildAlerts(monitorData.value, waybillNo.value)

  nextTick(() => {
    initCharts()
  })
}

function handleAcknowledge(alert: AlertEvent) {
  if (alert.acknowledged) return
  if (!window.confirm(`确认处理告警：${alert.message}？`)) return

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const idx = alerts.value.findIndex(a => a.id === alert.id)
  if (idx !== -1) {
    alerts.value[idx] = {
      ...alerts.value[idx],
      acknowledged: true,
      acknowledgedBy: '当前用户',
      acknowledgedAt: now
    }
  }
}

function baseOption(xData: string[], yData: number[], color: string, unit: string, max?: number) {
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        return `${p.axisValue}<br/>${p.marker} ${p.value}${unit}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#9CA3AF', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      max,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
      axisLabel: { color: '#9CA3AF', fontSize: 10 }
    },
    series: [{
      data: yData,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '40' },
          { offset: 1, color: color + '05' }
        ])
      }
    }]
  }
}

function initCharts() {
  if (monitorData.value.length === 0) return

  const xData = monitorData.value.map(d => d.timestamp.substring(11, 16))
  const tempData = monitorData.value.map(d => d.temperature)
  const humidityData = monitorData.value.map(d => d.humidity)
  const vibrationData = monitorData.value.map(d => d.vibration)

  if (tempChartRef.value) {
    if (tempChart) tempChart.dispose()
    tempChart = echarts.init(tempChartRef.value)
    tempChart.setOption(baseOption(xData, tempData, '#EF4444', '℃', 50))
  }

  if (humidityChartRef.value) {
    if (humidityChart) humidityChart.dispose()
    humidityChart = echarts.init(humidityChartRef.value)
    humidityChart.setOption(baseOption(xData, humidityData, '#3B82F6', '%RH', 100))
  }

  if (vibrationChartRef.value) {
    if (vibrationChart) vibrationChart.dispose()
    vibrationChart = echarts.init(vibrationChartRef.value)
    vibrationChart.setOption(baseOption(xData, vibrationData, '#FF6A00', 'g', 10))
  }
}

function handleResize() {
  tempChart?.resize()
  humidityChart?.resize()
  vibrationChart?.resize()
}

watch(() => route.params.waybillNo, (val) => {
  if (val) {
    searchWaybillNo.value = val as string
    queryTracking()
  }
})

onMounted(() => {
  if (route.params.waybillNo) {
    searchWaybillNo.value = route.params.waybillNo as string
  }
  queryTracking()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  tempChart?.dispose()
  humidityChart?.dispose()
  vibrationChart?.dispose()
})
</script>
