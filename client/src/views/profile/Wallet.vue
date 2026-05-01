<template>
  <div class="wallet-page">
    <el-card>
      <template #header>
        <span>钱包中心</span>
      </template>

      <div class="balance-cards">
        <el-card class="balance-card">
          <div class="balance-label">账户余额</div>
          <div class="balance-amount">¥{{ userStore.user?.wallet?.balance || 0 }}</div>
          <div class="balance-actions">
            <el-button type="primary" @click="showRecharge = true">充值</el-button>
            <el-button @click="showWithdraw = true">提现</el-button>
          </div>
        </el-card>

        <el-card class="balance-card">
          <div class="balance-label">积分余额</div>
          <div class="balance-amount points">{{ userStore.user?.wallet?.points || 0 }}</div>
          <div class="balance-note">积分可用于悬赏和平台服务</div>
        </el-card>

        <el-card class="balance-card">
          <div class="balance-label">待结算</div>
          <div class="balance-amount pending">¥{{ userStore.user?.wallet?.pending || 0 }}</div>
          <div class="balance-note">正在结算中的金额</div>
        </el-card>
      </div>

      <el-divider>交易记录</el-divider>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="收入" name="income" />
        <el-tab-pane label="支出" name="expense" />
        <el-tab-pane label="充值" name="recharge" />
        <el-tab-pane label="提现" name="withdraw" />
      </el-tabs>

      <el-table :data="transactions" v-loading="loading" style="width: 100%">
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="transactionType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTransactionType(row.transactionType)" size="small">
              {{ getTransactionName(row.transactionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span :class="{ positive: row.amount > 0, negative: row.amount < 0 }">
              {{ row.amount > 0 ? '+' : '' }}{{ row.isPoints ? '' : '¥' }}{{ row.amount }}
              {{ row.isPoints ? '积分' : '' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getTransactionStatusType(row.status)" size="small">
              {{ getTransactionStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="balanceAfter" label="余额" width="100">
          <template #default="{ row }">
            {{ row.isPoints ? '' : '¥' }}{{ row.balanceAfter }}{{ row.isPoints ? '积分' : '' }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="transactions.length === 0 && !loading" description="暂无交易记录" />
    </el-card>

    <el-dialog v-model="showRecharge" title="充值" width="400px">
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="金额">
          <el-input-number v-model="rechargeForm.amount" :min="10" :max="10000" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="rechargeForm.paymentMethod" placeholder="选择支付方式">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecharge = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge">确认支付</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showWithdraw" title="提现" width="400px">
      <el-form :model="withdrawForm" label-width="80px">
        <el-form-item label="金额">
          <el-input-number 
            v-model="withdrawForm.amount" 
            :min="10" 
            :max="userStore.user?.wallet?.balance || 0" 
          />
        </el-form-item>
        <el-form-item label="提现到">
          <el-select v-model="withdrawForm.method" placeholder="选择提现方式">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信" value="wechat" />
            <el-option label="银行卡" value="bank" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWithdraw = false">取消</el-button>
        <el-button type="primary" @click="handleWithdraw">确认提现</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('all')
const showRecharge = ref(false)
const showWithdraw = ref(false)
const transactions = ref([])

const rechargeForm = ref({
  amount: 100,
  paymentMethod: 'alipay'
})

const withdrawForm = ref({
  amount: 100,
  method: 'alipay'
})

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getTransactionType = (type) => {
  const typeMap = {
    'recharge': 'success',
    'withdraw': 'warning',
    'reward_paid': 'danger',
    'reward_earned': 'success',
    'platform_fee': 'warning',
    'settlement': 'primary',
    'points_earned': 'success',
    'points_spent': 'warning'
  }
  return typeMap[type] || 'info'
}

const getTransactionName = (type) => {
  const nameMap = {
    'recharge': '充值',
    'withdraw': '提现',
    'reward_paid': '悬赏支付',
    'reward_earned': '赏金收入',
    'platform_fee': '平台服务费',
    'settlement': '结算',
    'points_earned': '积分获得',
    'points_spent': '积分消费'
  }
  return nameMap[type] || type
}

const getTransactionStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'completed': 'success',
    'failed': 'danger',
    'processing': 'primary'
  }
  return typeMap[status] || 'info'
}

const getTransactionStatusName = (status) => {
  const nameMap = {
    'pending': '待处理',
    'completed': '已完成',
    'failed': '失败',
    'processing': '处理中'
  }
  return nameMap[status] || status
}

const loadTransactions = () => {
  loading.value = true
  
  transactions.value = [
    {
      createdAt: new Date(Date.now() - 3600000),
      transactionType: 'reward_earned',
      amount: 95,
      balanceAfter: 95,
      status: 'completed',
      description: '回答被采纳，赏金收入（扣除5%平台服务费）',
      isPoints: false
    },
    {
      createdAt: new Date(Date.now() - 86400000),
      transactionType: 'recharge',
      amount: 100,
      balanceAfter: 100,
      status: 'completed',
      description: '支付宝充值',
      isPoints: false
    },
    {
      createdAt: new Date(Date.now() - 172800000),
      transactionType: 'points_earned',
      amount: 100,
      balanceAfter: 100,
      status: 'completed',
      description: '注册奖励积分',
      isPoints: true
    }
  ]
  
  loading.value = false
}

const handleRecharge = () => {
  ElMessage.success('充值成功')
  showRecharge.value = false
}

const handleWithdraw = () => {
  ElMessage.success('提现申请已提交，预计1-3个工作日到账')
  showWithdraw.value = false
}

onMounted(() => {
  loadTransactions()
})
</script>

<style lang="scss" scoped>
.wallet-page {
  max-width: 1200px;
  margin: 0 auto;
}

.balance-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.balance-card {
  text-align: center;
  
  .balance-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 12px;
  }
  
  .balance-amount {
    font-size: 32px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 16px;
    
    &.points {
      color: #409eff;
    }
    
    &.pending {
      color: #e6a23c;
    }
  }
  
  .balance-note {
    font-size: 12px;
    color: #909399;
  }
  
  .balance-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
}

.positive {
  color: #67c23a;
  font-weight: 500;
}

.negative {
  color: #f56c6c;
  font-weight: 500;
}
</style>
