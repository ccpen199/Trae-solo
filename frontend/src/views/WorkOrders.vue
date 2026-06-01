<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const error = ref(null)
const workOrders = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const statusFilter = ref('')
const keyword = ref('')
const showCreateModal = ref(false)
const creating = ref(false)

const newOrder = ref({
  title: '',
  action_type: '',
  requester: '管理员',
  maintenance_window: ''
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'approved', label: '已审批' },
  { value: 'executing', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const statusMap = {
  pending: { label: '待处理', class: 'tag-warning' },
  approved: { label: '已审批', class: 'tag-info' },
  executing: { label: '执行中', class: 'tag-primary' },
  completed: { label: '已完成', class: 'tag-success' },
  cancelled: { label: '已取消', class: 'tag-error' }
}

const riskLevelMap = {
  low: { label: '低风险', class: 'tag-success' },
  medium: { label: '中风险', class: 'tag-warning' },
  high: { label: '高风险', class: 'tag-error' }
}

const actionTypes = [
  '释放实例', '降配实例', '升配实例', '购买RI', '修改存储策略',
  '优化网络配置', '清理无用资源', '修改安全组', '其他'
]

const formatCurrency = (value) => {
  return `¥${Number(value || 0).toLocaleString()}`
}

const fetchWorkOrders = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    const data = await request.get('/workorders', { params })
    workOrders.value = data.list
    total.value = data.total
  } catch (err) {
    error.value = err.message || '加载工单失败'
    console.error('获取工单列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchWorkOrders()
}

const handleStatusFilter = (status) => {
  statusFilter.value = status
  page.value = 1
  fetchWorkOrders()
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchWorkOrders()
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const goToDetail = (id) => {
  router.push(`/workorders/${id}`)
}

const openCreateModal = () => {
  newOrder.value = {
    title: '',
    action_type: '',
    requester: '管理员',
    maintenance_window: ''
  }
  showCreateModal.value = true
}

const handleCreate = async () => {
  if (!newOrder.value.title.trim()) {
    alert('请输入工单标题')
    return
  }
  try {
    creating.value = true
    await request.post('/workorders', newOrder.value)
    showCreateModal.value = false
    fetchWorkOrders()
    alert('创建成功')
  } catch (err) {
    console.error('创建工单失败:', err)
    alert('创建失败: ' + err.message)
  } finally {
    creating.value = false
  }
}

const getStatusCount = (status) => {
  return workOrders.value.filter(o => o.status === status).length
}

onMounted(() => {
  fetchWorkOrders()
})
</script>

<template>
  <div class="workorders-page">
    <div class="grid grid-cols-5 gap-4 mb-4">
      <div class="stat-card cursor-pointer" @click="handleStatusFilter('')">
        <div class="stat-label">全部工单</div>
        <div class="stat-value text-primary">{{ total }}</div>
      </div>
      <div class="stat-card cursor-pointer" @click="handleStatusFilter('pending')">
        <div class="stat-label">待处理</div>
        <div class="stat-value text-warning">{{ getStatusCount('pending') }}</div>
      </div>
      <div class="stat-card cursor-pointer" @click="handleStatusFilter('approved')">
        <div class="stat-label">已审批</div>
        <div class="stat-value text-info">{{ getStatusCount('approved') }}</div>
      </div>
      <div class="stat-card cursor-pointer" @click="handleStatusFilter('executing')">
        <div class="stat-label">执行中</div>
        <div class="stat-value text-primary">{{ getStatusCount('executing') }}</div>
      </div>
      <div class="stat-card cursor-pointer" @click="handleStatusFilter('completed')">
        <div class="stat-label">已完成</div>
        <div class="stat-value text-success">{{ getStatusCount('completed') }}</div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">🔧 执行工单</h3>
        <button class="btn btn-primary" @click="openCreateModal">
          + 创建工单
        </button>
      </div>
      <div class="flex gap-3">
        <select v-model="statusFilter" class="select" style="width: 150px;" @change="handleSearch">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <input
          v-model="keyword"
          type="text"
          class="input"
          style="width: 300px;"
          placeholder="搜索工单号或标题"
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-primary" @click="handleSearch">搜索</button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span class="ml-2">加载中...</span>
      </div>

      <div v-else-if="error" class="error">
        <span>⚠️</span>
        <span>{{ error }}</span>
        <button class="btn btn-primary btn-sm mt-2" @click="fetchWorkOrders">重试</button>
      </div>

      <template v-else>
        <div v-if="workOrders.length === 0" class="empty">
          <span>📋</span>
          <span>暂无工单</span>
        </div>
        <div v-else>
          <div class="table-container overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>标题</th>
                  <th>资源</th>
                  <th>操作类型</th>
                  <th>风险等级</th>
                  <th>预计节省</th>
                  <th>申请人</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th style="width: 100px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in workOrders" :key="order.id" class="cursor-pointer" @click="goToDetail(order.id)">
                  <td class="font-mono text-sm text-primary">{{ order.work_order_no }}</td>
                  <td class="font-medium">{{ order.title }}</td>
                  <td>{{ order.resource_name || '-' }}</td>
                  <td><span class="tag tag-info">{{ order.action_type || '-' }}</span></td>
                  <td>
                    <span
                      v-if="order.risk_level"
                      class="tag"
                      :class="riskLevelMap[order.risk_level]?.class"
                    >
                      {{ riskLevelMap[order.risk_level]?.label }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="font-semibold text-success">
                    {{ formatCurrency(order.estimated_saving_monthly || order.estimated_saving) }}
                  </td>
                  <td>{{ order.requester }}</td>
                  <td>
                    <span class="tag" :class="statusMap[order.status]?.class">
                      {{ statusMap[order.status]?.label }}
                    </span>
                  </td>
                  <td class="text-sm text-secondary">
                    {{ order.created_at?.split('T')[0] }}
                  </td>
                  <td>
                    <button class="btn btn-primary btn-sm" @click.stop="goToDetail(order.id)">
                      详情
                    </button>
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

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">➕ 创建工单</h3>
          <button class="modal-close" @click="showCreateModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">工单标题 <span class="text-error">*</span></label>
            <input v-model="newOrder.title" type="text" class="input" placeholder="请输入工单标题" />
          </div>
          <div class="form-group">
            <label class="form-label">操作类型</label>
            <select v-model="newOrder.action_type" class="select">
              <option value="">请选择</option>
              <option v-for="type in actionTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">申请人</label>
            <input v-model="newOrder.requester" type="text" class="input" placeholder="请输入申请人" />
          </div>
          <div class="form-group">
            <label class="form-label">维护窗口</label>
            <input v-model="newOrder.maintenance_window" type="text" class="input" placeholder="如：2026-05-28 02:00-04:00" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" :disabled="creating" @click="handleCreate">
            <span v-if="creating">创建中...</span>
            <span v-else>确认创建</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workorders-page {
  min-height: 100%;
}

.overflow-x-auto {
  overflow-x: auto;
}

.font-mono {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.modal-body {
  padding: 0;
}

.text-info {
  color: var(--primary-color);
}
</style>
