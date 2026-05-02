<template>
  <div class="reconciliation-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>对账管理</span>
          <el-button type="primary" @click="showRunDialog">
            执行对账
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="渠道">
          <el-select v-model="searchForm.channel" placeholder="全部渠道" clearable>
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="匹配成功" value="matched" />
            <el-option label="存在差异" value="mismatched" />
            <el-option label="待处理" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReconciliations">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="reconciliations" v-loading="loading" stripe>
        <el-table-column prop="reconciliation_no" label="对账单号" min-width="180">
          <template #default="{ row }">
            <el-text type="primary" size="small" @click="viewDetail(row)" class="link-text">
              {{ row.reconciliation_no }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="渠道" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getChannelLabel(row.channel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reconciliation_date" label="对账日期" width="120" />
        <el-table-column prop="total_system_transactions" label="系统笔数" width="100" />
        <el-table-column prop="total_system_amount" label="系统金额" width="120">
          <template #default="{ row }">¥{{ row.total_system_amount }}</template>
        </el-table-column>
        <el-table-column prop="total_channel_transactions" label="渠道笔数" width="100" />
        <el-table-column prop="total_channel_amount" label="渠道金额" width="120">
          <template #default="{ row }">¥{{ row.total_channel_amount }}</template>
        </el-table-column>
        <el-table-column prop="matched_count" label="匹配" width="80">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.matched_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mismatch_count" label="差异" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.mismatch_count > 0" type="danger" size="small">
              {{ row.mismatch_count }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
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
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadReconciliations"
        @current-change="loadReconciliations"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <el-dialog
      v-model="runDialogVisible"
      title="执行对账"
      width="500px"
    >
      <el-form
        ref="runFormRef"
        :model="runForm"
        :rules="runRules"
        label-width="100px"
      >
        <el-form-item label="渠道" prop="channel">
          <el-select v-model="runForm.channel" placeholder="请选择渠道" style="width: 100%">
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
          </el-select>
        </el-form-item>
        <el-form-item label="对账日期" prop="reconciliation_date">
          <el-date-picker
            v-model="runForm.reconciliation_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="runDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="runLoading" @click="submitRun">
          执行对账
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const runDialogVisible = ref(false)
const runLoading = ref(false)
const runFormRef = ref(null)

const searchForm = reactive({
  channel: '',
  status: ''
})

const runForm = reactive({
  channel: '',
  reconciliation_date: ''
})

const runRules = {
  channel: [
    { required: true, message: '请选择渠道', trigger: 'change' }
  ],
  reconciliation_date: [
    { required: true, message: '请选择对账日期', trigger: 'change' }
  ]
}

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const reconciliations = ref([])

const channelMap = {
  wechat: '微信支付',
  alipay: '支付宝'
}

const statusMap = {
  matched: { label: '匹配成功', type: 'success' },
  mismatched: { label: '存在差异', type: 'danger' },
  pending: { label: '待处理', type: 'warning' }
}

function getChannelLabel(channel) {
  return channelMap[channel] || channel
}

function getStatusLabel(status) {
  return statusMap[status]?.label || status
}

function getStatusType(status) {
  return statusMap[status]?.type || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadReconciliations() {
  loading.value = true
  try {
    const params = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize
    }
    if (searchForm.channel) {
      params.channel = searchForm.channel
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }
    
    const response = await api.get('/v1/finance/reconciliation/list', { params })
    if (response.success) {
      pagination.total = response.data.total
      reconciliations.value = response.data.reconciliations
    }
  } catch (error) {
    console.error('Load reconciliations error:', error)
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.channel = ''
  searchForm.status = ''
  pagination.page = 1
  loadReconciliations()
}

function showRunDialog() {
  runForm.channel = ''
  runForm.reconciliation_date = ''
  runDialogVisible.value = true
}

async function submitRun() {
  if (!runFormRef.value) return
  
  await runFormRef.value.validate(async (valid) => {
    if (valid) {
      runLoading.value = true
      try {
        const response = await api.post('/v1/finance/reconciliation/run', {
          channel: runForm.channel,
          reconciliation_date: runForm.reconciliation_date
        })
        
        if (response.success) {
          ElMessage.success('对账执行成功')
          runDialogVisible.value = false
          loadReconciliations()
        }
      } catch (error) {
        console.error('Run reconciliation error:', error)
      } finally {
        runLoading.value = false
      }
    }
  })
}

function viewDetail(row) {
  router.push({ 
    name: 'FinanceReconciliationDetail', 
    params: { reconciliationNo: row.reconciliation_no } 
  })
}

onMounted(() => {
  loadReconciliations()
})
</script>

<style scoped>
.reconciliation-container {
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
</style>
