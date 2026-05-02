<template>
  <div class="audit-list">
    <el-card>
      <template #header>
        <div class="card-toolbar">
          <span class="card-title">审计日志</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作人">
          <el-input
            v-model="searchForm.operatorName"
            placeholder="请输入操作人"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="searchForm.action"
            placeholder="请选择操作类型"
            clearable
          >
            <el-option label="创建" value="CREATE" />
            <el-option label="更新" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="状态变更" value="STATUS_CHANGE" />
            <el-option label="审批" value="APPROVE" />
            <el-option label="拒绝" value="REJECT" />
            <el-option label="登录" value="LOGIN" />
            <el-option label="登出" value="LOGOUT" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="auditLogs" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="action" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100" />
        <el-table-column prop="targetType" label="目标类型" width="100" />
        <el-table-column prop="targetId" label="目标ID" width="100" />
        <el-table-column prop="targetNo" label="目标编号" width="160" />
        <el-table-column prop="description" label="操作描述" min-width="250">
          <template #default="{ row }">
            <el-tooltip :content="row.description" placement="top-start">
              <span>{{ row.description }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="operatorRole" label="角色" width="100">
          <template #default="{ row }">
            {{ getRoleLabel(row.operatorRole) }}
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      title="审计日志详情"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getActionType(currentLog?.action)">
            {{ getActionLabel(currentLog?.action) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模块">
          {{ currentLog?.module || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="目标类型">
          {{ currentLog?.targetType || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="目标编号">
          {{ currentLog?.targetNo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentLog?.operatorName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作角色">
          {{ getRoleLabel(currentLog?.operatorRole) }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ currentLog?.ipAddress || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ formatTime(currentLog?.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">
          {{ currentLog?.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="变更前数据" :span="2">
          <pre v-if="currentLog?.beforeData" class="json-pre">{{ formatJson(currentLog.beforeData) }}</pre>
          <span v-else class="text-muted">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="变更后数据" :span="2">
          <pre v-if="currentLog?.afterData" class="json-pre">{{ formatJson(currentLog.afterData) }}</pre>
          <span v-else class="text-muted">-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { auditApi } from '@/api'
import { ElMessage } from 'element-plus'
import { ROLE_LABELS } from '@/utils/constants'

const loading = ref(false)
const auditLogs = ref([])
const detailDialogVisible = ref(false)
const currentLog = ref(null)

const searchForm = reactive({
  operatorName: '',
  action: '',
  dateRange: null,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const actionTypes = {
  CREATE: { label: '创建', type: 'success' },
  UPDATE: { label: '更新', type: 'primary' },
  DELETE: { label: '删除', type: 'danger' },
  STATUS_CHANGE: { label: '状态变更', type: 'warning' },
  APPROVE: { label: '审批', type: 'success' },
  REJECT: { label: '拒绝', type: 'danger' },
  LOGIN: { label: '登录', type: 'info' },
  LOGOUT: { label: '登出', type: 'info' },
}

const getActionLabel = (action) => actionTypes[action]?.label || action || '未知'
const getActionType = (action) => actionTypes[action]?.type || 'info'
const getRoleLabel = (role) => ROLE_LABELS[role] || role || '-'

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const formatJson = (data) => {
  if (!data) return ''
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (e) {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.operatorName) {
      params.operatorName = searchForm.operatorName
    }
    if (searchForm.action) {
      params.action = searchForm.action
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }

    const result = await auditApi.getList(params)
    if (result.success) {
      auditLogs.value = result.data?.list || []
      pagination.total = result.data?.total || 0
    }
  } catch (error) {
    console.error('Fetch audit logs error:', error)
    ElMessage.error('获取审计日志失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.operatorName = ''
  searchForm.action = ''
  searchForm.dateRange = null
  handleSearch()
}

const handleViewDetail = (row) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.audit-list {
  padding: 0;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-muted {
  color: #909399;
}

.json-pre {
  margin: 0;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
</style>
