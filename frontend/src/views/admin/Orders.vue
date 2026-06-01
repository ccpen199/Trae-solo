<template>
  <div class="admin-orders">
    <el-card>
      <template #header>
        <span>订单管理</span>
      </template>
      <el-table :data="orders" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="shipper_name" label="货主" width="100" />
        <el-table-column prop="driver_name" label="司机" width="100" />
        <el-table-column prop="loading_address" label="装货地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="unloading_address" label="卸货地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="price" label="运费" width="90">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orderAPI } from '@/api'

const orders = ref([])
const loading = ref(false)

const loadOrders = async () => {
  loading.value = true
  const res = await orderAPI.list({})
  if (res.success) {
    orders.value = res.data
  }
  loading.value = false
}

const getStatusType = (status) => {
  const types = { pending: 'info', accepted: 'warning', arrived: 'primary', completed: 'success', cancelled: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待接单', accepted: '已接单', arrived: '已到达', completed: '已完成', cancelled: '已取消' }
  return texts[status] || status
}

onMounted(() => {
  loadOrders()
})
</script>
