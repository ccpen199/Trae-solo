<template>
  <div class="member-records">
    <div class="records-header">
      <h3>消费记录</h3>
      <div class="date-range">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="loadRecords"
        />
      </div>
    </div>

    <div class="records-list">
      <div v-for="record in records" :key="record.transactionNo" class="record-item">
        <div class="record-header">
          <div class="record-time">{{ formatDateTime(record.transactionTime) }}</div>
          <div class="record-status" :class="record.status">
            {{ record.status === 'COMPLETED' ? '交易成功' : '已退款' }}
          </div>
        </div>
        <div class="record-body">
          <div class="record-store">{{ record.storeName || '门店' }}</div>
          <div class="record-amount">
            ¥{{ record.actualAmount?.toFixed(2) }}
          </div>
        </div>
        <div class="record-footer">
          <div class="record-payment">
            支付方式: {{ paymentMethodMap[record.paymentMethod] }}
          </div>
          <el-button type="text" size="small" @click="viewDetails(record)">
            查看详情
          </el-button>
        </div>
      </div>
      <div v-if="records.length === 0" class="empty-records">
        <p>暂无消费记录</p>
      </div>
    </div>

    <el-dialog v-model="detailDialogVisible" title="交易详情" width="90%">
      <div class="record-detail" v-if="currentRecord">
        <div class="detail-item">
          <span>交易号:</span>
          <span>{{ currentRecord.transactionNo }}</span>
        </div>
        <div class="detail-item">
          <span>交易时间:</span>
          <span>{{ formatDateTime(currentRecord.transactionTime) }}</span>
        </div>
        <div class="detail-item">
          <span>门店:</span>
          <span>{{ currentRecord.storeName || '门店' }}</span>
        </div>
        <div class="detail-item">
          <span>总金额:</span>
          <span>¥{{ currentRecord.totalAmount?.toFixed(2) }}</span>
        </div>
        <div class="detail-item" v-if="currentRecord.discountAmount > 0">
          <span>折扣金额:</span>
          <span>-¥{{ currentRecord.discountAmount?.toFixed(2) }}</span>
        </div>
        <div class="detail-item">
          <span>实收金额:</span>
          <span class="actual-amount">¥{{ currentRecord.actualAmount?.toFixed(2) }}</span>
        </div>
        <div class="detail-item">
          <span>支付方式:</span>
          <span>{{ paymentMethodMap[currentRecord.paymentMethod] }}</span>
        </div>
        <div class="detail-item" v-if="currentRecord.pointsEarned">
          <span>获得积分:</span>
          <span>{{ currentRecord.pointsEarned }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const dateRange = ref([])
const records = ref([])
const detailDialogVisible = ref(false)
const currentRecord = ref(null)

const memberInfo = computed(() => {
  const member = localStorage.getItem('memberInfo')
  return member ? JSON.parse(member) : null
})

const paymentMethodMap = {
  CASH: '现金',
  CARD: '银行卡',
  WECHAT: '微信支付',
  ALIPAY: '支付宝'
}

onMounted(() => {
  loadRecords()
})

const loadRecords = async () => {
  if (!memberInfo.value?.id) return
  
  try {
    const response = await axios.get(`/api/member/${memberInfo.value.id}/transactions`)
    if (response.data.success) {
      records.value = response.data.data
    }
  } catch (error) {
    console.error('加载消费记录失败:', error)
    // 加载模拟数据
    loadMockRecords()
  }
}

const loadMockRecords = () => {
  records.value = [
    {
      transactionNo: 'TX202404281030001',
      transactionTime: '2024-04-28 10:30:00',
      storeName: '测试门店',
      totalAmount: 150,
      discountAmount: 15,
      actualAmount: 135,
      paymentMethod: 'WECHAT',
      status: 'COMPLETED',
      pointsEarned: 1350
    },
    {
      transactionNo: 'TX202404251420002',
      transactionTime: '2024-04-25 14:20:00',
      storeName: '测试门店',
      totalAmount: 88,
      discountAmount: 8.8,
      actualAmount: 79.2,
      paymentMethod: 'ALIPAY',
      status: 'COMPLETED',
      pointsEarned: 792
    },
    {
      transactionNo: 'TX202404200915003',
      transactionTime: '2024-04-20 09:15:00',
      storeName: '测试门店',
      totalAmount: 200,
      discountAmount: 20,
      actualAmount: 180,
      paymentMethod: 'CARD',
      status: 'REFUNDED',
      pointsEarned: 1800
    }
  ]
}

const viewDetails = (record) => {
  currentRecord.value = record
  detailDialogVisible.value = true
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.member-records {
  padding-bottom: 20px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.records-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.date-range {
  flex: 1;
  min-width: 200px;
}

.records-list {
  margin-bottom: 20px;
}

.record-item {
  background: white;
  border-radius: 10px;
  margin-bottom: 15px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.record-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-time {
  font-size: 14px;
  color: #666;
}

.record-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.record-status.COMPLETED {
  background: #f0f9eb;
  color: #67c23a;
}

.record-status.REFUNDED {
  background: #fef0f0;
  color: #f56c6c;
}

.record-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.record-store {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.record-amount {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-payment {
  font-size: 12px;
  color: #909399;
}

.empty-records {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.record-detail {
  padding: 10px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.actual-amount {
  font-weight: 600;
  color: #f56c6c;
}
</style>