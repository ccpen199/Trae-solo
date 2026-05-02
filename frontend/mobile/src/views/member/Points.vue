<template>
  <div class="member-points">
    <div class="points-header">
      <h3>我的积分</h3>
      <div class="points-balance">
        <div class="balance-value">{{ memberInfo?.pointsBalance || 0 }}</div>
        <div class="balance-label">当前积分</div>
      </div>
    </div>

    <div class="points-rules">
      <h4>积分规则</h4>
      <div class="rules-content">
        <div class="rule-item">
          <span>1. 消费1元获得10积分</span>
        </div>
        <div class="rule-item">
          <span>2. 100积分可抵扣1元</span>
        </div>
        <div class="rule-item">
          <span>3. 积分有效期为1年</span>
        </div>
        <div class="rule-item">
          <span>4. 退货将扣除相应积分</span>
        </div>
      </div>
    </div>

    <div class="points-actions">
      <el-button type="primary" class="action-btn" @click="handleRedeem">
        积分兑换
      </el-button>
      <el-button type="success" class="action-btn" @click="handleTransfer">
        积分转赠
      </el-button>
    </div>

    <div class="points-history">
      <h4>积分明细</h4>
      <div class="history-list">
        <div v-for="(item, index) in pointsHistory" :key="index" class="history-item">
          <div class="history-content">
            <div class="history-title">{{ item.title }}</div>
            <div class="history-time">{{ item.time }}</div>
          </div>
          <div class="history-points" :class="{ 'positive': item.type === 'earn' }">
            {{ item.type === 'earn' ? '+' : '-' }}{{ item.points }}
          </div>
        </div>
        <div v-if="pointsHistory.length === 0" class="empty-history">
          <p>暂无积分记录</p>
        </div>
      </div>
    </div>

    <el-dialog v-model="redeemDialogVisible" title="积分兑换" width="90%">
      <div class="redeem-dialog">
        <div class="dialog-info">
          <span>可用积分:</span>
          <span class="points">{{ memberInfo?.pointsBalance || 0 }}</span>
        </div>
        <el-input-number v-model="pointsToRedeem" :min="100" :max="memberInfo?.pointsBalance || 0" :step="100" label="兑换积分" />
        <div class="dialog-info">
          <span>可抵扣金额:</span>
          <span class="amount">¥{{ (pointsToRedeem / 100).toFixed(2) }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="redeemDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRedeem">确认兑换</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const redeemDialogVisible = ref(false)
const pointsToRedeem = ref(100)
const pointsHistory = ref([])

const memberInfo = computed(() => {
  const member = localStorage.getItem('memberInfo')
  return member ? JSON.parse(member) : null
})

onMounted(() => {
  loadPointsHistory()
})

const loadPointsHistory = () => {
  // 模拟数据
  pointsHistory.value = [
    {
      title: '消费获得积分',
      time: '2024-04-28 10:30',
      points: 150,
      type: 'earn'
    },
    {
      title: '积分兑换',
      time: '2024-04-25 14:20',
      points: 100,
      type: 'spend'
    },
    {
      title: '消费获得积分',
      time: '2024-04-20 09:15',
      points: 80,
      type: 'earn'
    }
  ]
}

const handleRedeem = () => {
  if (!memberInfo.value) {
    ElMessage.warning('请先登录')
    return
  }
  if (memberInfo.value.pointsBalance < 100) {
    ElMessage.warning('积分不足100，无法兑换')
    return
  }
  redeemDialogVisible.value = true
}

const handleTransfer = () => {
  ElMessage.info('积分转赠功能开发中')
}

const confirmRedeem = async () => {
  if (!memberInfo.value) return
  
  try {
    const response = await axios.post('/api/member/points/redeem', {
      memberId: memberInfo.value.id,
      points: pointsToRedeem.value
    })
    if (response.data.success) {
      ElMessage.success('积分兑换成功')
      redeemDialogVisible.value = false
      // 刷新会员信息
      const memberResponse = await axios.get(`/api/member/identify?identifier=${memberInfo.value.phone}`)
      if (memberResponse.data.success) {
        localStorage.setItem('memberInfo', JSON.stringify(memberResponse.data.data))
      }
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    console.error('积分兑换失败:', error)
    ElMessage.error('积分兑换失败，请稍后重试')
  }
}
</script>

<style scoped>
.member-points {
  padding-bottom: 20px;
}

.points-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.points-header h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
}

.points-balance {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.balance-value {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 5px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
}

.points-rules {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.points-rules h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.rule-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.points-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.action-btn {
  height: 44px;
  font-size: 16px;
}

.points-history {
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.points-history h4 {
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

.history-points {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.history-points.positive {
  color: #67c23a;
}

.empty-history {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.redeem-dialog {
  padding: 20px 0;
}

.dialog-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
}

.points {
  font-weight: 600;
  color: #409EFF;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.el-input-number {
  margin: 15px 0;
}
</style>