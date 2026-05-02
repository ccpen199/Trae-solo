<template>
  <div class="audit-log">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审计日志</span>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="操作人">
          <el-input v-model="filters.operator_name" placeholder="操作人名称" clearable />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="filters.order_no" placeholder="订单号" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLogs">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="logs" v-loading="loading" style="width: 100%">
        <el-table-column prop="action" label="操作类型" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column prop="operator_role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.operator_role)" size="small">
              {{ row.operator_role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="订单号" width="160">
          <template #default="{ row }">
            <span v-if="row.order_no">{{ row.order_no }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="from_status" label="状态变更" min-width="200">
          <template #default="{ row }">
            <span v-if="row.from_status || row.to_status">
              <span v-if="row.from_status">{{ row.from_status }}</span>
              <el-icon v-if="row.from_status && row.to_status"><ArrowRight /></el-icon>
              <span v-if="row.to_status" class="text-primary">{{ row.to_status }}</span>
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="详情" width="80" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              size="small"
              @click="showDetail(row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      title="审计详情"
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="操作类型">{{ currentLog?.action }}</el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentLog?.operator_name }}
          <el-tag :type="getRoleTagType(currentLog?.operator_role)" size="small" style="margin-left: 8px">
            {{ currentLog?.operator_role }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentLog?.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发票ID">{{ currentLog?.invoice_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDateTime(currentLog?.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog?.ip_address || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider v-if="currentLog?.details" content-position="left">操作详情</el-divider>
      <div v-if="currentLog?.details" class="detail-content">
        <pre>{{ JSON.stringify(currentLog.details, null, 2) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/utils/api'

const loading = ref(false)
const logs = ref([])
const detailDialogVisible = ref(false)
const currentLog = ref(null)

const filters = reactive({
  operator_name: '',
  order_no: '',
  dateRange: null
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('zh-CN')
}

const getRoleTagType = (role) => {
  const types = {
    customer: 'warning',
    finance: 'primary',
    tax: 'success',
    sales: 'info'
  }
  return types[role] || 'info'
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (filters.operator_name) params.operator_name = filters.operator_name
    if (filters.order_no) params.order_no = filters.order_no
    if (filters.dateRange?.length === 2) {
      params.start_date = filters.dateRange[0]
      params.end_date = filters.dateRange[1]
    }

    const data = await api.get('/audit', { params })
    logs.value = data.logs
    pagination.total = data.pagination.total
  } catch (e) {
    console.error('Failed to load logs:', e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  filters.operator_name = ''
  filters.order_no = ''
  filters.dateRange = null
  pagination.page = 1
  loadLogs()
}

const showDetail = (log) => {
  currentLog.value = log
  detailDialogVisible.value = true
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.audit-log {
  height: 100%;
}

.card-header {
  font-weight: 600;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-muted {
  color: #909399;
}

.text-primary {
  color: #409eff;
}

.detail-content pre {
  margin: 0;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  overflow-x: auto;
}
</style>
