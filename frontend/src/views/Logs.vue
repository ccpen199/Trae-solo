<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.module" placeholder="模块" clearable style="width: 140px;">
        <el-option label="震情管理" value="earthquake" />
        <el-option label="灾情上报" value="disaster" />
        <el-option label="救援调度" value="rescue" />
        <el-option label="物资保障" value="material" />
      </el-select>
      <el-button type="primary" @click="loadLogs" :icon="Search">查询</el-button>
      <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
    </div>

    <el-table :data="logs" v-loading="loading" size="small">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="module" label="模块" width="120">
        <template #default="{ row }">{{ getModuleLabel(row.module) }}</template>
      </el-table-column>
      <el-table-column prop="action" label="操作" width="120">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.action)" size="small">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="record_id" label="记录ID" width="100" />
      <el-table-column prop="operator" label="操作人" width="120" />
      <el-table-column prop="ip_address" label="IP地址" width="140" />
      <el-table-column prop="details" label="详情" min-width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.details" placement="top">
            <span style="cursor: pointer;">{{ formatDetails(row.details) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 16px; justify-content: flex-end;"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @current-change="loadLogs"
      @size-change="loadLogs" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { api } from '@/api'

const loading = ref(false)
const logs = ref([])

const filters = reactive({ module: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : '--'
const getModuleLabel = (m) => ({ earthquake: '震情管理', disaster: '灾情上报', rescue: '救援调度', material: '物资保障' }[m] || m)
const getActionType = (a) => ({ create: 'success', update: 'warning', delete: 'danger' }[a] || 'info')

const formatDetails = (d) => {
  if (!d) return '--'
  try {
    const obj = JSON.parse(d)
    return Object.keys(obj).length > 0 ? JSON.stringify(obj).substring(0, 50) + '...' : '--'
  } catch {
    return d.substring(0, 50) + (d.length > 50 ? '...' : '')
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await api.reports.logs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    })
    logs.value = res.list
    pagination.total = res.total
  } catch (err) {
    console.error('加载日志失败:', err)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.module = ''
  pagination.page = 1
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>
