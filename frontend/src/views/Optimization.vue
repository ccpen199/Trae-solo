<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'

const loading = ref(false)
const error = ref(null)
const suggestions = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const activeType = ref('all')
const keyword = ref('')

const typeTabs = [
  { value: 'all', label: '全部', icon: '📋' },
  { value: 'idle_resource', label: '闲置资源', icon: '💤' },
  { value: 'low_utilization', label: '低利用率', icon: '📉' },
  { value: 'reserved_instance', label: 'RI推荐', icon: '💳' },
  { value: 'storage_lifecycle', label: '存储优化', icon: '💾' },
  { value: 'traffic_anomaly', label: '流量异常', icon: '📡' }
]

const riskLevelMap = {
  low: { label: '低风险', class: 'tag-success' },
  medium: { label: '中风险', class: 'tag-warning' },
  high: { label: '高风险', class: 'tag-error' }
}

const statusMap = {
  pending: { label: '待处理', class: 'tag-info' },
  in_progress: { label: '进行中', class: 'tag-warning' },
  completed: { label: '已完成', class: 'tag-success' },
  cancelled: { label: '已取消', class: 'tag-error' }
}

const formatCurrency = (value) => {
  return `¥${Number(value || 0).toLocaleString()}`
}

const fetchSuggestions = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (activeType.value !== 'all') {
      params.suggestion_type = activeType.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    const data = await request.get('/suggestions', { params })
    suggestions.value = data.list
    total.value = data.total
  } catch (err) {
    error.value = err.message || '加载建议失败'
    console.error('获取优化建议失败:', err)
  } finally {
    loading.value = false
  }
}

const handleTypeChange = (type) => {
  activeType.value = type
  page.value = 1
  fetchSuggestions()
}

