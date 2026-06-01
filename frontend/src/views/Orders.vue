<template>
  <div>
    <h2 style="margin-bottom: 20px">订单管理</h2>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>订单列表</span>
          <el-button type="primary" @click="$router.push('/order-create')">新建订单</el-button>
        </div>
      </template>
      <el-table :data="orders" border>
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="customer_name" label="客户" />
        <el-table-column prop="merchant_name" label="商户" />
        <el-table-column prop="type" label="类型">
          <template #default="{ row }">
            <el-tag>{{ row.type === 'spot' ? '现货' : '预订' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" />
        <el-table-column prop="actual_amount" label="实际金额" />
        <el-table-column prop="paid_amount" label="已付金额" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="$router.push('/orders/' + row.id)">详情</el-button>
            <el-button size="small" type="danger" link @click="quickDispute(row)">纠纷</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const orders = ref([])

const getStatusType = (status) => {
  const map = { pending: 'warning', completed: 'success', partial: 'info' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待处理', completed: '已完成', partial: '部分付款' }
  return map[status] || status
}

const quickDispute = (row) => {
  sessionStorage.setItem('quick_dispute_order', JSON.stringify(row))
  window.location.href = '/disputes'
}

onMounted(async () => {
  const res = await axios.get('/api/orders')
  orders.value = res.data
})
</script>
