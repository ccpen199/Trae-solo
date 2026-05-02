<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">告警管理</h1>
        <p class="text-gray-500">查看和处理设备告警信息</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">全部告警</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.total }}</p>
          </div>
          <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-4 border border-red-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">活跃告警</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.active }}</p>
          </div>
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-4 border border-yellow-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已确认</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.acknowledged }}</p>
          </div>
          <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已解决</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.resolved }}</p>
          </div>
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex items-center space-x-4">
        <select 
          v-model="filters.status" 
          @change="fetchAlarms"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="acknowledged">已确认</option>
          <option value="resolved">已解决</option>
        </select>
        
        <select 
          v-model="filters.alarm_level" 
          @change="fetchAlarms"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部级别</option>
          <option value="critical">紧急</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>
      
      <div class="divide-y divide-gray-100">
        <div 
          v-for="alarm in alarms" 
          :key="alarm.id"
          class="p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4">
              <div 
                class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="getLevelBgClass(alarm.alarm_level)"
              >
                <svg 
                  class="w-5 h-5" 
                  :class="getLevelTextClass(alarm.alarm_level)"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="font-medium text-gray-900">{{ alarm.title }}</h4>
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getStatusClass(alarm.status)"
                  >
                    {{ getStatusText(alarm.status) }}
                  </span>
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getLevelClass(alarm.alarm_level)"
                  >
                    {{ getLevelText(alarm.alarm_level) }}
                  </span>
                </div>
                
                <p class="text-sm text-gray-500 mb-2">{{ alarm.description || alarm.trigger_reason }}</p>
                
                <div class="flex items-center space-x-4 text-xs text-gray-400">
                  <span>告警类型: {{ alarm.alarm_type }}</span>
                  <span>触发时间: {{ formatDateTime(alarm.triggered_at) }}</span>
                  <span v-if="alarm.acknowledged_at">确认时间: {{ formatDateTime(alarm.acknowledged_at) }}</span>
                  <span v-if="alarm.resolved_at">解决时间: {{ formatDateTime(alarm.resolved_at) }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2 ml-4">
              <button 
                v-if="alarm.status === 'active'"
                @click="acknowledgeAlarm(alarm.id)"
                class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200 transition-colors"
              >
                确认
              </button>
              <button 
                v-if="alarm.status === 'active' || alarm.status === 'acknowledged'"
                @click="showResolveModal(alarm)"
                class="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
              >
                解决
              </button>
              <button 
                @click="dispatchInspection(alarm)"
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
              >
                派单
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="alarms.length === 0" class="py-12 text-center text-gray-500">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-lg font-medium">暂无告警记录</p>
        </div>
      </div>
    </div>

    <div v-if="showResolve" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">解决告警</h3>
        </div>
        
        <form @submit.prevent="resolveAlarm" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">解决备注</label>
            <textarea 
              v-model="resolveNote"
              rows="4"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="请输入解决详情..."
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button 
              type="button"
              @click="showResolve = false"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              确认解决
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../utils/api'
import dayjs from 'dayjs'

const alarms = ref([])
const filters = ref({
  status: '',
  alarm_level: ''
})

const showResolve = ref(false)
const selectedAlarm = ref(null)
const resolveNote = ref('')

const stats = computed(() => {
  return {
    total: alarms.value.length,
    active: alarms.value.filter(a => a.status === 'active').length,
    acknowledged: alarms.value.filter(a => a.status === 'acknowledged').length,
    resolved: alarms.value.filter(a => a.status === 'resolved').length
  }
})

const fetchAlarms = async () => {
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.alarm_level) params.alarm_level = filters.value.alarm_level
    
    const response = await api.get('/api/alarms', { params })
    alarms.value = response.data
  } catch (err) {
    console.error('获取告警列表失败:', err)
  }
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('MM-DD HH:mm')
}

const getLevelBgClass = (level) => {
  switch (level) {
    case 'critical': return 'bg-red-100'
    case 'high': return 'bg-orange-100'
    case 'medium': return 'bg-yellow-100'
    default: return 'bg-green-100'
  }
}

const getLevelTextClass = (level) => {
  switch (level) {
    case 'critical': return 'text-red-600'
    case 'high': return 'text-orange-600'
    case 'medium': return 'text-yellow-600'
    default: return 'text-green-600'
  }
}

const getLevelClass = (level) => {
  switch (level) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-green-100 text-green-800'
  }
}

const getLevelText = (level) => {
  switch (level) {
    case 'critical': return '紧急'
    case 'high': return '高'
    case 'medium': return '中'
    default: return '低'
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'active': return 'bg-red-100 text-red-800'
    case 'acknowledged': return 'bg-yellow-100 text-yellow-800'
    case 'resolved': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'active': return '活跃'
    case 'acknowledged': return '已确认'
    case 'resolved': return '已解决'
    default: return status
  }
}

const acknowledgeAlarm = async (alarmId) => {
  try {
    await api.put(`/api/alarms/${alarmId}/acknowledge`)
    fetchAlarms()
  } catch (err) {
    console.error('确认告警失败:', err)
  }
}

const showResolveModal = (alarm) => {
  selectedAlarm.value = alarm
  resolveNote.value = ''
  showResolve.value = true
}

const resolveAlarm = async () => {
  if (!selectedAlarm.value) return
  
  try {
    await api.put(`/api/alarms/${selectedAlarm.value.id}/resolve`, null, {
      params: { resolve_note: resolveNote.value }
    })
    showResolve.value = false
    selectedAlarm.value = null
    fetchAlarms()
  } catch (err) {
    console.error('解决告警失败:', err)
  }
}

const dispatchInspection = async (alarm) => {
  try {
    const data = {
      title: `巡检单 - ${alarm.title}`,
      description: alarm.description || alarm.trigger_reason,
      priority: alarm.alarm_level === 'critical' ? 'high' : alarm.alarm_level
    }
    
    await api.post(`/api/alarms/${alarm.id}/dispatch-inspection`, data)
    alert('巡检单已派发')
  } catch (err) {
    console.error('派发巡检单失败:', err)
    alert('派发巡检单失败')
  }
}

onMounted(() => {
  fetchAlarms()
})
</script>
