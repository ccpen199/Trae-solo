<template>
  <div class="orders-page">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>我的订单</span>
          <el-button type="primary" @click="$router.push('/shipper/create-order')">发布新订单</el-button>
        </div>
      </template>
      <el-table :data="orders" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column label="订单类型" width="100">
          <template #default="{ row }">{{ getOrderTypeText(row.order_type) }}</template>
        </el-table-column>
        <el-table-column prop="loading_address" label="装货地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="unloading_address" label="卸货地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="price" label="运费" width="90">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="司机" width="100">
          <template #default="{ row }">{{ row.driver_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <el-descriptions :column="1" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ getOrderTypeText(currentOrder.order_type) }}</el-descriptions-item>
        <el-descriptions-item label="货物信息">{{ currentOrder.cargo_type }} / {{ currentOrder.cargo_weight }}吨 / {{ currentOrder.cargo_volume }}方</el-descriptions-item>
        <el-descriptions-item label="装货地址">{{ currentOrder.loading_address }}</el-descriptions-item>
        <el-descriptions-item label="卸货地址">{{ currentOrder.unloading_address }}</el-descriptions-item>
        <el-descriptions-item label="装卸要求">{{ currentOrder.loading_requirements || '-' }}</el-descriptions-item>
        <el-descriptions-item label="运费">¥{{ currentOrder.price }}（平台费 ¥{{ currentOrder.platform_fee }}，司机收入 ¥{{ currentOrder.driver_income }}）</el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentOrder.driver_name || '待接单' }} / {{ currentOrder.plate_number || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentOrder.status)">{{ getStatusText(currentOrder.status) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { orderAPI } from '@/api'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const orders = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const currentOrder = ref(null)

const loadOrders = async () => {
  loading.value = true
  const res = await orderAPI.list({ shipper_id: user.id })
  if (res.success) {
    orders.value = res.data
  }
  loading.value = false
}

const viewDetail = async (row) => {
  const res = await orderAPI.detail(row.id)
  if (res.success) {
    currentOrder.value = res.data
    detailVisible.value = true
  }
}

const getStatusType = (status) => {
  const types = { pending: 'info', accepted: 'warning', arrived: 'primary', completed: 'success', cancelled: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待接单', accepted: '已接单', arrived: '已到达', completed: '已完成', cancelled: '已取消' }
  return texts[status] || status
}

const getOrderTypeText = (type) => {
  const texts = { instant: '即时单', appointment: '预约单', long_distance: '长途零担' }
  return texts[type] || type
}

onMounted(() => {
  loadOrders()
})
</script>
