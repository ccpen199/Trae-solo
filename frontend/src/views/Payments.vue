<template>
  <div class="payments-page">
    <el-card>
      <template #header>
        <div class="header-actions">
          <span>收银记录</span>
          <div class="filters">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 280px; margin-right: 10px"
            />
            <el-button type="primary" @click="fetchPayments">查询</el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="今日收入" :value="todayIncome" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日订单数" :value="todayOrders" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="微信支付" :value="wechatAmount" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="支付宝" :value="alipayAmount" prefix="¥" />
        </el-col>
      </el-row>
      
      <el-table :data="payments" v-loading="loading" style="width: 100%">
        <el-table-column prop="paymentNo" label="流水号" width="200" />
        <el-table-column prop="order.orderNo" label="订单号" width="180">
          <template #default="{ row }">
            {{ row.order?.orderNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column prop="discountAmount" label="优惠金额" width="120">
          <template #default="{ row }">¥{{ row.discountAmount || 0 }}</template>
        </el-table-column>
        <el-table-column prop="payAmount" label="实收金额" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ row.payAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payMethod" label="支付方式" width="100">
          <template #default="{ row }">
            <el-tag>{{ getPayMethodLabel(row.payMethod) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="支付时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const payments = ref([])
const dateRange = ref([
  dayjs().startOf('day').toDate(),
  dayjs().endOf('day').toDate()
])

const todayIncome = ref(0)
const todayOrders = ref(0)
const wechatAmount = ref(0)
const alipayAmount = ref(0)

const getPayMethodLabel = (method) => {
  const map = {
    cash: '现金',
    wechat: '微信支付',
    alipay: '支付宝',
    card: '银行卡'
  }
  return map[method] || method
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const fetchPayments = async () => {
  loading.value = true
  try {
    const res = await api.payment.getList()
    payments.value = res.data?.list || res.data || []
    
    const today = dayjs().format('YYYY-MM-DD')
    const todayData = payments.value.filter(p => 
      dayjs(p.createdAt).format('YYYY-MM-DD') === today
    )
    
    todayOrders.value = todayData.length
    todayIncome.value = todayData.reduce((sum, p) => sum + (p.payAmount || 0), 0)
    wechatAmount.value = todayData.filter(p => p.payMethod === 'wechat')
      .reduce((sum, p) => sum + (p.payAmount || 0), 0)
    alipayAmount.value = todayData.filter(p => p.payMethod === 'alipay')
      .reduce((sum, p) => sum + (p.payAmount || 0), 0)
      
  } catch (error) {
    console.error('Fetch payments error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPayments()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  align-items: center;
}
</style>
