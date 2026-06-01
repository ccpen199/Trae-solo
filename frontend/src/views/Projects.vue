<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'

const loading = ref(false)
const error = ref(null)
const projects = ref([])
const budgets = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const showBudgetModal = ref(false)
const selectedProject = ref(null)
const editingBudget = ref({
  period: '',
  budget_amount: 0,
  warning_threshold: 80
})
const saving = ref(false)

const formatCurrency = (value) => {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(2)}万`
  }
  return `¥${Number(value || 0).toLocaleString()}`
}

const fetchProjects = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await request.get('/finance/budgets', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        period: '2026-05'
      }
    })
    budgets.value = data.list
    total.value = data.total

    const projectMap = new Map()
    data.list.forEach(item => {
      if (item.project_id && !projectMap.has(item.project_id)) {
        projectMap.set(item.project_id, {
          id: item.project_id,
          project_code: item.project_code,
          project_name: item.project_name,
          department: item.department,
          product_line: item.product_line,
          owner: item.owner,
          budget_monthly: item.budget_amount
        })
      }
    })
    projects.value = Array.from(projectMap.values())
  } catch (err) {
    error.value = err.message || '加载数据失败'
    console.error('获取项目列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchProjects()
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchProjects()
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const getProjectBudget = (projectId) => {
  return budgets.value.find(b => b.project_id === projectId)
}

const openBudgetModal = (project) => {
  selectedProject.value = project
  const budget = getProjectBudget(project.id)
  editingBudget.value = {
    period: '2026-05',
    budget_amount: budget?.budget_amount || project.budget_monthly || 0,
    warning_threshold: budget?.warning_threshold || 80
  }
  showBudgetModal.value = true
}

const handleSaveBudget = async () => {
  if (!editingBudget.value.budget_amount || editingBudget.value.budget_amount < 0) {
    alert('请输入有效的预算金额')
    return
  }
  try {
    saving.value = true
    alert('预算设置功能需要后端API支持，当前为演示模式')
    showBudgetModal.value = false
  } catch (err) {
    console.error('保存预算失败:', err)
    alert('保存失败: ' + err.message)
  } finally {
    saving.value = false
  }
}

const getUsageStatus = (usage) => {
  if (usage >= 100) return 'over'
  if (usage >= 80) return 'warning'
  return 'normal'
}

const statusMap = {
  normal: { label: '正常', class: 'tag-success' },
  warning: { label: '预警', class: 'tag-warning' },
  over: { label: '超支', class: 'tag-error' }
}

const totalStats = computed(() => {
  if (!budgets.value.length) return null
  const sum = budgets.value.reduce((acc, item) => ({
    budget: acc.budget + (item.budget_amount || 0),
    actual: acc.actual + (item.actual_cost || 0)
  }), { budget: 0, actual: 0 })
  return {
    ...sum,
    remaining: Math.max(0, sum.budget - sum.actual),
    usage_rate: sum.budget > 0 ? (sum.actual / sum.budget * 100).toFixed(2) : 0
  }
})

const warningCount = computed(() => {
  return budgets.value.filter(b => b.status === 'warning' || b.status === 'over').length
})

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="projects-page">
    <div v-if="totalStats" class="grid grid-cols-4 gap-4 mb-4">
      <div class="stat-card">
        <div class="stat-label">项目总数</div>
        <div class="stat-value text-primary">{{ projects.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总预算</div>
        <div class="stat-value text-primary">{{ formatCurrency(totalStats.budget) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">实际支出</div>
        <div class="stat-value" :class="totalStats.usage_rate >= 100 ? 'text-error' : 'text-success'">
          {{ formatCurrency(totalStats.actual) }}
        </div>
        <div class="text-sm text-secondary mt-1">
          使用率: {{ totalStats.usage_rate }}%
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">预警项目</div>
        <div class="stat-value" :class="warningCount > 0 ? 'text-warning' : 'text-success'">
          {{ warningCount }}
        </div>
        <div class="text-sm text-secondary mt-1">
          剩余预算: {{ formatCurrency(totalStats.remaining) }}
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">📁 项目管理</h3>
      </div>
      <div class="flex gap-3">
        <input
          v-model="keyword"
          type="text"
          class="input"
          style="width: 300px;"
          placeholder="搜索项目名称或编码"
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
        <button class="btn btn-primary btn-sm mt-2" @click="fetchProjects">重试</button>
      </div>

      <template v-else>
        <div v-if="projects.length === 0" class="empty">
          <span>📁</span>
          <span>暂无项目数据</span>
        </div>
        <div v-else>
          <div class="table-container overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>项目编码</th>
                  <th>项目名称</th>
                  <th>部门</th>
                  <th>产品线</th>
                  <th>负责人</th>
                  <th>月度预算</th>
                  <th>实际支出</th>
                  <th>使用率</th>
                  <th>剩余预算</th>
                  <th>状态</th>
                  <th style="width: 120px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in projects" :key="project.id">
                  <td class="font-mono text-sm">{{ project.project_code }}</td>
                  <td class="font-medium">{{ project.project_name }}</td>
                  <td>{{ project.department || '-' }}</td>
                  <td>{{ project.product_line || '-' }}</td>
                  <td>{{ project.owner || '-' }}</td>
                  <td>{{ formatCurrency(project.budget_monthly) }}</td>
                  <td class="font-semibold">
                    <span v-if="getProjectBudget(project.id)">
                      {{ formatCurrency(getProjectBudget(project.id).actual_cost) }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <span v-if="getProjectBudget(project.id)">
                      <div class="flex items-center gap-2">
                        <div class="progress-bar" style="width: 80px; height: 6px;">
                          <div
                            class="progress-bar-fill"
                            :class="{
                              warning: getUsageStatus(getProjectBudget(project.id).usage_rate) === 'warning',
                              danger: getUsageStatus(getProjectBudget(project.id).usage_rate) === 'over'
                            }"
                            :style="{ width: Math.min(getProjectBudget(project.id).usage_rate, 100) + '%' }"
                          ></div>
                        </div>
                        <span class="text-sm">{{ getProjectBudget(project.id).usage_rate }}%</span>
                      </div>
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <span v-if="getProjectBudget(project.id)" :class="getProjectBudget(project.id).remaining_budget <= 0 ? 'text-error' : 'text-success'">
                      {{ formatCurrency(getProjectBudget(project.id).remaining_budget) }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <span
                      v-if="getProjectBudget(project.id)"
                      class="tag"
                      :class="statusMap[getUsageStatus(getProjectBudget(project.id).usage_rate)]?.class"
                    >
                      {{ statusMap[getUsageStatus(getProjectBudget(project.id).usage_rate)]?.label }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <button class="btn btn-primary btn-sm" @click="openBudgetModal(project)">
                      预算设置
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

    <div v-if="showBudgetModal" class="modal-overlay" @click.self="showBudgetModal = false">
      <div class="modal" style="min-width: 450px;">
        <div class="modal-header">
          <h3 class="modal-title">💰 预算设置</h3>
          <button class="modal-close" @click="showBudgetModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="mb-4 p-3 rounded bg-tertiary">
            <div class="font-medium">{{ selectedProject?.project_name }}</div>
            <div class="text-sm text-secondary mt-1">{{ selectedProject?.project_code }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">预算周期</label>
            <input v-model="editingBudget.period" type="month" class="input" />
          </div>
          <div class="form-group">
            <label class="form-label">预算金额 (元)</label>
            <input
              v-model.number="editingBudget.budget_amount"
              type="number"
              min="0"
              step="1000"
              class="input"
              placeholder="请输入预算金额"
            />
          </div>
          <div class="form-group">
            <label class="form-label">预警阈值 (%)</label>
            <input
              v-model.number="editingBudget.warning_threshold"
              type="number"
              min="0"
              max="100"
              class="input"
              placeholder="默认80%"
            />
            <div class="text-sm text-muted mt-1">
              当使用率超过该值时触发预警
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showBudgetModal = false">取消</button>
          <button class="btn btn-primary" :disabled="saving" @click="handleSaveBudget">
            <span v-if="saving">保存中...</span>
            <span v-else>保存</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.projects-page {
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

.bg-tertiary {
  background: var(--bg-tertiary);
}
</style>
