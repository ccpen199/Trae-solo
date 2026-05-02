<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">设备详情</h1>
        <p class="text-gray-500">实时监控设备运行状态</p>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          @click="collectData"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <span>采集数据</span>
        </button>
        <button 
          @click="goBack"
          class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          返回列表
        </button>
      </div>
    </div>

    <div v-if="device" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="flex items-center space-x-4">
          <div 
            class="w-16 h-16 rounded-xl flex items-center justify-center"
            :class="device.status === 'online' ? 'bg-green-100' : 'bg-gray-100'"
          >
            <svg 
              class="w-8 h-8" 
              :class="device.status === 'online' ? 'text-green-600' : 'text-gray-400'"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-800">{{ device.device_name }}</h3>
            <p class="text-sm text-gray-500">{{ device.device_code }}</p>
            <span 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2"
              :class="device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            >
              <span 
                class="w-1.5 h-1.5 rounded-full mr-1.5"
                :class="device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'"
              ></span>
              {{ device.status === 'online' ? '在线' : '离线' }}
            </span>
          </div>
        </div>
        
        <div>
          <p class="text-sm text-gray-500 mb-1">设备类型</p>
          <p class="text-lg font-medium text-gray-800">{{ device.device_type }}</p>
        </div>
        
        <div>
          <p class="text-sm text-gray-500 mb-1">安装位置</p>
          <p class="text-lg font-medium text-gray-800">{{ device.location || '-' }}</p>
        </div>
        
        <div>
          <p class="text-sm text-gray-500 mb-1">额定功率</p>
          <p class="text-lg font-medium text-gray-800">{{ device.rated_power ? device.rated_power + ' kW' : '-' }}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
        <div>
          <p class="text-sm text-gray-500 mb-1">通信协议</p>
          <p class="text-sm font-medium text-gray-800">{{ device.protocol || '-' }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">IP地址</p>
          <p class="text-sm font-medium text-gray-800 font-mono">{{ device.ip_address || '-' }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">最后在线时间</p>
          <p class="text-sm font-medium text-gray-800">{{ device.last_online_at ? formatDateTime(device.last_online_at) : '-' }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">实时功率曲线</h3>
        <div ref="powerChartRef" class="h-64"></div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">电压电流曲线</h3>
        <div ref="voltageChartRef" class="h-64"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p class="text-sm text-gray-500 mb-1">有功功率</p>
        <p class="text-2xl font-bold text-blue-600">{{ latestData?.active_power?.toFixed(2) || 0 }}</p>
        <p class="text-xs text-gray-400">kW</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p class="text-sm text-gray-500 mb-1">无功功率</p>
        <p class="text-2xl font-bold text-purple-600">{{ latestData?.reactive_power?.toFixed(2) || 0 }}</p>
        <p class="text-xs text-gray-400">kVar</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p class="text-sm text-gray-500 mb-1">电压</p>
        <p class="text-2xl font-bold text-green-600">{{ latestData?.voltage?.toFixed(1) || 0 }}</p>
        <p class="text-xs text-gray-400">V</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p class="text-sm text-gray-500 mb-1">功率因数</p>
        <p class="text-2xl font-bold text-indigo-600">{{ latestData?.power_factor?.toFixed(3) || 0 }}</p>
        <p class="text-xs text-gray-400">{{ latestData?.power_factor >= 0.9 ? '优秀' : latestData?.power_factor >= 0.8 ? '良好' : '偏低' }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">历史数据</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有功功率</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">无功功率</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电压</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电流</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">功率因数</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="data in meterData.slice(-20).reverse()" :key="data.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDateTime(data.timestamp) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ data.active_power?.toFixed(2) || 0 }} kW
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ data.reactive_power?.toFixed(2) || 0 }} kVar
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ data.voltage?.toFixed(1) || 0 }} V
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ data.current?.toFixed(3) || 0 }} A
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="(data.power_factor || 0) >= 0.9 ? 'bg-green-100 text-green-800' : (data.power_factor || 0) >= 0.8 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'"
                >
                  {{ data.power_factor?.toFixed(3) || 0 }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { api } from '../utils/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const deviceId = ref(route.params.id)
const device = ref(null)
const meterData = ref([])
const latestData = ref(null)

const powerChartRef = ref(null)
const voltageChartRef = ref(null)

let powerChart = null
let voltageChart = null

const goBack = () => {
  router.push('/devices')
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')
}

const fetchDevice = async () => {
  try {
    const response = await api.get(`/api/devices/${deviceId.value}`)
    device.value = response.data
  } catch (err) {
    console.error('获取设备信息失败:', err)
  }
}

const fetchMeterData = async () => {
  try {
    const response = await api.get(`/api/devices/${deviceId.value}/meter-data`, {
      params: { hours: 24 }
    })
    meterData.value = response.data
    latestData.value = meterData.value[meterData.value.length - 1] || null
    updateCharts()
  } catch (err) {
    console.error('获取表计数据失败:', err)
  }
}

const collectData = async () => {
  try {
    const response = await api.post(`/api/devices/${deviceId.value}/collect`)
    if (response.data.success) {
      alert('数据采集成功！')
      fetchMeterData()
    } else {
      alert('数据采集失败')
    }
  } catch (err) {
    console.error('采集数据失败:', err)
    alert('采集数据失败')
  }
}

const updateCharts = () => {
  if (!powerChartRef.value || !voltageChartRef.value) return
  
  const data = meterData.value.slice(-60)
  const times = data.map(d => dayjs(d.timestamp).format('HH:mm'))
  
  if (!powerChart) {
    powerChart = echarts.init(powerChartRef.value)
  }
  
  const powerOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: times, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', name: 'kW', axisLabel: { fontSize: 10 } },
    series: [{
      name: '有功功率',
      type: 'line',
      smooth: true,
      data: data.map(d => d.active_power || 0),
      areaStyle: { color: 'rgba(59, 130, 246, 0.3)' },
      lineStyle: { color: '#3B82F6', width: 2 },
      itemStyle: { color: '#3B82F6' }
    }, {
      name: '无功功率',
      type: 'line',
      smooth: true,
      data: data.map(d => d.reactive_power || 0),
      lineStyle: { color: '#8B5CF6', width: 2, type: 'dashed' },
      itemStyle: { color: '#8B5CF6' }
    }]
  }
  
  powerChart.setOption(powerOption)
  
  if (!voltageChart) {
    voltageChart = echarts.init(voltageChartRef.value)
  }
  
  const voltageOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: times, axisLabel: { fontSize: 10 } },
    yAxis: [
      { type: 'value', name: 'V', axisLabel: { fontSize: 10 } },
      { type: 'value', name: 'A', axisLabel: { fontSize: 10 } }
    ],
    series: [{
      name: '电压',
      type: 'line',
      smooth: true,
      data: data.map(d => d.voltage || 0),
      lineStyle: { color: '#10B981', width: 2 },
      itemStyle: { color: '#10B981' }
    }, {
      name: '电流',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: data.map(d => d.current || 0),
      lineStyle: { color: '#F59E0B', width: 2 },
      itemStyle: { color: '#F59E0B' }
    }]
  }
  
  voltageChart.setOption(voltageOption)
}

const handleResize = () => {
  powerChart?.resize()
  voltageChart?.resize()
}

onMounted(async () => {
  await Promise.all([fetchDevice(), fetchMeterData()])
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  powerChart?.dispose()
  voltageChart?.dispose()
})
</script>
