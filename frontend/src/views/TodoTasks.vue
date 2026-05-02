<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">待办任务</h1>
        <p class="text-gray-500">管理系统待办事项和节能建议</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">待办任务</h3>
          <span class="text-sm text-gray-500">{{ todos.length }} 项</span>
        </div>
        
        <div class="divide-y divide-gray-100">
          <div 
            v-for="todo in todos" 
            :key="todo.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="font-medium text-gray-900">{{ todo.title }}</h4>
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getStatusClass(todo.status)"
                  >
                    {{ getStatusText(todo.status) }}
                  </span>
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getPriorityClass(todo.priority)"
                  >
                    {{ getPriorityText(todo.priority) }}
                  </span>
                </div>
                
                <p class="text-sm text-gray-500 mb-2">{{ todo.description }}</p>
                
                <div class="flex items-center space-x-4 text-xs text-gray-400">
                  <span>创建时间: {{ formatDateTime(todo.created_at) }}</span>
                  <span v-if="todo.due_at">截止时间: {{ formatDateTime(todo.due_at) }}</span>
                </div>
              </div>
              
              <div class="flex items-center space-x-2 ml-4">
                <button 
                  v-if="todo.status === 'pending'"
                  @click="completeTask(todo.id)"
                  class="text-green-600 hover:text-green-800 text-sm"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="todos.length === 0" class="py-8 text-center text-gray-500">
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm">暂无待办任务</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">节能建议</h3>
          <span class="text-sm text-gray-500">{{ suggestions.length }} 条</span>
        </div>
        
        <div class="divide-y divide-gray-100">
          <div 
            v-for="suggestion in suggestions" 
            :key="suggestion.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="font-medium text-gray-900">{{ suggestion.title }}</h4>
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getSuggestionStatusClass(suggestion.status)"
                  >
                    {{ getSuggestionStatusText(suggestion.status) }}
                  </span>
                </div>
                
                <p class="text-sm text-gray-500 mb-2 line-clamp-2">{{ suggestion.content }}</p>
                
                <div class="flex items-center space-x-4 text-xs">
                  <span class="text-gray-400">
                    来源: {{ suggestion.source_type }}
                  </span>
                  <span v-if="suggestion.estimated_saving" class="text-green-600 font-medium">
                    预估节能: {{ suggestion.estimated_saving.toFixed(2) }} kWh
                  </span>
                  <span class="text-gray-400">
                    创建时间: {{ formatDateTime(suggestion.created_at) }}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button 
                  @click="viewSuggestion(suggestion)"
                  class="text-blue-600 hover:text-blue-800 text-sm"
                >
                  查看
                </button>
                <button 
                  v-if="suggestion.status === 'pending'"
                  @click="reviewSuggestion(suggestion.id, true)"
                  class="text-green-600 hover:text-green-800 text-sm"
                >
                  审核
                </button>
                <button 
                  v-if="suggestion.status === 'reviewed'"
                  @click="implementSuggestion(suggestion.id)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  执行
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="suggestions.length === 0" class="py-8 text-center text-gray-500">
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <p class="text-sm">暂无节能建议</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSuggestionDetail" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">{{ selectedSuggestion?.title }}</h3>
            <button @click="showSuggestionDetail = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <div class="flex items-center space-x-4 mb-4">
            <span 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getSuggestionStatusClass(selectedSuggestion?.status)"
            >
              {{ getSuggestionStatusText(selectedSuggestion?.status) }}
            </span>
            <span v-if="selectedSuggestion?.estimated_saving" class="text-sm text-green-600">
              预估节能: {{ selectedSuggestion.estimated_saving.toFixed(2) }} kWh
            </span>
            <span class="text-sm text-gray-500">
              来源: {{ selectedSuggestion?.source_type }}
            </span>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">建议内容</h4>
            <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ selectedSuggestion?.content }}</p>
          </div>
          
          <div v-if="selectedSuggestion?.review_note" class="bg-yellow-50 rounded-lg p-4 mb-4">
            <h4 class="text-sm font-medium text-yellow-700 mb-2">审核备注</h4>
            <p class="text-sm text-yellow-600">{{ selectedSuggestion.review_note }}</p>
          </div>
          
          <div v-if="selectedSuggestion?.implementation_result" class="bg-green-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-green-700 mb-2">执行结果</h4>
            <p class="text-sm text-green-600">{{ selectedSuggestion.implementation_result }}</p>
            <p v-if="selectedSuggestion.actual_saving" class="text-sm text-green-700 font-medium mt-2">
              实际节能: {{ selectedSuggestion.actual_saving.toFixed(2) }} kWh
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import dayjs from 'dayjs'

const todos = ref([])
const suggestions = ref([])

const showSuggestionDetail = ref(false)
const selectedSuggestion = ref(null)

const fetchTodos = async () => {
  try {
    const response = await api.get('/api/alarms/todos/', { params: { status: 'pending' } })
    todos.value = response.data
  } catch (err) {
    console.error('获取待办任务失败:', err)
  }
}

const fetchSuggestions = async () => {
  try {
    const response = await api.get('/api/prediction/suggestions/')
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
    case 'completed': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '待处理'
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

const getSuggestionStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'reviewed': return 'bg-blue-100 text-blue-800'
    case 'implemented': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getSuggestionStatusText = (status) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'reviewed': return '已审核'
    case 'implemented': return '已执行'
    case 'rejected': return '已拒绝'
    default: return status
  }
}

const completeTask = async (taskId) => {
  if (!confirm('确认完成此任务？')) return
  
  try {
    const todo = todos.value.find(t => t.id === taskId)
    if (todo) {
      todo.status = 'completed'
      todo.completed_at = new Date().toISOString()
    }
  } catch (err) {
    console.error('完成任务失败:', err)
  }
}

const viewSuggestion = (suggestion) => {
  selectedSuggestion.value = suggestion
  showSuggestionDetail.value = true
}

const reviewSuggestion = async (suggestionId, isApproved) => {
  try {
    await api.put(`/api/prediction/suggestions/${suggestionId}/review`, null, {
      params: { is_approved: isApproved }
    })
    fetchSuggestions()
  } catch (err) {
    console.error('审核建议失败:', err)
    alert('审核失败')
  }
}

const implementSuggestion = async (suggestionId) => {
  const result = prompt('请输入执行结果：')
  if (!result) return
  
  const saving = prompt('请输入实际节能量 (kWh)：')
  
  try {
    await api.put(`/api/prediction/suggestions/${suggestionId}/implement`, null, {
      params: { 
        implementation_result: result,
        actual_saving: saving ? parseFloat(saving) : null
      }
    })
    fetchSuggestions()
  } catch (err) {
    console.error('执行建议失败:', err)
    alert('执行失败')
  }
}

onMounted(() => {
  fetchTodos()
  fetchSuggestions()
})
</script>
