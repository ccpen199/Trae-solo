<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">设备时间线</h1>
        <p class="text-gray-500">追踪设备完整运行轨迹</p>
      </div>
      <div class="flex items-center space-x-3">
        <select 
          v-model="selectedDeviceId" 
          @change="fetchTimeline"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">选择设备</option>
          <option v-for="device in devices" :key="device.id" :value="device.id">
            {{ device.device_name }} ({{ device.device_code }})
          </option>
        </select>
        <select 
          v-model="hours" 
          @change="fetchTimeline"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="24">近24小时</option>
          <option value="48">近48小时</option>
          <option value="168">近7天</option>
        </select>
      </div>
    </div>

    <div v-if="timeline" class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
        <p class="text-sm text-gray-500 mb-1">数据点数</p>
        <p class="text-2xl font-bold text-blue-600">{{ timeline.statistics?.meter_data_points || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-yellow-100">
        <p class="text-sm text-gray-500 mb-1">状态变更</p>
        <p class="text-2xl font-bold text-yellow-600">{{ timeline.statistics?.status_changes || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-red-100">
        <p class="text-sm text-gray-500 mb-1">告警事件</p>
        <p class="text-2xl font-bold text-red-600">{{ timeline.statistics?.alarms || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">通讯交互</p>
        <p class="text-2xl font-bold text-gray-600">{{ timeline.statistics?.protocol_interactions || 0 }}</p>
      </div>
    </div>

    <div v-if="timeline && timeline.timeline" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-6">事件时间线</h3>
      
      <div class="relative">
        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div class="space-y-6">
          <div 
            v-for="(item, index) in timeline.timeline" 
            :key="index"
            class="relative pl-12"
          >
            <div 
              class="absolute left-2.5 w-3 h-3 rounded-full border-2 border-white"
              :class="getTimelineDotClass(item.type)"
            ></div>
            
            <div 
              class="rounded-lg p-4"
              :class="getTimelineBgClass(item.type)"
            >
              <div class="flex items-center justify-between mb-2">
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="getTimelineLabelClass(item.type)"
                >
                  {{ getTimelineTypeText(item.type) }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatDateTime(item.time) }}
                </span>
              </div>
              
              <div v-if="item.type === 'meter_data'" class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span class="text-gray-500">有功功率:</span>
                  <span class="font-medium text-gray-800 ml-1">{{ item.data.active_power?.toFixed(2) || 0 }} kW</span>
                </div>
                <div>
                  <span class="text-gray-500">电压:</span>
                  <span class="font-medium text-gray-800 ml-1">{{ item.data.voltage?.toFixed(1) || 0 }} V</span>
                </div>
                <div>
                  <span class="text-gray-500">电流:</span>
                  <span class="font-medium text-gray-800 ml-1">{{ item.data.current?.toFixed(3) || 0 }} A</span>
                </div>
                <div>
                  <span class="text-gray-500">功率因数:</span>
                  <span 
                    class="font-medium ml-1"
                    :class="(item.data.power_factor || 0) >= 0.9 ? 'text-green-600' : 'text-yellow-600'"
                  >
                    {{ item.data.power_factor?.toFixed(3) || 0 }}
                  </span>
                </div>
              </div>
              
              <div v-else-if="item.type === 'status_change'" class="text-sm">
                <div class="flex items-center space-x-2">
                  <span class="text-gray-600">状态变更:</span>
                  <span 
                    class="px-2 py-0.5 rounded text-xs"
                    :class="item.data.from === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ item.data.from === 'online' ? '在线' : '离线' }}
                  </span>
                  <span class="text-gray-400">→</span>
                  <span 
                    class="px-2 py-0.5 rounded text-xs"
                    :class="item.data.to === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ item.data.to === 'online' ? '在线' : '离线' }}
                  </span>
                </div>
                <p v-if="item.data.reason" class="text-gray-500 mt-1">
                  原因: {{ item.data.reason }}
                </p>
                <p v-if="item.data.operator" class="text-gray-500">
                  操作者: {{ item.data.operator }}
                </p>
              </div>
              
              <div v-else-if="item.type === 'alarm'" class="text-sm">
                <div class="flex items-center space-x-2 mb-1">
                  <span 
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="item.data.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ item.data.level === 'critical' ? '紧急' : item.data.level === 'high' ? '高' : item.data.level }}
                  </span>
                  <span class="font-medium text-gray-800">{{ item.data.title }}</span>
                </div>
                <p class="text-gray-500">{{ item.data.type }}</p>
              </div>
              
              <div v-else-if="item.type === 'protocol'" class="text-sm">
                <div class="flex items-center space-x-2">
                  <span :class="item.data.direction === 'outbound' ? 'text-blue-600' : 'text-green-600'">
                    {{ item.data.direction === 'outbound' ? '→' : '←' }}
                  </span>
                  <span class="font-medium text-gray-800">{{ item.data.protocol }}</span>
                  <span class="text-gray-500">-</span>
                  <span class="text-gray-600">{{ item.data.command }}</span>
                  <span 
                    class="px-2 py-0.5 rounded text-xs"
                    :class="item.data.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ item.data.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!selectedDeviceId" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
      </svg>
      <p class="text-lg font-medium text-gray-600">请选择设备查看时间线</p>
      <p class="text-sm text-gray-400 mt-1">选择设备后将显示完整的运行轨迹</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import dayjs from 'dayjs'

const devices = ref([])
const selectedDeviceId = ref(null)
const hours = ref(24)
const timeline = ref(null)

const fetchDevices = async () => {
  try {
    const response = await api.get('/api/devices')
    devices.value = response.data
  } catch (err) {
    console.error('获取设备列表失败:', err)
  }
}

const fetchTimeline = async () => {
  if (!selectedDeviceId.value) {
    timeline.value = null
    return
  }
  
  try {
    const response = await api.get(`/api/reports/device-timeline/${selectedDeviceId.value}`, {
      params: { hours: hours.value }
    })
    timeline.value = response.data
  } catch (err) {
    console.error('获取时间线失败:', err)
    timeline.value = null
  }
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('MM-DD HH:mm:ss')
}

const getTimelineDotClass = (type) => {
  switch (type) {
    case 'meter_data': return 'bg-blue-500'
    case 'status_change': return 'bg-yellow-500'
    case 'alarm': return 'bg-red-500'
    case 'protocol': return 'bg-gray-500'
    default: return 'bg-gray-400'
  }
}

const getTimelineBgClass = (type) => {
  switch (type) {
    case 'meter_data': return 'bg-blue-50'
    case 'status_change': return 'bg-yellow-50'
    case 'alarm': return 'bg-red-50'
    case 'protocol': return 'bg-gray-50'
    default: return 'bg-gray-50'
  }
}

const getTimelineLabelClass = (type) => {
  switch (type) {
    case 'meter_data': return 'bg-blue-100 text-blue-800'
    case 'status_change': return 'bg-yellow-100 text-yellow-800'
    case 'alarm': return 'bg-red-100 text-red-800'
    case 'protocol': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getTimelineTypeText = (type) => {
  switch (type) {
    case 'meter_data': return '数据采集'
    case 'status_change': return '状态变更'
    case 'alarm': return '告警事件'
    case 'protocol': return '通讯交互'
    default: return type
  }
}

onMounted(() => {
  fetchDevices()
})
</script>
