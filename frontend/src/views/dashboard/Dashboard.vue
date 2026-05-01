<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-balance">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(stats.availableBalance) }}</div>
              <div class="stat-label">可提现余额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-frozen">
              <el-icon><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(stats.frozenBalance) }}</div>
              <div class="stat-label">冻结中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-earnings">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(stats.totalEarnings) }}</div>
              <div class="stat-label">累计收益</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-withdraw">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(stats.totalWithdrawn) }}</div>
              <div class="stat-label">累计提现</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" link @click="goOrders">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" style="width: 100%">
            <el-table-column prop="orderNo" label="订单号" width="200" />
            <el-table-column prop="totalAmount" label="订单金额" width="120">
              <template #default="{ row }">
                {{ formatAmount(row.totalAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的推广</span>
            </div>
          </template>
          <div class="promo-info" v-if="userStore.user?.referralCode">
            <div class="promo-label">我的推荐码</div>
            <div class="promo-code">{{ userStore.user.referralCode }}</div>
            <el-button type="primary" size="small" @click="copyReferralCode">复制推荐码</el-button>
          </div>
          <el-divider />
          <div class="quick-actions">
            <el-button type="primary" class="action-btn" @click="showWithdrawDialog = true">
              <el-icon><Money /></el-icon>
              发起提现
            </el-button>
            <el-button class="action-btn" @click="goMaterials">
              <el-icon><Picture /></el-icon>
              推广素材
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showWithdrawDialog" title="发起提现" width="400px">
      <el-form :model="withdrawForm" label-width="100px">
        <el-form-item label="提现金额">
          <el-input-number
            v-model="withdrawForm.amount"
            :precision="2"
            :min="1"
            :max="stats.availableBalance / 100"
            :controls="false"
            style="width: 100%"
          />
          <div class="tip-text">可提现余额：{{ formatAmount(stats.availableBalance) }}</div>
        </el-form-item>
        <el-form-item label="提现方式">
          <el-select v-model="withdrawForm.method" style="width: 100%">
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="bank" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款账号" v-if="withdrawForm.method === 'alipay'">
          <el-input v-model="withdrawForm.alipayAccount" placeholder="请输入支付宝账号" />
        </el-form-item>
        <template v-if="withdrawForm.method === 'bank'">
          <el-form-item label="开户银行">
            <el-input v-model="withdrawForm.bankName" placeholder="请输入开户银行" />
          </el-form-item>
          <el-form-item label="银行卡号">
            <el-input v-model="withdrawForm.bankAccount" placeholder="请输入银行卡号" />
          </el-form-item>
          <el-form-item label="开户人姓名">
            <el-input v-model="withdrawForm.bankAccountName" placeholder="请输入开户人姓名" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showWithdrawDialog = false">取消</el-button>
        <el-button type="primary" :loading="withdrawLoading" @click="handleWithdraw">确认提现</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'
import {
  Wallet,
  Lock,
  TrendCharts,
  Money,
  Picture,
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({
  availableBalance: 0,
  frozenBalance: 0,
  totalEarnings: 0,
  totalWithdrawn: 0,
})

const recentOrders = ref<any[]>([])
const showWithdrawDialog = ref(false)
const withdrawLoading = ref(false)

const withdrawForm = reactive({
  amount: 0,
  method: 'alipay',
  alipayAccount: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
})

function formatAmount(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`
}

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    PENDING_PAYMENT: 'warning',
    PAID: 'primary',
    SHIPPED: 'info',
    DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REFUNDED: 'danger',
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    PENDING_PAYMENT: '待支付',
    PAID: '已支付',
    SHIPPED: '已发货',
    DELIVERED: '已收货',
    AFTER_SALE_PERIOD: '售后期',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
  }
  return map[status] || status
}

async function fetchStats() {
  try {
    const result = await api.get('/commissions/stats')
    if (result.success) {
      stats.value = result.data
    }
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
}

async function fetchRecentOrders() {
  try {
    const result = await api.get('/orders')
    if (result.success) {
      recentOrders.value = result.data.slice(0, 5)
    }
  } catch (e) {
    console.error('获取订单失败', e)
  }
}

function copyReferralCode() {
  if (userStore.user?.referralCode) {
    navigator.clipboard.writeText(userStore.user.referralCode)
    ElMessage.success('推荐码已复制')
  }
}

async function handleWithdraw() {
  if (withdrawForm.amount <= 0) {
    ElMessage.warning('请输入提现金额')
    return
  }

  const params: any = {
    amount: Math.floor(withdrawForm.amount * 100),
    withdrawMethod: withdrawForm.method,
  }

  if (withdrawForm.method === 'alipay') {
    if (!withdrawForm.alipayAccount) {
      ElMessage.warning('请输入支付宝账号')
      return
    }
    params.alipayInfo = { account: withdrawForm.alipayAccount }
  } else {
    if (!withdrawForm.bankName || !withdrawForm.bankAccount || !withdrawForm.bankAccountName) {
      ElMessage.warning('请填写完整的银行卡信息')
      return
    }
    params.bankInfo = {
      bankName: withdrawForm.bankName,
      bankAccount: withdrawForm.bankAccount,
      bankAccountName: withdrawForm.bankAccountName,
    }
  }

  withdrawLoading.value = true
  try {
    const result = await api.post('/withdraws', params)
    if (result.success) {
      ElMessage.success(result.message || '提现申请提交成功')
      showWithdrawDialog.value = false
      fetchStats()
    }
  } catch (e) {
    console.error('提现失败', e)
  } finally {
    withdrawLoading.value = false
  }
}

function goOrders() {
  router.push('/dashboard/orders')
}

function goMaterials() {
  router.push('/dashboard/materials')
}

onMounted(() => {
  userStore.fetchProfile()
  fetchStats()
  fetchRecentOrders()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.icon-balance {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-frozen {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-earnings {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.icon-withdraw {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  margin-left: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.promo-info {
  text-align: center;
}

.promo-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.promo-code {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
  letter-spacing: 4px;
  margin-bottom: 12px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 44px;
}

.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
