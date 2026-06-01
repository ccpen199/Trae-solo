<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'
import { useAppStore } from '@/stores/app'
import { useRouter } from 'vue-router'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(false)
const error = ref(null)
const bills = ref([])
const aggregateData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const selectedIds = ref([])
const showAssignModal = ref(false)
const selectedProjectId = ref('')
const selectedTags = ref('')
const assigning = ref(false)
const onlyUnassigned = ref(false)

const filters = ref({
  account_id: '',
  project_id: '',
  product: '',
  region: '',
  start_date: '',
  end_date: '',
  is_assigned: ''
})

const viewMode = ref('list')
const groupBy = ref('account')

const aggregateOptions = [
  { value: 'account', label: '按账号' },
  { value: 'project', label: '按项目' },
  { value: 'product', label: '按产品' },
  { value: 'region', label: '按地域' },
  { value: 'date', label: '按时间' },
  { value: 'tag', label: '按标签' }
]

const accounts = computed(() => appStore.cloudAccounts)
const projects = computed(() => appStore.projects)

const formatCurrency = (value) => {
  return `¥${Number(value || 0).toLocaleString()}`
}

const formatTags = (tags) => {
  if (!tags) return '-'
  try {
    const tagObj = typeof tags === 'string' ? JSON.parse(tags) : tags
    if (Object.keys(tagObj).length === 0) return '-'
    return Object.entries(tagObj).map(([k, v]) => `${k}:${v}`).join(', ')
  } catch (e) {
    return tags || '-'
  }
}

const isUnassigned = (bill) => {
  return !bill.project_id || bill.project_name === null || bill.tags === '{}' || !bill.tags
}

const fetchBills = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filters.value
    }
    if (onlyUnassigned.value) {
      params.is_assigned = '0'
    }
    Object.keys(params).forEach(key => {
      if (!params[key] && params[key] !== 0) delete params[key]
    })
    const data = await request.get('/bills', { params })
    bills.value = data.list
    total.value = data.total
    selectedIds.value = []
  } catch (err) {
    error.value = err.message || '加载账单失败'
    console.error('获取账单列表失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchAggregate = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      group_by: groupBy.value,
      ...filters.value
    }
    if (onlyUnassigned.value) {
      params.is_assigned = '0'
    }
    Object.keys(params).forEach(key => {
      if (!params[key] && params[key] !== 0) delete params[key]
    })
    aggregateData.value = await request.get('/bills/aggregate', { params })
  } catch (err) {
    error.value = err.message || '加载聚合数据失败'
    console.error('获取账单聚合数据失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  if (viewMode.value === 'list') {
    fetchBills()
  } else {
    fetchAggregate()
  }
}

const handleReset = () => {
  filters.value = {
    account_id: '',
    project_id: '',
    product: '',
    region: '',
    start_date: '',
    end_date: '',
    is_assigned: ''
  }
  onlyUnassigned.value = false
  handleSearch()
}

const handleViewModeChange = (mode) => {
  viewMode.value = mode
  if (mode === 'list') {
    fetchBills()
  } else {
    fetchAggregate()
  }
}

const handleGroupByChange = (value) => {
  groupBy.value = value
  fetchAggregate()
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchBills()
}

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.length === bills.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = bills.value.map(r => r.id)
  }
}

