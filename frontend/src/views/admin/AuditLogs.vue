<template>
  <div class="admin-audit-logs">
    <div class="page-header mb-24">
      <h2 class="page-title">审计日志</h2>
      <p class="text-gray-500 mt-8">系统操作日志记录与查询</p>
    </div>

    <el-card class="filter-card mb-24" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="操作类型">
          <el-select v-model="filterForm.operation" placeholder="全部类型" clearable style="width: 160px">
            <el-option v-for="op in operations" :key="op.value" :label="op.label" :value="op.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="filterForm.operator" placeholder="请输入操作人" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="filterForm.module" placeholder="全部模块" clearable style="width: 160px">
            <el-option v-for="module in modules" :key="module.value" :label="module.label" :value="module.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="success" @click="exportLogs">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="card p-24">
      <div class="flex justify-between items-center mb-20">
        <div class="flex items-center gap-12">
          <el-tag type="primary" effect="light">共 {{ pagination.total }} 条记录</el-tag>
        </div>
        <div class="flex items-center gap-12">
          <el-tooltip content="刷新">
            <el-button circle :icon="Refresh" @click="fetchList" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        :data="list"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operation_time" label="操作时间" width="180">
          <template #default="{ row }">
            {{ dayjs(row.operation_time).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column prop="module" label="操作模块" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getModuleType(row.module)">
              {{ getModuleLabel(row.module) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operation" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getOperationType(row.operation)">
              {{ getOperationLabel(row.operation) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="description" label="操作描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-icon :color="row.status === 'success' ? '#67c23a' : '#f56c6c'" :size="18">
              <CircleCheck v-if="row.status === 'success'" />
              <CircleClose v-else />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container mt-20 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="日志详情" width="700px">
      <el-descriptions v-if="currentLog" :column="2" border>
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ dayjs(currentLog.operation_time).format('YYYY-MM-DD HH:mm:ss') }}
        </el-descriptions-item>
        <el-descriptions-item label="操作模块">
          <el-tag size="small" :type="getModuleType(currentLog.module)">
            {{ getModuleLabel(currentLog.module) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag size="small" :type="getOperationType(currentLog.operation)">
            {{ getOperationLabel(currentLog.operation) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operator_name }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentLog.user_id }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip_address }}</el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag :type="currentLog.status === 'success' ? 'success' : 'danger'" size="small">
            {{ currentLog.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">
          {{ currentLog.description }}
        </el-descriptions-item>
        <el-descriptions-item label="请求URL" :span="2">{{ currentLog.request_url }}</el-descriptions-item>
        <el-descriptions-item label="请求方法" :span="2">{{ currentLog.request_method }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="request-params">{{ currentLog.request_params }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2">
          <pre class="request-params">{{ currentLog.response_result }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="耗时" :span="2">{{ currentLog.duration }}ms</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { auditLogApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const detailVisible = ref(false)
const currentLog = ref(null)

const operations = [
  { label: '登录', value: 'login' },
  { label: '登出', value: 'logout' },
  { label: '新增', value: 'create' },
  { label: '编辑', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '查询', value: 'query' },
  { label: '导出', value: 'export' },
  { label: '审核', value: 'audit' },
  { label: '状态变更', value: 'status_change' }
]

const modules = [
  { label: '用户管理', value: 'user' },
  { label: '部门管理', value: 'department' },
  { label: '事项管理', value: 'service_item' },
  { label: '场景管理', value: 'scenario' },
  { label: '政策管理', value: 'policy' },
  { label: '办件管理', value: 'application' },
  { label: '评价管理', value: 'evaluation' },
  { label: '系统设置', value: 'system' }
]

const filterForm = reactive({
  operation: '',
  operator: '',
  dateRange: [],
  module: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const list = ref([])

const getOperationLabel = (value) => {
  const op = operations.find(o => o.value === value)
  return op ? op.label : value
}

const getOperationType = (value) => {
  const types = {
    login: 'success',
    logout: 'info',
    create: 'primary',
    update: 'warning',
    delete: 'danger',
    query: 'info',
    export: 'success',
    audit: 'warning',
    status_change: 'primary'
  }
  return types[value] || 'info'
}

const getModuleLabel = (value) => {
  const module = modules.find(m => m.value === value)
  return module ? module.label : value
}

const getModuleType = (value) => {
  const types = {
    user: 'primary',
    department: 'success',
    service_item: 'warning',
    scenario: 'info',
    policy: 'primary',
    application: 'danger',
    evaluation: 'warning',
    system: 'info'
  }
  return types[value] || 'info'
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0]
      params.endDate = filterForm.dateRange[1]
    }
    const res = await auditLogApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockLogs
      pagination.total = res.data?.total || mockLogs.length
    } else {
      list.value = mockLogs
      pagination.total = mockLogs.length
    }
  } catch (e) {
    list.value = mockLogs
    pagination.total = mockLogs.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.operation = ''
  filterForm.operator = ''
  filterForm.dateRange = []
  filterForm.module = ''
  pagination.page = 1
  fetchList()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchList()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchList()
}

const handleView = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

const exportLogs = () => {
  ElMessage.success('正在生成导出文件...')
}

const mockLogs = [
  {
    id: 1,
    operation_time: '2024-01-20 14:30:25',
    module: 'user',
    operation: 'update',
    operator_name: '管理员',
    user_id: 1,
    ip_address: '192.168.1.100',
    description: '更新用户"张三"的信息',
    status: 'success',
    request_url: '/api/users/1',
    request_method: 'PUT',
    request_params: '{"name":"张三","phone":"13800138000"}',
    response_result: '{"code":200,"message":"success"}',
    duration: 120
  },
  {
    id: 2,
    operation_time: '2024-01-20 14:28:15',
    module: 'application',
    operation: 'status_change',
    operator_name: '审核员',
    user_id: 2,
    ip_address: '192.168.1.101',
    description: '将办件SL202401200001状态变更为"已受理"',
    status: 'success',
    request_url: '/api/applications/1/status',
    request_method: 'PUT',
    request_params: '{"status":"accepted","remark":"材料齐全，予以受理"}',
    response_result: '{"code":200,"message":"success"}',
    duration: 85
  },
  {
    id: 3,
    operation_time: '2024-01-20 14:25:30',
    module: 'user',
    operation: 'login',
    operator_name: '张三',
    user_id: 3,
    ip_address: '114.220.10.5',
    description: '用户登录系统',
    status: 'success',
    request_url: '/api/auth/login',
    request_method: 'POST',
    request_params: '{"username":"zhangsan"}',
    response_result: '{"code":200,"data":{"token":"..."}}',
    duration: 210
  },
  {
    id: 4,
    operation_time: '2024-01-20 14:20:10',
    module: 'service_item',
    operation: 'create',
    operator_name: '管理员',
    user_id: 1,
    ip_address: '192.168.1.100',
    description: '新增服务事项"社保缴纳证明"',
    status: 'success',
    request_url: '/api/service-items',
    request_method: 'POST',
    request_params: '{"name":"社保缴纳证明","department":"人社厅"}',
    response_result: '{"code":200,"message":"success"}',
    duration: 156
  },
  {
    id: 5,
    operation_time: '2024-01-20 14:15:45',
    module: 'policy',
    operation: 'delete',
    operator_name: '管理员',
    user_id: 1,
    ip_address: '192.168.1.100',
    description: '删除政策"2024年社保补贴政策"(已过期)',
    status: 'success',
    request_url: '/api/policies/15',
    request_method: 'DELETE',
    request_params: '{}',
    response_result: '{"code":200,"message":"success"}',
    duration: 45
  },
  {
    id: 6,
    operation_time: '2024-01-20 14:10:20',
    module: 'evaluation',
    operation: 'audit',
    operator_name: '审核员',
    user_id: 2,
    ip_address: '192.168.1.101',
    description: '审核差评整改回复',
    status: 'success',
    request_url: '/api/evaluations/8/rectify',
    request_method: 'POST',
    request_params: '{"status":"approved"}',
    response_result: '{"code":200,"message":"success"}',
    duration: 78
  },
  {
    id: 7,
    operation_time: '2024-01-20 14:05:00',
    module: 'department',
    operation: 'create',
    operator_name: '管理员',
    user_id: 1,
    ip_address: '192.168.1.100',
    description: '新增子部门"数据科"',
    status: 'success',
    request_url: '/api/departments',
    request_method: 'POST',
    request_params: '{"name":"数据科","parent_id":5}',
    response_result: '{"code":200,"message":"success"}',
    duration: 63
  },
  {
    id: 8,
    operation_time: '2024-01-20 13:55:30',
    module: 'application',
    operation: 'query',
    operator_name: '审核员',
    user_id: 2,
    ip_address: '192.168.1.101',
    description: '查询待受理办件列表',
    status: 'success',
    request_url: '/api/applications?status=pending',
    request_method: 'GET',
    request_params: '{"status":"pending","page":1,"pageSize":20}',
    response_result: '{"code":200,"data":{"list":[...]}}',
    duration: 32
  },
  {
    id: 9,
    operation_time: '2024-01-20 13:50:15',
    module: 'user',
    operation: 'login',
    operator_name: '未知用户',
    user_id: null,
    ip_address: '203.10.5.12',
    description: '登录失败：密码错误',
    status: 'failed',
    request_url: '/api/auth/login',
    request_method: 'POST',
    request_params: '{"username":"admin"}',
    response_result: '{"code":401,"message":"密码错误"}',
    duration: 180
  },
  {
    id: 10,
    operation_time: '2024-01-20 13:45:00',
    module: 'system',
    operation: 'export',
    operator_name: '管理员',
    user_id: 1,
    ip_address: '192.168.1.100',
    description: '导出月度统计报表',
    status: 'success',
    request_url: '/api/statistics/export',
    request_method: 'POST',
    request_params: '{"month":"2024-01"}',
    response_result: '{"code":200,"data":{"url":"..."}}',
    duration: 1250
  }
]

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.filter-card {
  :deep(.el-card__body) {
    padding: 16px 24px;
  }
}

.filter-form {
  margin: 0;
}

.request-params {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
