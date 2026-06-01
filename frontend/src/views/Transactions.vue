<template>
  <div>
    <h2 style="margin-bottom: 20px">交易台账</h2>
    <el-card>
      <template #header>交易流水记录</template>
      <el-table :data="logs" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="交易类型">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_id" label="订单ID" width="100" />
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">
            <span :style="{ color: row.amount >= 0 ? '#67c23a' : '#f56c6c' }">
              {{ row.amount >= 0 ? '+' : '' }}{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const logs = ref([])

const getTypeText = (type) => {
  const map = { 
    order_create: '创建订单', 
    payment: '支付', 
    refund: '退款',
    settle: '结算',
    debt: '挂账',
    credit_repay: '还款'
  }
  return map[type] || type
}

const getTypeColor = (type) => {
  const map = { 
    order_create: '', 
    payment: 'success', 
    refund: 'danger',
    settle: 'primary',
    debt: 'warning',
    credit_repay: 'success'
  }
  return map[type] || ''
}

onMounted(async () => {
  const res = await axios.get('/api/transaction-logs')
  logs.value = res.data
})
</script>
