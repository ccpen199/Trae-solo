<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const loading = ref(false)
const error = ref(null)
const resources = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const selectedIds = ref([])
const showAssignModal = ref(false)
const selectedProjectId = ref('')
const assigning = ref(false)

const projects = computed(() => appStore.projects)

const formatCurrency = (value) => {
  return `¥${Number(value || 0).toLocaleString()}`
}

const fetchResources = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    const data = await request.get('/resources/unassigned', { params })
    resources.value = data.list
    total.value = data.total
    selectedIds.value = []
  } catch (err) {
    error.value = err.message || '加载资源失败'
    console.error('获取待认领资源失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchResources()
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchResources()
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
  if (selectedIds.value.length === resources.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = resources.value.map(r => r.id)
  }
}

const isAllSelected = computed(() => {
  return resources.value.length > 0 && selectedIds.value.length === resources.value.length
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const totalMonthlyCost = computed(() => {
  return resources.value.reduce((sum, r) => sum + Number(r.monthly_cost || 0), 0)
})

const openAssignModal = () => {
  if (selectedIds.value.length === 0) {
    alert('请先选择要认领的资源')
    return
  }
  selectedProjectId.value = ''
  showAssignModal.value = true
}

const handleAssign = async () => {
  if (!selectedProjectId.value) {
    alert('请选择要分配到的项目')
    return
  }
  try {
    assigning.value = true
    const promises = selectedIds.value.map(id =>
      request.put(`/resources/${id}/assign`, { project_id: selectedProjectId.value })
    )
    await Promise.all(promises)
    showAssignModal.value = false
    selectedIds.value = []
    fetchResources()
    alert(`成功认领 ${selectedIds.value.length} 个资源`)
  } catch (err) {
    console.error('资源认领失败:', err)
    alert('认领失败: ' + err.message)
  } finally {
    assigning.value = false
  }
}

const handleSingleAssign = async (resourceId) => {
  const projectName = prompt('请输入项目ID:')
  if (!projectName) return

  const project = projects.value.find(p =>
    p.project_name === projectName || p.project_code === projectName || String(p.id) === projectName
  )

  if (!project) {
    alert('未找到对应的项目')
    return
  }

  try {
    await request.put(`/resources/${resourceId}/assign`, { project_id: project.id })
    fetchResources()
    alert('认领成功')
  } catch (err) {
    console.error('资源认领失败:', err)
    alert('认领失败: ' + err.message)
  }
}

onMounted(async () => {
  await appStore.fetchProjects()
  fetchResources()
})
</script>

<template>
  <div class="unassigned-page">
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">📦 待认领资源</h3>
        <div class="flex items-center gap-3">
          <span class="text-sm text-secondary">
            共 {{ total }} 个待认领资源，预估月成本:
            <span class="text-warning font-semibold">{{ formatCurrency(totalMonthlyCost) }}</span>
          </span>
        </div>
      </div>
      <div class="flex gap-3">
        <input
          v-model="keyword"
          type="text"
          class="input"
          style="width: 300px;"
          placeholder="搜索资源ID或资源名称"
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-primary" @click="handleSearch">搜索</button>
        <button
          class="btn btn-success"
          :disabled="selectedIds.length === 0"
          @click="openAssignModal"
        >
          批量认领 ({{ selectedIds.length }})
        </button>
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
        <button class="btn btn-primary btn-sm mt-2" @click="fetchResources">重试</button>
      </div>

      <template v-else>
        <div v-if="resources.length === 0" class="empty">
          <span>🎉</span>
          <span>暂无待认领资源</span>
        </div>
        <div v-else>
          <div class="table-container overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50px;">
                    <input
                      type="checkbox"
                      class="checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th>资源ID</th>
                  <th>资源名称</th>
                  <th>资源类型</th>
                  <th>所属账号</th>
                  <th>地域</th>
                  <th>状态</th>
                  <th>月均成本</th>
                  <th>创建时间</th>
                  <th style="width: 120px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="resource in resources" :key="resource.id">
                  <td>
                    <input
                      type="checkbox"
                      class="checkbox"
                      :checked="selectedIds.includes(resource.id)"
                      @change="toggleSelect(resource.id)"
                    />
                  </td>
                  <td class="font-mono text-sm">{{ resource.resource_id }}</td>
                  <td class="font-medium">{{ resource.resource_name }}</td>
                  <td><span class="tag tag-primary">{{ resource.resource_type }}</span></td>
                  <td>{{ resource.account_name || resource.account_id }}</td>
                  <td>{{ resource.region || '-' }}</td>
                  <td>
                    <span
                      class="tag"
                      :class="resource.status === 'running' ? 'tag-success' : 'tag-info'"
                    >
                      {{ resource.status === 'running' ? '运行中' : '已停止' }}
                    </span>
                  </td>
                  <td class="font-semibold text-warning">{{ formatCurrency(resource.monthly_cost) }}</td>
                  <td class="text-sm text-secondary">{{ resource.created_at?.split('T')[0] }}</td>
                  <td>
                    <button class="btn btn-primary btn-sm" @click="handleSingleAssign(resource.id)">
                      认领
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="text-sm text-secondary mr-4">
              已选择 {{ selectedIds.length }} 项
            </span>
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

    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">📝 批量认领资源</h3>
          <button class="modal-close" @click="showAssignModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="mb-4 text-secondary">
            已选择 <span class="text-primary font-semibold">{{ selectedIds.length }}</span> 个资源
          </p>
          <div class="form-group">
            <label class="form-label">分配到项目</label>
            <select v-model="selectedProjectId" class="select">
              <option value="">请选择项目</option>
              <option v-for="proj in projects" :key="proj.id" :value="proj.id">
                {{ proj.project_name }} ({{ proj.project_code }})
              </option>
            </select>
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
.unassigned-page {
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

.mr-4 {
  margin-right: 16px;
}
</style>
