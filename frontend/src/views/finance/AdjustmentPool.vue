<template>
  <div class="adjustment-pool-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>调账池</span>
          <el-tag type="danger" size="large">待处理: {{ pendingCount }}</el-tag>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="渠道">
          <el-select v-model="searchForm.channel" placeholder="全部渠道" clearable>
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadItems">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="items" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="reconciliation_no" label="对账单号" min-width="180" />
        <el-table-column prop="order_no" label="订单号" min-width="180">
          <template #default="{ row }">
            <el-text type="primary" size="small">{{ row.order_no }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="渠道" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getChannelLabel(row.channel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="system_amount" label="系统金额" width="120">
          <template #default="{ row }">¥{{ row.system_amount }}</template>
        </el-table-column>
        <el-table-column prop="channel_amount" label="渠道金额" width="120">
          <template #default="{ row }">
            <span v-if="row.channel_amount !== null">¥{{ row.channel_amount }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="difference" label="差异金额" width="120">
          <template #default="{ row }">
            <span v-if="row.difference !== null && row.difference !== 0" class="text-danger">
              ¥{{ row.difference }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="issue_type" label="差异类型" width="120">
          <template #default="{ row }">
            <el-tag type="danger" size="small">
              {{ getMismatchTypeLabel(row.issue_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'resolved' ? 'success' : 'warning'" size="small">
              {{ row.status === 'resolved' ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resolution_remark" label="处理备注" min-width="150">
          <template #default="{ row }">
            <span v-if="row.resolution_remark">{{ row.resolution_remark }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="resolved_at" label="处理时间" width="180">
          <template #default="{ row }">
            <span v-if="row.resolved_at">{{ formatDate(row.resolved_at) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'resolved'"
              type="primary"
              link
              size="small"
              @click="showResolveDialog(row)"
            >
              处理
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="resolveDialogVisible"
      title="处理对账差异"
      width="500px"
    >
      <el-descriptions :column="1" border style="margin-bottom: 20px;">
        <el-descriptions-item label="订单号">{{ currentItem?.order_no }}</el-descriptions-item>
        <el-descriptions-item label="系统金额">¥{{ currentItem?.system_amount }}</el-descriptions-item>
        <el-descriptions-item label="渠道金额">
          <span v-if="currentItem?.channel_amount !== null">¥{{ currentItem?.channel_amount }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="差异类型">
          {{ getMismatchTypeLabel(currentItem?.issue_type) }}
        </el-descriptions-item>
      </el-descriptions>
      <el-form
        ref="resolveFormRef"
        :model="resolveForm"
        :rules="resolveRules"
        label-width="100px"
      >
        <el-form-item label="处理备注" prop="resolution_remark">
          <el-input
            v-model="resolveForm.resolution_remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resolveLoading" @click="submitResolve">
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const loading = ref(false)
const resolveDialogVisible = ref(false)
const resolveLoading = ref(false)
const resolveFormRef = ref(null)

const searchForm = reactive({
  channel: ''
})

const items = ref([])
const currentItem = ref(null)

const resolveForm = reactive({
  resolution_remark: ''
})

const resolveRules = {
  resolution_remark: [
    { required: true, message: '请输入处理备注', trigger: 'blur' }
  ]
}

const pendingCount = computed(() => {
  return items.value.filter(item => item.status !== 'resolved').length
})

const channelMap = {
  wechat: '微信支付',
  alipay: '支付宝'
}

const mismatchTypeMap = {
  amount_mismatch: '金额差异',
  channel_only: '渠道独有',
  system_only: '系统独有',
  order_not_found: '订单不存在',
  transaction_not_found: '交易不存在',
  status_mismatch: '状态差异'
}

function getChannelLabel(channel) {
  return channelMap[channel] || channel
}

function getMismatchTypeLabel(type) {
  return mismatchTypeMap[type] || type
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadItems() {
  loading.value = true
  try {
    const params = {}
    if (searchForm.channel) {
      params.channel = searchForm.channel
    }
    
    const response = await api.get('/v1/finance/adjustment-pool', { params })
    if (response.success) {
      items.value = response.data.items || []
    }
  } catch (error) {
    console.error('Load adjustment pool error:', error)
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.channel = ''
  loadItems()
}

function showResolveDialog(item) {
  currentItem.value = item
  resolveForm.resolution_remark = ''
  resolveDialogVisible.value = true
}

async function submitResolve() {
  if (!resolveFormRef.value || !currentItem.value) return
  
  await resolveFormRef.value.validate(async (valid) => {
    if (valid) {
      resolveLoading.value = true
      try {
        await ElMessageBox.confirm(
          '确认处理此对账差异？',
          '处理确认',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await api.post('/v1/finance/adjustment-pool/resolve', {
          item_id: currentItem.value.id,
          resolution_remark: resolveForm.resolution_remark
        })
        
        if (response.success) {
          ElMessage.success('处理成功')
          resolveDialogVisible.value = false
          loadItems()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Resolve error:', error)
        }
      } finally {
        resolveLoading.value = false
      }
    }
  })
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.adjustment-pool-container {
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

.text-muted {
  color: #909399;
}

.text-danger {
  color: #f56c6c;
}
</style>