const isAllSelected = computed(() => {
  return bills.value.length > 0 && selectedIds.value.length === bills.value.length
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const totalCost = computed(() => {
  if (viewMode.value === 'aggregate') {
    return aggregateData.value.reduce((sum, item) => sum + Number(item.total_cost || 0), 0)
  }
  return bills.value.reduce((sum, item) => sum + Number(item.cost || 0), 0)
})

const unassignedCount = computed(() => {
  return bills.value.filter(b => isUnassigned(b)).length
})

const openAssignModal = (bill = null) => {
  if (bill && !isUnassigned(bill)) {
    alert('该账单已归属项目，无需认领')
    return
  }
  if (!bill && selectedIds.value.length === 0) {
    alert('请先选择要认领的账单')
    return
  }
  selectedProjectId.value = ''
  selectedTags.value = ''
  showAssignModal.value = true
}

const handleAssign = async () => {
  if (!selectedProjectId.value) {
    alert('请选择要归属的项目')
    return
  }
  try {
    assigning.value = true
    const tagObj = selectedTags.value ? JSON.parse(selectedTags.value) : {}
    
    if (selectedIds.value.length > 0) {
      for (const billId of selectedIds.value) {
        const bill = bills.value.find(b => b.id === billId)
        if (bill && bill.resource_id) {
          await request.put(`/resources/${bill.resource_id}/assign`, {
            project_id: selectedProjectId.value,
            tags: tagObj
          })
        }
      }
    }
    alert('认领成功，已更新项目归属')
    showAssignModal.value = false
    fetchBills()
    appStore.fetchProjects()
  } catch (err) {
    alert('认领失败: ' + (err.message || '未知错误'))
  } finally {
    assigning.value = false
  }
}

const goToResource = (bill) => {
  if (bill.resource_id) {
    router.push({ path: '/resources/unassigned', query: { keyword: bill.resource_id } })
  }
}

const goToUnassigned = () => {
  router.push('/resources/unassigned')
}

onMounted(async () => {
  await Promise.all([
    appStore.fetchProjects(),
    appStore.fetchCloudAccounts()
  ])
  fetchBills()
})
</script>

<template>
  <div class="bills-page">
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">🔍 资源账单归集 - 筛选条件</h3>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="form-group">
          <label class="form-label">云账号</label>
          <select v-model="filters.account_id" class="select">
            <option value="">全部账号</option>
            <option v-for="acc in accounts" :key="acc.account_id" :value="acc.account_id">
              {{ acc.account_name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">项目</label>
          <select v-model="filters.project_id" class="select">
            <option value="">全部项目</option>
            <option v-for="proj in projects" :key="proj.id" :value="proj.id">
              {{ proj.project_name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">产品</label>
          <input v-model="filters.product" type="text" class="input" placeholder="请输入产品名称" />
        </div>
        <div class="form-group">
          <label class="form-label">地域</label>
          <input v-model="filters.region" type="text" class="input" placeholder="请输入地域" />
        </div>
        <div class="form-group">
          <label class="form-label">开始日期</label>
          <input v-model="filters.start_date" type="date" class="input" />
        </div>
        <div class="form-group">
          <label class="form-label">结束日期</label>
          <input v-model="filters.end_date" type="date" class="input" />
        </div>
        <div class="form-group">
          <label class="form-label flex items-center gap-2">
            <input type="checkbox" v-model="onlyUnassigned" class="mr-2" />
            <span class="text-warning font-semibold">🔍 仅显示未归属资源</span>
          </label>
        </div>
      </div>
      <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
        <div class="flex items-center gap-4">
          <div class="bg-warning bg-opacity-20 px-4 py-2 rounded-lg">
            <span class="text-sm">未归属账单: <span class="text-warning font-bold text-lg">{{ unassignedCount }}</span> 条</span>
          </div>
          <button class="btn btn-warning" @click="goToUnassigned">
            📦 去待认领资源
          </button>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-lg btn-secondary" @click="handleReset">🔄 重置</button>
          <button class="btn btn-lg btn-primary" @click="handleSearch">🔍 查询账单</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📋 资源账单归集列表</h3>
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg">
            <span class="text-sm text-gray-400">视图:</span>
            <button
              class="btn btn-view"
              :class="{ active: viewMode === 'list' }"
              @click="handleViewModeChange('list')"
            >
              📋 明细视图
            </button>
            <button
              class="btn btn-view"
              :class="{ active: viewMode === 'aggregate' }"
              @click="handleViewModeChange('aggregate')"
            >
              📊 聚合视图
            </button>
          </div>
          <select
            v-if="viewMode === 'aggregate'"
            v-model="groupBy"
            class="select select-lg"
            @change="handleGroupByChange(groupBy)"
          >
            <option v-for="opt in aggregateOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}汇总
            </option>
          </select>
          <div v-if="viewMode === 'list'" class="flex gap-2">
            <button 
              class="btn btn-lg btn-warning" 
              :disabled="selectedIds.length === 0"
              @click="openAssignModal()"
            >
              📌 批量认领 
              <span v-if="selectedIds.length > 0" class="ml-1 bg-white bg-opacity-20 px-2 py-0.5 rounded text-sm">
                {{ selectedIds.length }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span class="ml-2">加载中...</span>
      </div>

      <div v-else-if="error" class="error">
        <span>⚠️</span>
        <span>{{ error }}</span>
        <button class="btn btn-primary btn-sm mt-2" @click="handleSearch">重试</button>
      </div>

      <template v-else-if="viewMode === 'list'">
        <div v-if="bills.length === 0" class="empty">
          <span>📭</span>
          <span>暂无账单数据</span>
        </div>
        <div v-else>
          <div class="mb-3 flex justify-between items-center">
            <span class="text-sm text-secondary">
              共 {{ total }} 条记录，总费用: <span class="text-primary font-semibold">{{ formatCurrency(totalCost) }}</span>
            </span>
          </div>
          <div class="table-container overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 40px;">
                    <input 
                      type="checkbox" 
                      :checked="isAllSelected"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th>账单日期</th>
                  <th>资源ID</th>
                  <th>账号</th>
                  <th>项目</th>
                  <th>产品</th>
                  <th>地域</th>
                  <th>标签</th>
                  <th>费用</th>
                  <th>归属状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="bill in bills" :key="bill.id" :class="{ 'bg-warning-5': isUnassigned(bill) }">
                  <td>
                    <input 
                      type="checkbox" 
                      :checked="selectedIds.includes(bill.id)"
                      @change="toggleSelect(bill.id)"
                    />
                  </td>
                  <td>{{ bill.bill_date }}</td>
                  <td class="font-mono text-sm">{{ bill.resource_id }}</td>
                  <td>{{ bill.account_name || bill.account_id }}</td>
                  <td>
                    <span v-if="bill.project_name">{{ bill.project_name }}</span>
                    <span v-else class="text-warning">未归属</span>
                  </td>
                  <td><span class="tag tag-primary">{{ bill.product }}</span></td>
                  <td>{{ bill.region || '-' }}</td>
                  <td class="text-xs" :title="formatTags(bill.tags)">
                    {{ formatTags(bill.tags) }}
                  </td>
                  <td class="font-semibold">{{ formatCurrency(bill.cost) }}</td>
                  <td>
                    <span v-if="isUnassigned(bill)" class="tag tag-warning">待认领</span>
                    <span v-else class="tag tag-success">已归属</span>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button 
                        v-if="isUnassigned(bill)"
                        class="btn btn-xs btn-primary" 
                        @click="openAssignModal(bill)"
                      >
                        认领
                      </button>
                      <button 
                        class="btn btn-xs" 
                        @click="goToResource(bill)"
                      >
                        下钻
                      </button>
                    </div>
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

      <template v-else>
        <div v-if="aggregateData.length === 0" class="empty">
          <span>📭</span>
          <span>暂无聚合数据</span>
        </div>
        <div v-else>
          <div class="mb-3 flex justify-between items-center">
            <span class="text-sm text-secondary">
              共 {{ aggregateData.length }} 条聚合记录，按{{ aggregateOptions.find(o => o.value === groupBy)?.label }}汇总
            </span>
            <span class="font-semibold text-lg">
              总费用: <span class="text-primary">{{ formatCurrency(totalCost) }}</span>
            </span>
          </div>
          <div class="table-container overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th v-if="groupBy === 'account'">账号</th>
                  <th v-else-if="groupBy === 'project'">项目</th>
                  <th v-else-if="groupBy === 'product'">产品</th>
                  <th v-else-if="groupBy === 'region'">地域</th>
                  <th v-else-if="groupBy === 'date'">日期</th>
                  <th v-else-if="groupBy === 'tag'">标签</th>
                  <th>总费用</th>
                  <th>资源数</th>
                  <th>占比</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in aggregateData" :key="index">
                  <td v-if="groupBy === 'account'">{{ item.account_name || item.account_id || '-' }}</td>
                  <td v-else-if="groupBy === 'project'">
                    <span v-if="item.project_name">{{ item.project_name }}</span>
                    <span v-else class="text-warning">未归属项目</span>
                  </td>
                  <td v-else-if="groupBy === 'product'"><span class="tag tag-primary">{{ item.product }}</span></td>
                  <td v-else-if="groupBy === 'region'">{{ item.region || '-' }}</td>
                  <td v-else-if="groupBy === 'date'">{{ item.bill_date }}</td>
                  <td v-else-if="groupBy === 'tag'">
                    <span class="text-xs">{{ formatTags(item.tags) }}</span>
                  </td>
                  <td class="font-semibold">{{ formatCurrency(item.total_cost) }}</td>
                  <td>{{ item.resource_count }}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="progress-bar" style="width: 80px; height: 6px;">
                        <div
                          class="progress-bar-fill"
                          :style="{ width: totalCost > 0 ? (item.total_cost / totalCost * 100) + '%' : '0%' }"
                        ></div>
                      </div>
                      <span class="text-sm">
                        {{ totalCost > 0 ? (item.total_cost / totalCost * 100).toFixed(1) : 0 }}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <button 
                      class="btn btn-xs"
                      @click="() => { viewMode = 'list'; fetchBills(); }"
                    >
                      查看明细
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">📌 资源账单认领</h3>
          <button class="modal-close" @click="showAssignModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择项目 <span class="text-error">*</span></label>
            <select v-model="selectedProjectId" class="select">
              <option value="">请选择归属项目</option>
              <option v-for="proj in projects" :key="proj.id" :value="proj.id">
                {{ proj.project_name }} ({{ proj.project_code }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">标签 (JSON格式)</label>
            <textarea 
              v-model="selectedTags" 
              class="textarea" 
              rows="3"
              placeholder='{"Environment": "production", "Owner": "zhangsan"}'
            ></textarea>
            <div class="text-xs text-secondary mt-1">可选，格式如: {"key": "value"}</div>
          </div>
          <div v-if="selectedIds.length > 0" class="bg-tertiary p-3 rounded">
            <div class="text-sm">已选择 <span class="text-primary font-semibold">{{ selectedIds.length }}</span> 条账单进行认领</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showAssignModal = false">取消</button>
          <button class="btn btn-primary" :disabled="assigning" @click="handleAssign">
            <span v-if="assigning">认领中...</span>
            <span v-else>确认认领</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bills-page {
  min-height: 100%;
}

.overflow-x-auto {
  overflow-x: auto;
}

.font-mono {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.bg-warning-5 {
  background: rgba(250, 173, 20, 0.05);
}

.textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  resize: vertical;
}

.textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.modal-close:hover {
  background: var(--bg-tertiary);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.btn-xs {
  padding: 4px 10px;
  font-size: 12px;
  height: 26px;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
  height: 32px;
}

.btn-lg {
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  height: 42px;
  border-radius: 8px;
}

.btn-view {
  padding: 6px 14px;
  font-size: 13px;
  height: 34px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

.btn-view.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.btn-secondary {
  background: #374151;
  color: white;
  border: 1px solid #4b5563;
}

.btn-secondary:hover {
  background: #4b5563;
}

.select-lg {
  padding: 8px 14px;
  font-size: 14px;
  min-width: 140px;
  border-radius: 6px;
}

.border-gray-700 {
  border-color: #374151;
}

.bg-gray-800 {
  background: #1f2937;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-lg {
  font-size: 18px;
}

.font-bold {
  font-weight: 700;
}

.rounded-lg {
  border-radius: 8px;
}

.px-4 {
  padding-left: 16px;
  padding-right: 16px;
}

.py-2 {
  padding-top: 8px;
  padding-bottom: 8px;
}

.mt-6 {
  margin-top: 24px;
}

.border-t {
  border-top: 1px solid;
}

.pt-4 {
  padding-top: 16px;
}

.ml-1 {
  margin-left: 4px;
}

.bg-opacity-20 {
  opacity: 0.2;
}

.bg-white {
  background: white;
}

.px-2 {
  padding-left: 8px;
  padding-right: 8px;
}

.py-0\.5 {
  padding-top: 2px;
  padding-bottom: 2px;
}
</style>
