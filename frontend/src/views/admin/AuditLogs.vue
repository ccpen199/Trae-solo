<template>
  <div class="audit-logs-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审计日志</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="操作类型">
          <el-select v-model="queryForm.action_type" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="登录" value="login" />
            <el-option label="登出" value="logout" />
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="审核" value="audit" />
            <el-option label="支付" value="payment" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标类型">
          <el-select v-model="queryForm.target_type" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="用户" value="user" />
            <el-option label="运单" value="waybill" />
            <el-option label="货源" value="cargo" />
            <el-option label="保单" value="insurance" />
            <el-option label="预警" value="alert" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="logs" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operator_name" label="操作人" width="140" />
        <el-table-column prop="operator_role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTag(row.operator_role)" size="small">
              {{ getRoleText(row.operator_role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action_type" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getActionTag(row.action_type)" size="small">
              {{ getActionText(row.action_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_type" label="目标类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTargetText(row.target_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_id" label="目标ID" width="100" />
        <el-table-column prop="action_desc" label="操作描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="user_agent" label="客户端" min-width="180" show-overflow-tooltip />
        <el-table-column prop="created_at" label="操作时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchLogs"
        @current-change="fetchLogs"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="日志详情" width="600px">
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.created_at }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operator_name }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ getRoleText(currentLog.operator_role) }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ getActionText(currentLog.action_type) }}</el-descriptions-item>
        <el-descriptions-item label="目标类型">{{ getTargetText(currentLog.target_type) }}</el-descriptions-item>
        <el-descriptions-item label="目标ID">{{ currentLog.target_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip_address }}</el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{ currentLog.action_desc }}</el-descriptions-item>
        <el-descriptions-item label="客户端" :span="2">{{ currentLog.user_agent || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2" v-if="currentLog.request_params">
          <pre>{{ JSON.stringify(currentLog.request_params, null, 2) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2" v-if="currentLog.response_data">
          <pre>{{ JSON.stringify(currentLog.response_data, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '../../api'

const loading = ref(false)
const logs = ref([])
const total = ref(0)
const currentLog = ref(null)
const detailDialogVisible = ref(false)

const queryForm = reactive({
  action_type: '',
  target_type: '',
  page: 1,
  page_size: 20
})

const roleMap = {
  shipper: { text: '货主', tag: 'primary' },
  driver: { text: '司机', tag: 'success' },
  admin: { text: '管理员', tag: 'warning' }
}

const actionMap = {
  login: { text: '登录', tag: 'success' },
  logout: { text: '登出', tag: 'info' },
  create: { text: '创建', tag: 'primary' },
  update: { text: '更新', tag: 'warning' },
  delete: { text: '删除', tag: 'danger' },
  audit: { text: '审核', tag: '' },
  payment: { text: '支付', tag: 'success' }
}

const targetMap = {
  user: '用户',
  waybill: '运单',
  cargo: '货源',
  insurance: '保单',
  alert: '预警',
  payment: '支付',
  other: '其他'
}

function getRoleText(role) {
  return roleMap[role]?.text || role
}

function getRoleTag(role) {
  return roleMap[role]?.tag || 'info'
}

function getActionText(action) {
  return actionMap[action]?.text || action
}

function getActionTag(action) {
  return actionMap[action]?.tag || 'info'
}

function getTargetText(target) {
  return targetMap[target] || target
}

async function fetchLogs() {
  loading.value = true
  try {
    const params = { ...queryForm }
    if (!params.action_type) delete params.action_type
    if (!params.target_type) delete params.target_type
    const res = await adminApi.getAuditLogs(params)
    if (res.data?.list) {
      logs.value = res.data.list
      total.value = res.data.total || 0
    } else {
      logs.value = res.data || []
      total.value = res.data?.length || 0
    }
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.action_type = ''
  queryForm.target_type = ''
  queryForm.page = 1
  fetchLogs()
}

function viewDetail(row) {
  currentLog.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.audit-logs-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card-header {
  font-weight: 600;
  font-size: 16px;
}
.query-form {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
  display: flex;
}
pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
