<template>
  <div>
    <div class="page-header">
      <div class="page-title">风控管理</div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="风控记录" name="records">
        <div class="card-content">
          <div class="filter-bar">
            <el-select v-model="filters.type" placeholder="类型" clearable style="width: 140px;" @change="loadRecords">
              <el-option label="异常充值" value="abnormal_recharge" />
              <el-option label="恶意刷榜" value="malicious_ranking" />
              <el-option label="退款争议" value="refund_dispute" />
              <el-option label="未成年消费" value="minor_consumption" />
            </el-select>
            <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;" @change="loadRecords">
              <el-option label="待处理" value="pending" />
              <el-option label="已处理" value="handled" />
              <el-option label="已忽略" value="ignored" />
            </el-select>
            <el-button type="primary" @click="loadRecords">查询</el-button>
          </div>

          <el-table :data="records" v-loading="loading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">{{ typeMap[row.type] }}</template>
            </el-table-column>
            <el-table-column label="用户" width="140">
              <template #default="{ row }">{{ row.user_nickname || row.user_name }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="涉及金额" width="100">
              <template #default="{ row }">{{ row.amount ? '¥' + row.amount.toFixed(2) : '-' }}</template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)">{{ statusMap[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="处理人" width="100">
              <template #default="{ row }">{{ row.handler_name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="handleHandle(row)" v-if="row.status === 'pending'">处理</el-button>
                <el-button size="small" @click="viewDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="recordPagination.page"
              v-model:page-size="recordPagination.pageSize"
              :total="recordPagination.total"
              @current-change="loadRecords"
              @size-change="loadRecords"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="冻结收益" name="frozen">
        <div class="card-content">
          <el-table :data="frozenIncome" v-loading="frozenLoading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="用户" width="140">
              <template #default="{ row }">{{ row.nickname || row.username }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="冻结金额" width="120">
              <template #default="{ row }">¥{{ row.amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="reason" label="冻结原因" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag type="warning">{{ row.status === 'frozen' ? '冻结中' : '已解冻' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="冻结时间" width="160" />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="handleDialogVisible" title="处理风控记录" width="500px">
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="处理结果">
          <el-select v-model="handleForm.status" style="width: 100%;">
            <el-option label="已处理" value="handled" />
            <el-option label="忽略" value="ignored" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行动作">
          <el-select v-model="handleForm.action" style="width: 100%;">
            <el-option label="无操作" value="none" />
            <el-option label="冻结收益" value="freeze" />
            <el-option label="退款" value="refund" />
            <el-option label="解冻" value="unfreeze" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleForm.handleRemark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle" :loading="handling">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const activeTab = ref('records')
const records = ref([])
const frozenIncome = ref([])
const loading = ref(false)
const frozenLoading = ref(false)
const handling = ref(false)
const handleDialogVisible = ref(false)
const currentRecord = ref(null)

const filters = reactive({ type: '', status: '' })
const recordPagination = reactive({ page: 1, pageSize: 20, total: 0 })

const handleForm = reactive({ status: 'handled', action: 'none', handleRemark: '' })

const typeMap = {
  abnormal_recharge: '异常充值',
  malicious_ranking: '恶意刷榜',
  refund_dispute: '退款争议',
  minor_consumption: '未成年消费'
}
const statusMap = { pending: '待处理', handled: '已处理', ignored: '已忽略' }
const statusType = s => s === 'pending' ? 'warning' : s === 'handled' ? 'success' : 'info'

async function loadRecords() {
  loading.value = true
  try {
    const data = await request.get('/risk/records', { params: { ...filters, ...recordPagination } })
    records.value = data.items
    recordPagination.total = data.total
  } finally {
    loading.value = false
  }
}

async function loadFrozenIncome() {
  frozenLoading.value = true
  try {
    const data = await request.get('/risk/frozen-income', { params: { pageSize: 100 } })
    frozenIncome.value = data.items
  } finally {
    frozenLoading.value = false
  }
}

function handleHandle(row) {
  currentRecord.value = row
  Object.assign(handleForm, { status: 'handled', action: 'none', handleRemark: '' })
  handleDialogVisible.value = true
}

async function submitHandle() {
  try {
    handling.value = true
    await request.post(`/risk/handle/${currentRecord.value.id}`, handleForm)
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    loadRecords()
  } finally {
    handling.value = false
  }
}

function viewDetail(row) {
  ElMessage.info(JSON.stringify(row, null, 2))
}

onMounted(() => {
  loadRecords()
  loadFrozenIncome()
})
</script>
