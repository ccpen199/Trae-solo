<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">巡检管理</h1>
        <p class="text-gray-500">管理和跟踪设备巡检任务</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">全部巡检</p>
        <p class="text-2xl font-bold text-gray-800">{{ inspections.length }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-yellow-100">
        <p class="text-sm text-gray-500 mb-1">待接单</p>
        <p class="text-2xl font-bold text-yellow-600">{{ countByStatus('pending') }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
        <p class="text-sm text-gray-500 mb-1">进行中</p>
        <p class="text-2xl font-bold text-blue-600">{{ countByStatus('accepted') }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <p class="text-sm text-gray-500 mb-1">已完成</p>
        <p class="text-2xl font-bold text-green-600">{{ countByStatus('completed') }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <select 
          v-model="filters.status" 
          @change="fetchInspections"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="pending">待接单</option>
          <option value="accepted">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
      
      <div class="divide-y divide-gray-100">
        <div 
          v-for="inspection in inspections" 
          :key="inspection.id"
          class="p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <span class="font-mono text-sm text-blue-600">{{ inspection.inspection_no }}</span>
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="getStatusClass(inspection.status)"
                >
                  {{ getStatusText(inspection.status) }}
                </span>
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="getPriorityClass(inspection.priority)"
                >
                  {{ getPriorityText(inspection.priority) }}
                </span>
              </div>
              
              <h4 class="font-medium text-gray-800 mb-1">{{ inspection.title }}</h4>
              <p class="text-sm text-gray-500 mb-3">{{ inspection.description }}</p>
              
              <div class="flex items-center space-x-6 text-xs text-gray-400">
                <span>派单时间: {{ formatDateTime(inspection.dispatched_at) }}</span>
                <span v-if="inspection.accepted_at">接单时间: {{ formatDateTime(inspection.accepted_at) }}</span>
                <span v-if="inspection.completed_at">完成时间: {{ formatDateTime(inspection.completed_at) }}</span>
              </div>
              
              <div v-if="inspection.status === 'completed'" class="mt-3 p-3 bg-green-50 rounded-lg">
                <h5 class="text-sm font-medium text-green-700 mb-1">复电记录</h5>
                <p class="text-sm text-green-600">{{ inspection.recovery_record }}</p>
                <div v-if="inspection.cost" class="mt-2 text-sm text-green-700">
                  费用: ¥{{ inspection.cost?.toFixed(2) }}
                </div>
              </div>
            </div>
            
            <div class="flex flex-col items-end space-y-2 ml-4">
              <button 
                v-if="inspection.status === 'pending'"
                @click="updateStatus(inspection.id, 'accepted')"
                class="px-3 py-1.5 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
              >
                接单
              </button>
              <button 
                v-if="inspection.status === 'accepted'"
                @click="showCompleteModal(inspection)"
                class="px-3 py-1.5 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
              >
                完成
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="inspections.length === 0" class="py-12 text-center text-gray-500">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="text-lg font-medium">暂无巡检单</p>
          <p class="text-sm mt-1">告警产生后将自动派发生成巡检单</p>
        </div>
      </div>
    </div>

    <div v-if="showComplete" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">完成巡检</h3>
        </div>
        
        <form @submit.prevent="completeInspection" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">复电记录 *</label>
            <textarea 
              v-model="completeForm.recovery_record"
              rows="4"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="请输入详细的复电处理记录..."
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">费用 (元)</label>
            <input 
              v-model.number="completeForm.cost"
              type="number"
              step="0.01"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="请输入费用金额"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结果备注</label>
            <textarea 
              v-model="completeForm.result_note"
              rows="2"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="其他说明信息..."
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              @click="showComplete = false"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              确认完成
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

const inspections = ref([])
const filters = ref({
  status: ''
})

const showComplete = ref(false)
const selectedInspection = ref(null)
const completeForm = ref({
  recovery_record: '',
  cost: null,
  result_note: ''
})

const countByStatus = (status) => {
  return inspections.value.filter(i => i.status === status).length
}

const fetchInspections = async () => {
  try {
    const params = {}
    if (filters.value.status) {
      params.status = filters.value.status
    }
    
    const response = await api.get('/api/alarms/inspections/', { params })
    inspections.value = response.data
  } catch (err) {
    console.error('获取巡检单失败:', err)
  }
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('YYYY-MM-DD HH:mm')
}

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'accepted': return 'bg-blue-100 text-blue-800'
    case 'completed': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '待接单'
    case 'accepted': return '进行中'
    case 'completed': return '已完成'
    default: return status
  }
}

const getPriorityClass = (priority) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-green-100 text-green-800'
  }
}

const getPriorityText = (priority) => {
  switch (priority) {
    case 'high': return '高优先级'
    case 'medium': return '中优先级'
    default: return '低优先级'
  }
}

const updateStatus = async (id, newStatus) => {
  try {
    await api.put(`/api/alarms/inspections/${id}`, {
      status: newStatus
    })
    fetchInspections()
  } catch (err) {
    console.error('更新状态失败:', err)
    alert('操作失败')
  }
}

const showCompleteModal = (inspection) => {
  selectedInspection.value = inspection
  completeForm.value = {
    recovery_record: '',
    cost: null,
    result_note: ''
  }
  showComplete.value = true
}

const completeInspection = async () => {
  if (!selectedInspection.value || !completeForm.value.recovery_record) {
    alert('请填写复电记录')
    return
  }
  
  try {
    await api.put(`/api/alarms/inspections/${selectedInspection.value.id}`, {
      status: 'completed',
      recovery_record: completeForm.value.recovery_record,
      result_note: completeForm.value.result_note,
      cost: completeForm.value.cost
    })
    showComplete.value = false
    fetchInspections()
  } catch (err) {
    console.error('完成巡检失败:', err)
    alert('操作失败')
  }
}

onMounted(() => {
  fetchInspections()
})
</script>
