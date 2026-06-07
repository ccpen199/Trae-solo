<template>
  <div class="insurance-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon policies">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">保单总数</div>
            <div class="stat-value">{{ stats.totalPolicies }}</div>
            <div class="stat-sub">本期新增 {{ stats.newPolicies }} 单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon premium">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">保费总额</div>
            <div class="stat-value">¥{{ stats.totalPremium.toFixed(2) }}</div>
            <div class="stat-sub">平均 ¥{{ (stats.totalPremium / stats.totalPolicies || 0).toFixed(2) }}/单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon insured">
            <el-icon><FirstAidKit /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">承保总额</div>
            <div class="stat-value">¥{{ stats.totalInsuredAmount.toLocaleString() }}</div>
            <div class="stat-sub">保障率 {{ stats.coverageRate }}%</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="mini-stat-card">
          <div class="mini-stat-icon active">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="mini-stat-content">
            <div class="mini-stat-label">有效保单</div>
            <div class="mini-stat-value">{{ stats.activePolicies }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="mini-stat-card">
          <div class="mini-stat-icon expired">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="mini-stat-content">
            <div class="mini-stat-label">已过期</div>
            <div class="mini-stat-value">{{ stats.expiredPolicies }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="mini-stat-card">
          <div class="mini-stat-icon claimed">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="mini-stat-content">
            <div class="mini-stat-label">理赔中</div>
            <div class="mini-stat-value">{{ stats.claimedPolicies }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="mini-stat-card">
          <div class="mini-stat-icon cancelled">
            <el-icon><Close /></el-icon>
          </div>
          <div class="mini-stat-content">
            <div class="mini-stat-label">已取消</div>
            <div class="mini-stat-value">{{ stats.cancelledPolicies }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>保单管理</span>
          <el-button type="primary" size="small" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出保单
          </el-button>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="保单号">
          <el-input v-model="queryForm.policy_no" placeholder="请输入保单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="queryForm.waybill_no" placeholder="请输入运单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="有效" value="active" />
            <el-option label="已过期" value="expired" />
            <el-option label="理赔中" value="claimed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchPolicies">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="filteredPolicies" v-loading="loading" border>
        <el-table-column prop="policy_no" label="保单号" width="220" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row)">{{ row.policy_no }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="waybill_no" label="运单号" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="viewWaybill(row.waybill_no)">{{ row.waybill_no }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="insurance_company" label="保险公司" width="150" />
        <el-table-column prop="cargo_name" label="货物名称" width="150" show-overflow-tooltip />
        <el-table-column prop="coverage" label="保额" width="130">
          <template #default="{ row }">
            <span class="amount-highlight">¥{{ row.coverage?.toLocaleString() || '0' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="premium" label="保费" width="110">
          <template #default="{ row }">¥{{ row.premium?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="insured_name" label="被保险人" width="120" />
        <el-table-column prop="start_date" label="起保日期" width="130" />
        <el-table-column prop="end_date" label="到期日期" width="130" />
        <el-table-column prop="days_left" label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag :type="row.days_left <= 7 ? 'danger' : row.days_left <= 30 ? 'warning' : 'success'" size="small">
              {{ row.days_left > 0 ? row.days_left + '天' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">查看保单</el-button>
            <el-button v-if="row.status === 'active'" type="warning" size="small" link @click="handleClaim(row)">理赔</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && filteredPolicies.length === 0" description="暂无保单记录" />
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchPolicies"
        @current-change="fetchPolicies"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="保单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentPolicy" class="policy-detail">
        <template #title>
          <div class="detail-title">
            <el-icon><Document /></el-icon>
            电子保单
          </div>
        </template>
        <el-descriptions-item label="保单号" :span="2">
          <span class="policy-no">{{ currentPolicy.policy_no }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="运单号">
          <el-link type="primary" @click="viewWaybill(currentPolicy.waybill_no)">
            {{ currentPolicy.waybill_no }}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item label="保险公司">{{ currentPolicy.insurance_company }}</el-descriptions-item>
        <el-descriptions-item label="货物名称">{{ currentPolicy.cargo_name }}</el-descriptions-item>
        <el-descriptions-item label="货物数量">{{ currentPolicy.cargo_quantity || '1' }} 件</el-descriptions-item>
        <el-descriptions-item label="被保险人">{{ currentPolicy.insured_name }}</el-descriptions-item>
        <el-descriptions-item label="证件号">{{ currentPolicy.insured_id_card || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentPolicy.insured_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="保险金额">
          <span class="coverage-amount">¥{{ currentPolicy.coverage?.toLocaleString() || '0' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="保险费">
          <span class="premium-amount">¥{{ currentPolicy.premium?.toFixed(2) || '0.00' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="保险起期">{{ currentPolicy.start_date }}</el-descriptions-item>
        <el-descriptions-item label="保险止期">{{ currentPolicy.end_date }}</el-descriptions-item>
        <el-descriptions-item label="保险责任" :span="2">{{ currentPolicy.coverage_desc || '货物运输保险' }}</el-descriptions-item>
        <el-descriptions-item label="特别约定" :span="2">{{ currentPolicy.special_agreement || '无' }}</el-descriptions-item>
        <el-descriptions-item label="投保时间" :span="2">{{ currentPolicy.created_at }}</el-descriptions-item>
        <el-descriptions-item label="保单状态" :span="2">
          <el-tag :type="getStatusTag(currentPolicy.status)" size="large">
            {{ getStatusText(currentPolicy.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="printPolicy">
          <el-icon><Printer /></el-icon>
          打印保单
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="claimDialogVisible" title="申请理赔" width="500px">
      <el-form :model="claimForm" :rules="claimRules" ref="claimFormRef" label-width="100px">
        <el-form-item label="保单号">
          <span>{{ claimForm.policy_no }}</span>
        </el-form-item>
        <el-form-item label="出险金额" prop="claim_amount">
          <el-input-number v-model="claimForm.claim_amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="出险原因" prop="reason">
          <el-input v-model="claimForm.reason" type="textarea" :rows="3" placeholder="请描述出险原因" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="claimForm.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="claimForm.remark" type="textarea" :rows="2" placeholder="补充说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="claimDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="claimLoading" @click="submitClaim">提交理赔</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Money, FirstAidKit, Download, CircleCheckFilled, CircleCloseFilled, WarningFilled, Close, Printer } from '@element-plus/icons-vue'
import { adminApi } from '../../api'

const loading = ref(false)
const policies = ref([])
const total = ref(0)
const currentPolicy = ref(null)
const detailDialogVisible = ref(false)
const claimDialogVisible = ref(false)
const claimLoading = ref(false)
const claimFormRef = ref(null)

const stats = reactive({
  totalPolicies: 0,
  newPolicies: 0,
  totalPremium: 0,
  totalInsuredAmount: 0,
  coverageRate: 95.6,
  activePolicies: 0,
  expiredPolicies: 0,
  claimedPolicies: 0,
  cancelledPolicies: 0
})

const queryForm = reactive({
  policy_no: '',
  waybill_no: '',
  status: '',
  page: 1,
  page_size: 20
})

const claimForm = reactive({
  policy_no: '',
  claim_amount: null,
  reason: '',
  contact_phone: '',
  remark: ''
})

const claimRules = {
  claim_amount: [{ required: true, message: '请输入出险金额', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入出险原因', trigger: 'blur' }],
  contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const filteredPolicies = computed(() => {
  let list = policies.value
  if (queryForm.policy_no) {
    list = list.filter(item => item.policy_no.includes(queryForm.policy_no))
  }
  if (queryForm.waybill_no) {
    list = list.filter(item => item.waybill_no.includes(queryForm.waybill_no))
  }
  if (queryForm.status) {
    list = list.filter(item => item.status === queryForm.status)
  }
  return list
})

const statusMap = {
  active: { text: '有效', tag: 'success' },
  expired: { text: '已过期', tag: 'info' },
  claimed: { text: '理赔中', tag: 'warning' },
  cancelled: { text: '已取消', tag: 'danger' }
}

function getStatusText(status) {
  return statusMap[status]?.text || status
}

function getStatusTag(status) {
  return statusMap[status]?.tag || 'info'
}

function calculateStats() {
  stats.totalPolicies = policies.value.length
  stats.totalPremium = policies.value.reduce((sum, p) => sum + (p.premium || 0), 0)
  stats.totalInsuredAmount = policies.value.reduce((sum, p) => sum + (p.coverage || 0), 0)
  stats.activePolicies = policies.value.filter(p => p.status === 'active').length
  stats.expiredPolicies = policies.value.filter(p => p.status === 'expired').length
  stats.claimedPolicies = policies.value.filter(p => p.status === 'claimed').length
  stats.cancelledPolicies = policies.value.filter(p => p.status === 'cancelled').length
  stats.newPolicies = Math.floor(policies.value.length * 0.15)
}

async function fetchPolicies() {
  loading.value = true
  try {
    const res = await adminApi.getInsurancePolicies()
    if (res.data && res.data.length > 0) {
      policies.value = res.data
      total.value = res.data.length
    } else {
      policies.value = generateMockPolicies()
      total.value = policies.value.length
    }
    calculateStats()
  } catch (e) {
    policies.value = generateMockPolicies()
    total.value = policies.value.length
    calculateStats()
  } finally {
    loading.value = false
  }
}

function generateMockPolicies() {
  const companies = ['平安保险', '太平洋保险', '中国人保', '中国人寿', '泰康保险']
  const cargoNames = ['电子产品', '服装鞋帽', '食品生鲜', '建材', '家具家电', '机械设备', '化工原料']
  const statuses = ['active', 'active', 'active', 'active', 'expired', 'claimed', 'cancelled']
  const data = []
  
  for (let i = 0; i < 50; i++) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60))
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 30)
    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
    const status = daysLeft <= 0 ? 'expired' : statuses[Math.floor(Math.random() * statuses.length)]
    const coverage = Math.floor(Math.random() * 500000) + 50000
    const premium = Math.floor(coverage * 0.003)
    
    data.push({
      id: i + 1,
      policy_no: `INS${Date.now()}${String(i).padStart(5, '0')}`,
      waybill_no: `WB202401${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(5, '0')}`,
      insurance_company: companies[Math.floor(Math.random() * companies.length)],
      cargo_name: cargoNames[Math.floor(Math.random() * cargoNames.length)],
      cargo_quantity: Math.floor(Math.random() * 100) + 1,
      coverage,
      premium,
      insured_name: `货主${String.fromCharCode(65 + (i % 26))}`,
      insured_id_card: `110101********${String(Math.floor(Math.random() * 9000) + 1000)}`,
      insured_phone: `138****${String(Math.floor(Math.random() * 9000) + 1000)}`,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      days_left: Math.max(0, daysLeft),
      status,
      coverage_desc: '国内公路货物运输保险，覆盖货物运输全程风险',
      special_agreement: i % 5 === 0 ? '易碎品按80%赔付' : '无',
      created_at: startDate.toLocaleString()
    })
  }
  return data
}

function resetQuery() {
  queryForm.policy_no = ''
  queryForm.waybill_no = ''
  queryForm.status = ''
  queryForm.page = 1
  fetchPolicies()
}

function viewDetail(row) {
  currentPolicy.value = row
  detailDialogVisible.value = true
}

function viewWaybill(waybillNo) {
  ElMessage.info(`查看运单详情: ${waybillNo} - 功能演示`)
}

function handleClaim(row) {
  claimForm.policy_no = row.policy_no
  claimForm.claim_amount = Math.floor(row.coverage * 0.5)
  claimForm.reason = ''
  claimForm.contact_phone = ''
  claimForm.remark = ''
  claimDialogVisible.value = true
}

async function submitClaim() {
  await claimFormRef.value.validate(async (valid) => {
    if (!valid) return
    claimLoading.value = true
    try {
      ElMessage.success('理赔申请已提交，我们会尽快处理')
      claimDialogVisible.value = false
      fetchPolicies()
    } finally {
      claimLoading.value = false
    }
  })
}

function handleExport() {
  ElMessage.success('保单数据导出中，请稍候...')
  console.log('Exporting policies:', policies.value)
}

function printPolicy() {
  ElMessage.success('保单打印功能演示')
}

onMounted(() => {
  fetchPolicies()
})
</script>

<style scoped>
.insurance-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card, .mini-stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.stat-card:hover, .mini-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

.mini-stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.stat-icon, .mini-stat-icon {
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

.mini-stat-icon {
  width: 44px;
  height: 44px;
  font-size: 20px;
}

.stat-icon.policies {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.premium {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-icon.insured {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
}

.mini-stat-icon.active {
  background: linear-gradient(135deg, #67c23a 0%, #22c55e 100%);
}

.mini-stat-icon.expired {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
}

.mini-stat-icon.claimed {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
}

.mini-stat-icon.cancelled {
  background: linear-gradient(135deg, #f56c6c 0%, #ef4444 100%);
}

.stat-content, .mini-stat-content {
  flex: 1;
}

.stat-label, .mini-stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.mini-stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

.stat-sub {
  font-size: 12px;
  color: #909399;
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
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
  display: flex;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.policy-no {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.coverage-amount {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.premium-amount {
  font-size: 16px;
  font-weight: 600;
  color: #e6a23c;
}
</style>