const handleSearch = () => {
  page.value = 1
  fetchSuggestions()
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchSuggestions()
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const totalSaving = computed(() => {
  return suggestions.value.reduce((sum, s) => sum + Number(s.estimated_saving_monthly || 0), 0)
})

const pendingCount = computed(() => {
  return suggestions.value.filter(s => s.status === 'pending').length
})

const handleAdopt = async (suggestion) => {
  if (suggestion.status !== 'pending') {
    alert('该建议已处理，无法重复采纳')
    return
  }

  const maintenanceWindow = prompt('请输入维护窗口（如：2026-05-28 02:00-04:00）:', '')
  if (maintenanceWindow === null) return

  try {
    await request.post(`/suggestions/${suggestion.id}/adopt`, {
      requester: '管理员',
      maintenance_window: maintenanceWindow || null
    })
    fetchSuggestions()
    alert('采纳成功，已创建工单')
  } catch (err) {
    console.error('采纳建议失败:', err)
    alert('采纳失败: ' + err.message)
  }
}

const getTypeLabel = (type) => {
  const tab = typeTabs.find(t => t.value === type)
  return tab ? tab.label : type
}

const getPriorityLabel = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

const getPriorityClass = (priority) => {
  const map = { high: 'tag-error', medium: 'tag-warning', low: 'tag-info' }
  return map[priority] || 'tag-info'
}

onMounted(() => {
  fetchSuggestions()
})
</script>

<template>
  <div class="optimization-page">
    <div class="grid grid-cols-4 gap-4 mb-4">
      <div class="stat-card">
        <div class="stat-label">优化建议总数</div>
        <div class="stat-value text-primary">{{ total }}</div>
        <div class="text-sm text-secondary mt-1">
          待处理: <span class="text-warning">{{ pendingCount }}</span> 条
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">预计月节省</div>
        <div class="stat-value text-success">{{ formatCurrency(totalSaving) }}</div>
        <div class="text-sm text-secondary mt-1">当前页面数据</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">高优先级</div>
        <div class="stat-value text-error">
          {{ suggestions.filter(s => s.priority === 'high').length }}
        </div>
        <div class="text-sm text-secondary mt-1">需要立即处理</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已采纳</div>
        <div class="stat-value text-success">
          {{ suggestions.filter(s => s.status !== 'pending').length }}
        </div>
        <div class="text-sm text-secondary mt-1">已创建工单</div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="tabs">
        <button
          v-for="tab in typeTabs"
          :key="tab.value"
          class="tab"
          :class="{ active: activeType === tab.value }"
          @click="handleTypeChange(tab.value)"
        >
          <span class="mr-1">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>
      <div class="flex gap-3 mt-2">
        <input
          v-model="keyword"
          type="text"
          class="input"
          style="width: 300px;"
          placeholder="搜索建议标题或描述"
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-primary" @click="handleSearch">搜索</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">💡 优化建议列表</h3>
        <span class="text-sm text-secondary">共 {{ total }} 条建议</span>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span class="ml-2">加载中...</span>
      </div>

      <div v-else-if="error" class="error">
        <span>⚠️</span>
        <span>{{ error }}</span>
        <button class="btn btn-primary btn-sm mt-2" @click="fetchSuggestions">重试</button>
      </div>

      <template v-else>
        <div v-if="suggestions.length === 0" class="empty">
          <span>🎯</span>
          <span>暂无优化建议</span>
        </div>
        <div v-else>
          <div class="table-container overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>优先级</th>
                  <th>类型</th>
                  <th>标题</th>
                  <th>资源</th>
                  <th>风险等级</th>
                  <th>预计月节省</th>
                  <th>状态</th>
                  <th style="width: 120px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="suggestion in suggestions" :key="suggestion.id">
                  <td>
                    <span class="tag" :class="getPriorityClass(suggestion.priority)">
                      {{ getPriorityLabel(suggestion.priority) }}
                    </span>
                  </td>
                  <td>
                    <span class="tag tag-primary">{{ getTypeLabel(suggestion.suggestion_type) }}</span>
                  </td>
                  <td>
                    <div class="font-medium">{{ suggestion.title }}</div>
                    <div class="text-sm text-muted mt-1 truncate" style="max-width: 300px;">
                      {{ suggestion.description }}
                    </div>
                  </td>
                  <td>
                    <div>{{ suggestion.resource_name || suggestion.resource_id }}</div>
                    <div class="text-xs text-secondary">
                      {{ suggestion.project_name || '-' }}
                    </div>
                  </td>
                  <td>
                    <span class="tag" :class="riskLevelMap[suggestion.risk_level]?.class">
                      {{ riskLevelMap[suggestion.risk_level]?.label }}
                    </span>
                  </td>
                  <td class="font-semibold text-success">
                    {{ formatCurrency(suggestion.estimated_saving_monthly) }}
                  </td>
                  <td>
                    <span class="tag" :class="statusMap[suggestion.status]?.class">
                      {{ statusMap[suggestion.status]?.label }}
                    </span>
                  </td>
                  <td>
                    <button
                      v-if="suggestion.status === 'pending'"
                      class="btn btn-primary btn-sm"
                      @click="handleAdopt(suggestion)"
                    >
                      采纳
                    </button>
                    <span v-else class="text-sm text-muted">已处理</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <button
              class="pagination-btn"
              :disabled="page <= 1"
              @click="handlePageChange(page - 1)"
            >
              上一页
            </button>
            <button
              v-for="p in Math.min(5, totalPages)"
              :key="p"
              class="pagination-btn"
              :class="{ active: page === p }"
              @click="handlePageChange(p)"
            >
              {{ p }}
            </button>
            <span v-if="totalPages > 5" class="text-secondary">...</span>
            <button
              class="pagination-btn"
              :disabled="page >= totalPages"
              @click="handlePageChange(page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.optimization-page {
  min-height: 100%;
}

.overflow-x-auto {
  overflow-x: auto;
}

.mr-1 {
  margin-right: 4px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
