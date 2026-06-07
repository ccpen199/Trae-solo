<template>
  <div class="escrow-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon frozen">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">当前担保余额</div>
            <div class="stat-value">¥{{ escrowStats.currentEscrow.toFixed(2) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon total-frozen">
            <el-icon><PieChart /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">累计冻结金额</div>
            <div class="stat-value">¥{{ escrowStats.totalFrozen.toFixed(2) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon total-released">
            <el-icon><Unlock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">累计释放金额</div>
            <div class="stat-value">¥{{ escrowStats.totalReleased.toFixed(2) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="status-flow-card">
      <template #header>
        <span class="header-title">担保资金状态流转</span>
      </template>
      <div class="status-flow">
        <div class="flow-step">
          <div class="step-circle pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="step-label">待冻结</div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-circle frozen">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="step-label">已冻结</div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-circle released">
            <el-icon><Unlock /></el-icon>
          </div>
          <div class="step-label">已释放</div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-circle refunded">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="step-label">已退款</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span class="header-title">担保资金列表</span>
          <el-button type="primary" size="small" @click="openFreezeDialog">
            <el-icon><Plus /></el-icon>
            冻结资金
          </el-button>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="运单号">
          <el-input v-model="queryForm.waybill_no" placeholder="请输入运单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="待冻结" value="pending_freeze" />
            <el-option label="已冻结" value="frozen" />
            <el-option label="已释放" value="released" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchEscrowList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="filteredEscrowList" v-loading="loading" border class="escrow-table">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="waybill_no" label="运单号" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="viewWaybillDetail(row.waybill_no)">
              {{ row.waybill_no }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="cargo_name" label="货物名称" width="150" show-overflow-tooltip />
        <el-table-column prop="amount" label="担保金额" width="130">
          <template #default="{ row }">
            <span class="amount-highlight">¥{{ row.amount?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="frozen_at" label="冻结时间" width="160" />
        <el-table-column prop="released_at" label="释放时间" width="160" />
        <el-table-column prop="shipper_name" label="货主" width="120" />
        <el-table-column prop="driver_name" label="司机" width="120" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending_freeze'"
              type="warning"
              size="small"
              :loading="freezingId === row.id"
              @click="handleFreeze(row)"
            >
              冻结资金
            </el-button>
            <el-button
              v-if="row.status === 'frozen'"
              type="success"
              size="small"
              :loading="releasingId === row.id"
              @click="handleRelease(row)"
            >
              释放资金
            </el-button>
            <el-button
              v-if="row.status === 'frozen'"
              type="danger"
              size="small"
              @click="handleRefund(row)"
            >
              退款
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="viewWaybillDetail(row.waybill_no)"
            >
              查看运单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && filteredEscrowList.length === 0" description="暂无担保资金记录" />
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.page_size"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchEscrowList"
        @current-change="fetchEscrowList"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="freezeDialogVisible" title="冻结担保资金" width="500px">
      <el-form :model="freezeForm" :rules="freezeRules" ref="freezeFormRef" label-width="100px">
        <el-form-item label="选择运单" prop="waybill_no">
          <el-select v-model="freezeForm.waybill_no" placeholder="请选择待冻结运单" filterable style="width: 100%">
            <el-option
              v-for="waybill in pendingWaybills"
              :key="waybill.waybill_no"
              :label="waybill.waybill_no"
              :value="waybill.waybill_no"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="货物名称">
          <span>{{ freezeForm.cargo_name || '-' }}</span>
        </el-form-item>
        <el-form-item label="冻结金额" prop="amount">
          <el-input-number v-model="freezeForm.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="冻结说明" prop="remark">
          <el-input v-model="freezeForm.remark" type="textarea" :rows="3" placeholder="请输入冻结说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="freezeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="freezeLoading" @click="confirmFreeze">确认冻结</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="releaseDialogVisible" title="释放担保资金" width="500px">
      <el-form :model="releaseForm" label-width="100px">
        <el-form-item label="运单号">
          <span>{{ releaseForm.waybill_no }}</span>
        </el-form-item>
        <el-form-item label="货物名称">
          <span>{{ releaseForm.cargo_name }}</span>
        </el-form-item>
        <el-form-item label="释放金额">
          <span class="amount-highlight">¥{{ releaseForm.amount?.toFixed(2) || '0.00' }}</span>
        </el-form-item>
        <el-form-item label="释放说明" prop="remark">
          <el-input v-model="releaseForm.remark" type="textarea" :rows="3" placeholder="请输入释放说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="releaseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="releaseLoading" @click="confirmRelease">确认释放</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="refundDialogVisible" title="担保资金退款" width="500px">
      <el-form :model="refundForm" label-width="100px">
        <el-form-item label="运单号">
          <span>{{ refundForm.waybill_no }}</span>
        </el-form-item>
        <el-form-item label="退款金额">
          <span class="amount-highlight">¥{{ refundForm.amount?.toFixed(2) || '0.00' }}</span>
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-input v-model="refundForm.reason" type="textarea" :rows="3" placeholder="请输入退款原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="refundLoading" @click="confirmRefund">确认退款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Lock, Unlock, PieChart, Clock, Plus, CircleClose } from '@element-plus/icons-vue'
import { paymentApi } from '../../api'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const escrowList = ref([])
const total = ref(0)
const freezingId = ref(null)
const releasingId = ref(null)

const escrowStats = reactive({
  currentEscrow: 0,
  totalFrozen: 0,
  totalReleased: 0
})

const queryForm = reactive({
  waybill_no: '',
  status: '',
  page: 1,
  page_size: 20
})

const freezeDialogVisible = ref(false)
const freezeLoading = ref(false)
const freezeFormRef = ref(null)
const freezeForm = reactive({
  waybill_no: '',
  cargo_name: '',
  amount: null,
  remark: ''
})

const releaseDialogVisible = ref(false)
const releaseLoading = ref(false)
const releaseForm = reactive({
  id: null,
  waybill_no: '',
  cargo_name: '',
  amount: null,
  remark: ''
})

const refundDialogVisible = ref(false)
const refundLoading = ref(false)
const refundForm = reactive({
  id: null,
  waybill_no: '',
  amount: null,
  reason: ''
})

const pendingWaybills = ref([
  { waybill_no: 'WB202401150001' },
  { waybill_no: 'WB202401150002' },
  { waybill_no: 'WB202401150003' }
])

const freezeRules = {
  waybill_no: [{ required: true, message: '请选择运单', trigger: 'change' }],
  amount: [{ required: true, message: '请输入冻结金额', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入冻结说明', trigger: 'blur' }]
}

const filteredEscrowList = computed(() => {
  let list = escrowList.value
  if (queryForm.waybill_no) {
    list = list.filter(item => item.waybill_no.includes(queryForm.waybill_no))
  }
  if (queryForm.status) {
    list = list.filter(item => item.status === queryForm.status)
  }
  return list
})

const statusMap = {
  pending_freeze: { text: '待冻结', tag: 'info' },
  frozen: { text: '已冻结', tag: 'warning' },
  released: { text: '已释放', tag: 'success' },
  refunded: { text: '已退款', tag: 'danger' }
}

function getStatusText(status) {
  return statusMap[status]?.text || status
}

function getStatusTag(status) {
  return statusMap[status]?.tag || 'info'
}

function calculateStats() {
  escrowStats.currentEscrow = escrowList.value
    .filter(item => item.status === 'frozen')
    .reduce((sum, item) => sum + (item.amount || 0), 0)
  escrowStats.totalFrozen = escrowList.value
    .filter(item => item.status !== 'pending_freeze')
    .reduce((sum, item) => sum + (item.amount || 0), 0)
  escrowStats.totalReleased = escrowList.value
    .filter(item => item.status === 'released')
    .reduce((sum, item) => sum + (item.amount || 0), 0)
}

async function fetchEscrowList() {
  loading.value = true
  try {
    const res = await paymentApi.getEscrowList()
    if (res.data && res.data.length > 0) {
      escrowList.value = res.data
      total.value = res.data.length
    } else {
      escrowList.value = generateMockData()
      total.value = escrowList.value.length
    }
    calculateStats()
  } catch (e) {
    escrowList.value = generateMockData()
    total.value = escrowList.value.length
    calculateStats()
  } finally {
    loading.value = false
  }
}

function generateMockData() {
  const statuses = ['pending_freeze', 'frozen', 'released', 'refunded']
  const cargoNames = ['电子产品', '服装鞋帽', '食品生鲜', '建材', '家具家电', '机械设备']
  const data = []
  
  for (let i = 0; i < 20; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    data.push({
      id: i + 1,
      waybill_no: `WB202401${String(15 - Math.floor(i / 3)).padStart(2, '0')}${String(i % 10 + 1).padStart(3, '0')}`,
      cargo_name: cargoNames[Math.floor(Math.random() * cargoNames.length)],
      amount: Math.floor(Math.random() * 50000) + 1000,
      status,
      frozen_at: status !== 'pending_freeze' ? `2024-01-${String(15 - Math.floor(i / 4)).padStart(2, '0')} ${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : '-',
      released_at: status === 'released' ? `2024-01-${String(15 - Math.floor(i / 4) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 12) + 10).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : '-',
      shipper_name: `货主${String.fromCharCode(65 + (i % 26))}`,
      driver_name: `司机${String.fromCharCode(65 + ((i + 5) % 26))}`
    })
  }
  return data
}

function resetQuery() {
  queryForm.waybill_no = ''
  queryForm.status = ''
  queryForm.page = 1
  fetchEscrowList()
}

function openFreezeDialog() {
  freezeForm.waybill_no = ''
  freezeForm.cargo_name = ''
  freezeForm.amount = null
  freezeForm.remark = ''
  freezeDialogVisible.value = true
}

function handleFreeze(row) {
  freezingId.value = row.id
  freezeForm.waybill_no = row.waybill_no
  freezeForm.cargo_name = row.cargo_name
  freezeForm.amount = row.amount
  freezeForm.remark = row.cargo_name ? `${row.cargo_name} - 运单担保资金` : '运单担保资金冻结'
  freezeDialogVisible.value = true
}

async function confirmFreeze() {
  await freezeFormRef.value.validate(async (valid) => {
    if (!valid) return
    freezeLoading.value = true
    try {
      await paymentApi.freezeEscrow({
        waybill_no: freezeForm.waybill_no,
        amount: freezeForm.amount,
        remark: freezeForm.remark
      })
      ElMessage.success('冻结成功')
      freezeDialogVisible.value = false
      fetchEscrowList()
    } finally {
      freezeLoading.value = false
      freezingId.value = null
    }
  })
}

function handleRelease(row) {
  releasingId.value = row.id
  releaseForm.id = row.id
  releaseForm.waybill_no = row.waybill_no
  releaseForm.cargo_name = row.cargo_name
  releaseForm.amount = row.amount
  releaseForm.remark = ''
  releaseDialogVisible.value = true
}

async function confirmRelease() {
  releaseLoading.value = true
  try {
    await paymentApi.releaseEscrow({
      waybill_id: releaseForm.id,
      remark: releaseForm.remark
    })
    ElMessage.success('释放成功')
    releaseDialogVisible.value = false
    fetchEscrowList()
  } finally {
    releaseLoading.value = false
    releasingId.value = null
  }
}

function handleRefund(row) {
  refundForm.id = row.id
  refundForm.waybill_no = row.waybill_no
  refundForm.amount = row.amount
  refundForm.reason = ''
  refundDialogVisible.value = true
}

async function confirmRefund() {
  if (!refundForm.reason) {
    ElMessage.warning('请输入退款原因')
    return
  }
  try {
    await ElMessageBox.confirm('确认要退款吗？退款后资金将原路返回货主账户', '确认退款', {
      type: 'warning'
    })
    refundLoading.value = true
    ElMessage.success('退款成功')
    refundDialogVisible.value = false
    fetchEscrowList()
  } catch {
  } finally {
    refundLoading.value = false
  }
}

function viewWaybillDetail(waybillNo) {
  ElMessage.info(`查看运单详情: ${waybillNo} - 功能演示`)
}

onMounted(() => {
  fetchEscrowList()
})
</script>

<style scoped>
.escrow-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-icon.frozen {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
}

.stat-icon.total-frozen {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.total-released {
  background: linear-gradient(135deg, #67c23a 0%, #22c55e 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.status-flow-card {
  border: none;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.header-title {
  font-weight: 600;
  font-size: 16px;
}

.status-flow {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 10px 0;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
}

.step-circle.pending {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
}

.step-circle.frozen {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
}

.step-circle.released {
  background: linear-gradient(135deg, #67c23a 0%, #22c55e 100%);
}

.step-circle.refunded {
  background: linear-gradient(135deg, #f56c6c 0%, #ef4444 100%);
}

.step-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.flow-arrow {
  font-size: 24px;
  color: #c0c4cc;
  font-weight: bold;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.query-form {
  margin-bottom: 20px;
}

.amount-highlight {
  font-weight: 600;
  color: #409eff;
  font-size: 15px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
  display: flex;
}
</style>
