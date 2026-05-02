<template>
  <div class="logs-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审计日志</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.action_type" placeholder="全部类型" clearable>
            <el-option
              v-for="type in actionTypes"
              :key="type"
              :label="getActionTypeLabel(type)"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="searchForm.operator_name" placeholder="操作人名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_no" placeholder="订单号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLogs">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="audit_no" label="审计编号" min-width="180">
          <template #default="{ row }">
            <el-text type="primary" size="small" @click="viewDetail(row)" class="link-text">
              {{ row.audit_no }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column prop="action_type" label="操作类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action_type)" size="small">
              {{ getActionTypeLabel(row.action_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column prop="operator_role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getRoleLabel(row.operator_role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resource_type" label="资源类型" width="100" />
        <el-table-column prop="order_no" label="订单号" min-width="180">
          <template #default="{ row }">
            <span v-if="row.order_no">{{ row.order_no }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadLogs"
        @current-change="loadLogs"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(false)

const searchForm = reactive({
  action_type: '',
  operator_name: '',
  order_no: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

const logs = ref([])
const actionTypes = ref([])

const actionTypeMap = {
  order_create: '创建订单',
  order_pay: '订单支付',
  order_cancel: '取消订单',
  order_close: '关闭订单',
  refund_create: '创建退款',
  refund_process: '处理退款',
  refund_success: '退款成功',
  refund_fail: '退款失败',
  reconciliation_run: '执行对账',
  reconciliation_resolve: '处理对账差异',
  payout_create: '创建打款',
  payout_process: '处理打款',
  payout_success: '打款成功',
  payout_fail: '打款失败',
  profit_sharing_create: '创建分润',
  profit_sharing_process: '处理分润',
  user_login: '用户登录',
  user_logout: '用户登出',
  merchant_update: '更新商户',
  channel_update: '更新渠道',
  audit_query: '审计查询'
}

const roleMap = {
  customer: 'C端用户',
  merchant_operator: '商户运营',
  merchant_admin: '商户管理员',
  finance: '财务人员',
  channel_operator: '渠道商',
  admin: '系统管理员'
}

function getActionTypeLabel(type) {
  return actionTypeMap[type] || type
}

function getActionTagType(type) {
  const dangerTypes = ['order_close', 'refund_fail', 'payout_fail', 'reconciliation_resolve']
  const warningTypes = ['order_cancel', 'refund_create', 'refund_process']
  const successTypes = ['order_pay', 'refund_success', 'payout_success', 'profit_sharing_process']
  
  if (dangerTypes.includes(type)) return 'danger'
  if (warningTypes.includes(type)) return 'warning'
  if (successTypes.includes(type)) return 'success'
  return 'info'
}

function getRoleLabel(role) {
  return roleMap[role] || role
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadActionTypes() {
  try {
    const response = await api.get('/v1/audit/action-types')
    if (response.success) {
      actionTypes.value = response.data.action_types || []
    }
  } catch (error) {
    console.error('Load action types error:', error)
  }
}

async function loadLogs() {
  loading.value = true
  try {
    const params = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize
    }
    if (searchForm.action_type) {
      params.action_type = searchForm.action_type
    }
    if (searchForm.operator_name) {
      params.operator_name = searchForm.operator_name
    }
    if (searchForm.order_no) {
      params.order_no = searchForm.order_no
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.start_date = searchForm.dateRange[0]
      params.end_date = searchForm.dateRange[1]
    }
    
    const response = await api.get('/v1/audit/logs', { params })
    if (response.success) {
      pagination.total = response.data.total
      logs.value = response.data.logs
    }
  } catch (error) {
    console.error('Load logs error:', error)
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.action_type = ''
  searchForm.operator_name = ''
  searchForm.order_no = ''
  searchForm.dateRange = []
  pagination.page = 1
  loadLogs()
}

function viewDetail(row) {
  router.push({ 
    name: 'AuditLogDetail', 
    params: { auditNo: row.audit_no } 
  })
}

onMounted(() => {
  loadActionTypes()
  loadLogs()
})
</script>

<style scoped>
.logs-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.link-text {
  cursor: pointer;
}

.link-text:hover {
  text-decoration: underline;
}

.text-muted {
  color: #909399;
}
</style>
