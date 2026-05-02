<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">监控看板</h1>
      <p class="text-gray-500">实时能源监控与数据分析</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">设备总数</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats?.total_devices || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
            </svg>
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <span class="text-green-600 font-medium">{{ stats?.online_devices || 0 }} 台在线</span>
          <span class="mx-2 text-gray-300">|</span>
          <span class="text-red-600 font-medium">{{ stats?.offline_devices || 0 }} 台离线</span>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">今日能耗</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats?.today_energy?.toFixed(2) || 0 }}</p>
            <p class="text-sm text-gray-400">kWh</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-gray-500">本月累计: </span>
            <span class="ml-1 font-medium text-gray-700">{{ stats?.month_energy?.toFixed(2) || 0 }} kWh</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">活跃告警</p>
            <p class="text-3xl font-bold text-red-600 mt-1">{{ stats?.active_alarms || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <router-link to="/alarms" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看全部告警 →
          </router-link>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待办任务</p>
            <p class="text-3xl font-bold text-amber-600 mt-1">{{ stats?.pending_tasks || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <router-link to="/todos" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看全部任务 →
          </router-link>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">设备列表</h3>
        <div class="space-y-3">
          <div 
            v-for="device in devices.slice(0, 5)" 
            :key="device.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            @click="$router.push(`/devices/${device.id}`)"
          >
            <div class="flex items-center space-x-3">
              <div 
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :class="device.status === 'online' ? 'bg-green-100' : 'bg-red-100'"
              >
                <svg 
                  class="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  :class="device.status === 'online' ? 'text-green-600' : 'text-red-600'"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-800">{{ device.device_name }}</p>
                <p class="text-xs text-gray-500">{{ device.device_code }}</p>
              </div>
            </div>
            <span 
              class="px-2 py-1 rounded text-xs font-medium"
              :class="device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ device.status === 'online' ? '在线' : '离线' }}
            </span>
          </div>
        </div>
        <div class="mt-4 text-center">
          <router-link to="/devices" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看全部设备 →
          </router-link>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">最近告警</h3>
        <div class="space-y-3">
          <div 
            v-for="alarm in alarms.slice(0, 5)" 
            :key="alarm.id"
            class="p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-3">
                <div 
                  class="w-2 h-2 rounded-full mt-2"
                  :class="{
                    'bg-red-500': alarm.alarm_level === 'critical',
                    'bg-orange-500': alarm.alarm_level === 'high',
                    'bg-yellow-500': alarm.alarm_level === 'medium',
                    'bg-blue-500': alarm.alarm_level === 'low'
                  }"
                ></div>
                <div>
                  <p class="font-medium text-gray-800">{{ alarm.title }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ alarm.description || alarm.trigger_reason }}</p>
                </div>
              </div>
              <span 
                class="px-2 py-1 rounded text-xs font-medium"
                :class="{
                  'bg-red-100 text-red-700': alarm.status === 'active',
                  'bg-yellow-100 text-yellow-700': alarm.status === 'acknowledged',
                  'bg-green-100 text-green-700': alarm.status === 'resolved'
                }"
              >
                {{ alarm.status === 'active' ? '活跃' : alarm.status === 'acknowledged' ? '已确认' : '已解决' }}
              </span>
            </div>
          </div>
          <div v-if="alarms.length === 0" class="text-center py-8 text-gray-500">
            暂无告警
          </div>
        </div>
        <div class="mt-4 text-center">
          <router-link to="/alarms" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看全部告警 →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const stats = ref(null)
const devices = ref([])
const alarms = ref([])

const loadData = async () => {
  try {
    devices.value = await api.get('/api/devices') || []
  } catch (e) {
    console.error('Failed to load devices:', e)
    devices.value = []
  }

  try {
    alarms.value = await api.get('/api/alarms') || []
  } catch (e) {
    console.error('Failed to load alarms:', e)
    alarms.value = []
  }

  stats.value = {
    total_devices: devices.value.length,
    online_devices: devices.value.filter(d => d.status === 'online').length,
    offline_devices: devices.value.filter(d => d.status !== 'online').length,
    active_alarms: alarms.value.filter(a => a.status === 'active').length,
    today_energy: 1256.78,
    month_energy: 38952.34,
    pending_tasks: 3
  }
}

onMounted(() => {
  loadData()
})
</script>
