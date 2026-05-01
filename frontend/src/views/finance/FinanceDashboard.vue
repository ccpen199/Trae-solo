<template>
  <div class="finance-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>提现审核</span>
          <el-button type="primary" @click="fetchPendingWithdraws">刷新</el-button>
        </div>
      </template>

      <el-table :data="pendingWithdraws" style="width: 100%" v-loading="loading">
        <el-table-column prop="withdrawNo" label="提现单号" width="200" />
        <el-table-column label="申请人" width="200">
          <template #default="{ row }">
            <div>{{ row.user?.nickname || '未知' }}</div>
            <div class="sub-text">{{ row.user?.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="提现金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ (row.amount / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实发金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ (row.actualAmount / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收款信息">
          <template #default="{ row }">
            <div v-if="row.alipayAccount">
              <el-tag size="small">支付宝</el-tag>
              {{ row.alipayAccount }}
            </div>
            <div v-else-if="row.bankAccount">
              <el-tag size="small" type="warning">银行卡</el-tag>
              {{ row.bankName }} - {{ row.bankAccount }}
              <div class="sub-text">{{ row.bankAccountName }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="approveWithdraw(row)">通过</el-button>
            <el-button type="danger" size="small" @click="rejectWithdraw(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && pendingWithdraws.length === 0" description="暂无待审核提现" />
    </el-card>

    <el-dialog v-model="showRejectDialog" title="拒绝原因" width="400px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因"
      />
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const loading = ref(false)
const pendingWithdraws = ref<any[]>([])
const showRejectDialog = ref(false)
const rejectReason = ref('')
const currentWithdraw = ref<any>(null)

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

async function fetchPendingWithdraws() {
  loading.value = true
  try {
    const result = await api.get('/withdraws/pending')
    if (result.success) {
      pendingWithdraws.value = result.data || []
    }
  } catch (e) {
    console.error('获取待审核提现失败', e)
  } finally {
    loading.value = false
  }
}

async function approveWithdraw(row: any) {
  try {
    await ElMessageBox.confirm('确定通过该提现申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const result = await api.post(`/withdraws/${row.id}/review`, {
      approved: true,
    })
    if (result.success) {
      ElMessage.success('审核通过')
      fetchPendingWithdraws()
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('审核失败', e)
    }
  }
}

function rejectWithdraw(row: any) {
  currentWithdraw.value = row
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    const result = await api.post(`/withdraws/${currentWithdraw.value.id}/review`, {
      approved: false,
      remark: rejectReason.value,
    })
    if (result.success) {
      ElMessage.success('已拒绝')
      showRejectDialog.value = false
      fetchPendingWithdraws()
    }
  } catch (e) {
    console.error('拒绝失败', e)
  }
}

onMounted(() => {
  fetchPendingWithdraws()
})
</script>

<style scoped>
.finance-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-text {
  font-size: 12px;
  color: #909399;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}
</style>
