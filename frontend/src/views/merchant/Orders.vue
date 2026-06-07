<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
      <p class="page-subtitle">处理客户订单请求</p>
    </div>

    <el-card class="card-shadow">
      <el-tabs v-model="activeTab" @tab-change="loadOrders">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="待确认" name="pending" />
        <el-tab-pane label="已确认" name="confirmed" />
        <el-tab-pane label="已到店" name="visited" />
        <el-tab-pane label="已交付" name="delivered" />
        <el-tab-pane label="已完成" name="reviewed" />
        <el-tab-pane label="已取消" name="cancelled" />
      </el-tabs>

      <el-table :data="orders" style="width: 100%; margin-top: 20px;">
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="couple_name" label="客户" />
        <el-table-column prop="service_name" label="服务名称" />
        <el-table-column prop="total_amount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="order_date" label="预约日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewOrder(row)">查看</el-button>
            <el-button type="success" size="small" link v-if="row.status === 'pending'" @click="confirmOrder(row)">确认</el-button>
            <el-button type="info" size="small" link v-if="row.status === 'confirmed'" @click="markVisit(row)">标记到店</el-button>
            <el-button type="success" size="small" link v-if="row.status === 'visited'" @click="markDeliver(row)">标记交付</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="orders.length === 0" description="暂无订单" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

const activeTab = ref('')
const orders = ref([])

function getStatusType(status) {
  const types = {
    pending: 'warning',
    confirmed: 'primary',
    visited: 'info',
    delivered: 'success',
    reviewed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '待确认',
    confirmed: '已确认',
    visited: '已到店',
    delivered: '已交付',
    reviewed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

async function loadOrders() {
  try {
    const params = activeTab.value ? { status: activeTab.value } : {}
    const res = await api.get('/orders', { params })
    orders.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function viewOrder(order) {
  ElMessage.info('订单详情功能开发中')
}

async function confirmOrder(order) {
  try {
    await api.put(`/orders/${order.id}/confirm`)
    ElMessage.success('订单已确认')
    loadOrders()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function markVisit(order) {
  try {
    await api.put(`/orders/${order.id}/visit`)
    ElMessage.success('已标记到店')
    loadOrders()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function markDeliver(order) {
  try {
    await api.put(`/orders/${order.id}/deliver`)
    ElMessage.success('已标记交付')
    loadOrders()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadOrders()
})
</script>
