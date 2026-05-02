<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">审计日志</h1>
        <p class="text-gray-500">查看系统操作审计记录</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">分类筛选:</span>
          <select 
            v-model="filters.category" 
            @change="fetchLogs"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="认证">认证</option>
            <option value="设备管理">设备管理</option>
            <option value="告警管理">告警管理</option>
            <option value="计费引擎">计费引擎</option>
            <option value="审计引擎">审计引擎</option>
          </select>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">追踪ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作者</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目标</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="log in logs" :key="log.trace_id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDateTime(log.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {{ log.trace_id?.substring(0, 16) }}...
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ log.category }}</span>
              <span v-if="log.sub_category" class="text-xs text-gray-500 ml-1">
                ({{ log.sub_category }})
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-medium text-gray-900">{{ log.action }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ log.actor_name || '系统' }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-600">
                {{ log.target_type }}: {{ log.target_name || log.target_id || '-' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="log.result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ log.result === 'success' ? '成功' : '失败' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="logs.length === 0" class="py-12 text-center text-gray-500">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-lg font-medium">暂无审计日志</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import dayjs from 'dayjs'

const logs = ref([])
const filters = ref({
  category: ''
})

const fetchLogs = async () => {
  try {
    const params = {}
    if (filters.value.category) {
      params.category = filters.value.category
    }
    
    const response = await api.get('/api/reports/audit/logs', { params })
    logs.value = response.data
  } catch (err) {
    console.error('获取审计日志失败:', err)
  }
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchLogs()
})
</script>
