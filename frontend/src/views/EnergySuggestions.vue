<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">节能建议</h1>
        <p class="text-gray-500">查看和处理系统生成的节能优化建议</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">全部建议</p>
        <p class="text-2xl font-bold text-gray-800">{{ suggestions.length }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-yellow-100">
        <p class="text-sm text-gray-500 mb-1">待审核</p>
        <p class="text-2xl font-bold text-yellow-600">{{ countByStatus('pending') }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
        <p class="text-sm text-gray-500 mb-1">已审核</p>
        <p class="text-2xl font-bold text-blue-600">{{ countByStatus('reviewed') }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-green-100">
        <p class="text-sm text-gray-500 mb-1">已执行</p>
        <p class="text-2xl font-bold text-green-600">{{ countByStatus('implemented') }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex items-center space-x-4">
        <select 
          v-model="filters.status" 
          @change="fetchSuggestions"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="reviewed">已审核</option>
          <option value="implemented">已执行</option>
        </select>
        
        <select 
          v-model="filters.priority" 
          @change="fetchSuggestions"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部优先级</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>
      
      <div class="divide-y divide-gray-100">
        <div 
          v-for="suggestion in suggestions" 
          :key="suggestion.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-3 mb-2">
                <h4 class="font-medium text-gray-900 text-lg">{{ suggestion.title }}</h4>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(suggestion.status)"
                >
                  {{ getStatusText(suggestion.status) }}
                </span>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getPriorityClass(suggestion.priority)"
                >
                  {{ getPriorityText(suggestion.priority) }}优先级
                </span>
              </div>
              
              <div class="text-sm text-gray-500 mb-3 flex items-center space-x-4">
                <span>来源: {{ suggestion.source_type }}</span>
                <span v-if="suggestion.category">分类: {{ suggestion.category }}</span>
                <span>创建时间: {{ formatDateTime(suggestion.created_at) }}</span>
              </div>
              
              <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ suggestion.content }}</p>
              </div>
              
              <div class="flex items-center space-x-6 text-sm">
                <div v-if="suggestion.estimated_saving" class="flex items-center space-x-2">
                  <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span class="text-green-600 font-medium">
                    预估节能: {{ suggestion.estimated_saving.toFixed(2) }} kWh
                  </span>
                </div>
                
                <div v-if="suggestion.reviewed_at" class="flex items-center space-x-2">
                  <span class="text-gray-500">审核时间:</span>
                  <span class="text-gray-700">{{ formatDateTime(suggestion.reviewed_at) }}</span>
                </div>
                
                <div v-if="suggestion.implemented_at" class="flex items-center space-x-2">
                  <span class="text-gray-500">执行时间:</span>
                  <span class="text-gray-700">{{ formatDateTime(suggestion.implemented_at) }}</span>
                </div>
                
                <div v-if="suggestion.actual_saving" class="flex items-center space-x-2">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-blue-600 font-medium">
                    实际节能: {{ suggestion.actual_saving.toFixed(2) }} kWh
                  </span>
                </div>
              </div>
              
              <div v-if="suggestion.review_note" class="mt-3 p-3 bg-yellow-50 rounded-lg">
                <span class="text-sm font-medium text-yellow-700">审核备注: </span>
                <span class="text-sm text-yellow-600">{{ suggestion.review_note }}</span>
              </div>
              
              <div v-if="suggestion.implementation_result" class="mt-3 p-3 bg-green-50 rounded-lg">
                <span class="text-sm font-medium text-green-700">执行结果: </span>
                <span class="text-sm text-green-600">{{ suggestion.implementation_result }}</span>
              </div>
            </div>
            
            <div class="flex flex-col items-end space-y-2 ml-6 flex-shrink-0">
              <button 
                v-if="suggestion.status === 'pending'"
                @click="reviewSuggestion(suggestion.id, true)"
                class="px-4 py-2 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
              >
                审核通过
              </button>
              <button 
                v-if="suggestion.status === 'pending'"
                @click="reviewSuggestion(suggestion.id, false)"
                class="px-4 py-2 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
              >
                审核拒绝
              </button>
              <button 
                v-if="suggestion.status === 'reviewed'"
                @click="implementSuggestion(suggestion.id)"
                class="px-4 py-2 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
              >
                标记执行
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="suggestions.length === 0" class="py-12 text-center text-gray-500">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <p class="text-lg font-medium">暂无节能建议</p>
          <p class="text-sm mt-1">系统将根据设备运行数据自动生成优化建议</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import dayjs from 'dayjs'

const suggestions = ref([])
const filters = ref({
  status: '',
  priority: ''
})

const countByStatus = (status) => {
  return suggestions.value.filter(s => s.status === status).length
}

const fetchSuggestions = async () => {
  try {
    const params = {}
    if (filters.value.status) {
      params.status = filters.value.status
    }
    if (filters.value.priority) {
      params.priority = filters.value.priority
    }
    
    const response = await api.get('/api/prediction/suggestions/', { params })
    suggestions.value = response.data
  } catch (err) {
    console.error('获取节能建议失败:', err)
  }
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('YYYY-MM-DD HH:mm')
}

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'reviewed': return 'bg-blue-100 text-blue-800'
    case 'implemented': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'reviewed': return '已审核'
    case 'implemented': return '已执行'
    case 'rejected': return '已拒绝'
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
    case 'high': return '高'
    case 'medium': return '中'
    default: return '低'
  }
}

const reviewSuggestion = async (id, isApproved) => {
  const note = isApproved ? '' : prompt('请输入拒绝原因：')
  if (!isApproved && note === null) return
  
  try {
    await api.put(`/api/prediction/suggestions/${id}/review`, null, {
      params: { 
        is_approved: isApproved,
        review_note: note || undefined
      }
    })
    fetchSuggestions()
  } catch (err) {
    console.error('审核建议失败:', err)
    alert('操作失败')
  }
}

const implementSuggestion = async (id) => {
  const result = prompt('请输入执行结果：')
  if (result === null) return
  
  const saving = prompt('请输入实际节能量 (kWh)：')
  
  try {
    await api.put(`/api/prediction/suggestions/${id}/implement`, null, {
      params: { 
        implementation_result: result,
        actual_saving: saving ? parseFloat(saving) : null
      }
    })
    fetchSuggestions()
  } catch (err) {
    console.error('执行建议失败:', err)
    alert('操作失败')
  }
}

onMounted(() => {
  fetchSuggestions()
})
</script>
