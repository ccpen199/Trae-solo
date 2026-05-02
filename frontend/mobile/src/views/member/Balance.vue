<template>
  <div class="member-balance">
    <div class="balance-header">
      <h3>我的储值</h3>
      <div class="balance-amount">
        <div class="amount-value">¥{{ memberInfo?.storedBalance?.toFixed(2) || '0.00' }}</div>
        <div class="amount-label">当前余额</div>
      </div>
    </div>

    <div class="recharge-section">
      <h4>充值</h4>
      <div class="recharge-options">
        <div v-for="amount in rechargeAmounts" :key="amount" class="recharge-option" 
             :class="{ active: selectedAmount === amount }"
             @click="selectedAmount = amount">
          <span class="option-amount">¥{{ amount }}</span>
          <span class="option-bonus" v-if="amount >= 500">+¥{{ amount * 0.05 }}</span>
        </div>
      </div>
      <el-button type="primary" class="recharge-btn" @click="handleRecharge">
        立即充值
      </el-button>
    </div>

    <div class="balance-history">
      <h4>储值明细</h4>
      <div class="history-list">
        <div v-for="(item, index) in balanceHistory" :key="index" class="history-item">
          <div class="history-content">
            <div class="history-title">{{ item.title }}</div>
            <div class="history-time">{{ item.time }}</div>
          </div>
          <div class="history-amount" :class="{ 'positive': item.type === 'recharge' }">
            {{ item.type === 'recharge' ? '+' : '-' }}¥{{ item.amount.toFixed(2) }}
          </div>
        </div>
        <div v-if="balanceHistory.length === 0" class="empty-history">
          <p>暂无储值记录</p>
        </div>
      </div>
    </div>

    <el-dialog v-model="rechargeDialogVisible" title="确认充值" width="90%">
      <div class="recharge-dialog">
        <div class="dialog-info">
          <span>充值金额:</span>
          <span class="amount">¥{{ selectedAmount }}</span>
        </div>
        <div class="dialog-info" v-if="selectedAmount >= 500">
          <span>赠送金额:</span>
          <span class="bonus">¥{{ (selectedAmount * 0.05).toFixed(2) }}</span>
        </div>
        <div class="dialog-info">
          <span>实付金额:</span>
          <span class="pay-amount">¥{{ selectedAmount }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rechargeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRecharge">确认支付</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const rechargeDialogVisible = ref(false)
const selectedAmount = ref(100)
const balanceHistory = ref([])

const rechargeAmounts = [100, 200, 300, 500, 1000]

const memberInfo = computed(() => {
  const member = localStorage.getItem('memberInfo')
  return member ? JSON.parse(member) : null
})

onMounted(() => {
  loadBalanceHistory()
})

const loadBalanceHistory = () => {
  // 模拟数据
  balanceHistory.value = [
    {
      title: '储值充值',
      time: '2024-04-25 10:30',
      amount: 500,
      type: 'recharge'
    },
    {
      title: '消费扣款',
      time: '2024-04-20 14:20',
      amount: 88,
      type: 'consume'
    },
    {
      title: '储值充值',
      time: '2024-04-15 09:15',
      amount: 200,
      type: 'recharge'
    }
  ]
}

const handleRecharge = () => {
  if (!memberInfo.value) {
    ElMessage.warning('请先登录')
    return
  }
  rechargeDialogVisible.value = true
}

const confirmRecharge = async () => {
  if (!memberInfo.value) return
  
  try {
    // 这里应该调用充值接口
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
    
    // 模拟刷新余额
    const updatedMember = { ...memberInfo.value }
    updatedMember.storedBalance = updatedMember.storedBalance + selectedAmount + (selectedAmount >= 500 ? selectedAmount * 0.05 : 0)
    localStorage.setItem('memberInfo', JSON.stringify(updatedMember))
  } catch (error) {
    console.error('充值失败:', error)
    ElMessage.error('充值失败，请稍后重试')
  }
}
</script>

<style scoped>
.member-balance {
  padding-bottom: 20px;
}

.balance-header {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.balance-header h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
}

.balance-amount {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amount-value {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 5px;
}

.amount-label {
  font-size: 14px;
  opacity: 0.9;
}

.recharge-section {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recharge-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.recharge-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.recharge-option {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.recharge-option.active {
  border-color: #67c23a;
  background: #f0f9eb;
}

.option-amount {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.option-bonus {
  display: block;
  font-size: 12px;
  color: #67c23a;
}

.recharge-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.balance-history {
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.balance-history h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 3px;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

.history-amount {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.history-amount.positive {
  color: #67c23a;
}

.empty-history {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.recharge-dialog {
  padding: 20px 0;
}

.dialog-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
}

.amount {
  font-weight: 600;
  color: #67c23a;
}

.bonus {
  font-weight: 600;
  color: #409EFF;
}

.pay-amount {
  font-weight: 600;
  color: #f56c6c;
}
</style>