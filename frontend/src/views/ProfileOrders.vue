<template>
  <div class="profile-orders-page">
    <div class="page-header">
      <h2 class="page-title">订单记录</h2>
      <div class="header-actions">
        <el-button @click="loadOrders">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" @tab-change="loadOrders">
      <el-tab-pane label="全部订单" name="all" />
      <el-tab-pane label="待支付" name="pending" />
      <el-tab-pane label="已支付" name="paid" />
      <el-tab-pane label="已完成" name="completed" />
    </el-tabs>
    
    <el-card class="table-card" v-loading="loading">
      <el-table :data="orders" stripe>
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="product_name" label="商品" />
        <el-table-column prop="merchant_name" label="商户" width="150" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <div>
              <span class="price">¥{{ row.total_amount.toFixed(2) }}</span>
              <div v-if="row.coupon_code" class="coupon-info">
                <el-tag type="success" size="small">优惠券 -¥{{ row.coupon_value }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="关联访客" width="180">
          <template #default="{ row }">
            <div v-if="row.visitor_name">
              <div>{{ row.visitor_name }}</div>
              <div style="font-size: 12px; color: #909399;">授权码：{{ row.auth_code }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.pay_status === 'paid' ? 'success' : 'warning'" size="small">
              {{ row.pay_status === 'paid' ? '已支付' : '待支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" size="small" type="primary" link @click="handlePay(row)">
              去支付
            </el-button>
            <el-button v-else size="small" link @click="viewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && orders.length === 0" description="暂无订单记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { getOrders, payOrder } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const loading = ref(false)
const orders = ref([])
const activeTab = ref('all')

function statusType(status) {
  const map = {
    pending: 'warning',
    paid: 'success',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

function statusText(status) {
  const map = {
    pending: '待支付',
    paid: '已支付',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

async function loadOrders() {
  loading.value = true
  try {
    const params = { user_id: userStore.userId }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }
    const res = await getOrders(params)
    orders.value = res.data
  } finally {
    loading.value = false
  }
}

async function handlePay(row) {
  try {
    await ElMessageBox.confirm(
      `确认支付订单【${row.product_name}】¥${row.total_amount.toFixed(2)}？`,
      '确认支付',
      { confirmButtonText: '确认支付', cancelButtonText: '取消', type: 'info' }
    )
    await payOrder(row.id)
    ElMessage.success('支付成功')
    loadOrders()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '支付失败')
    }
  }
}

function viewDetail(row) {
  ElMessage.info('订单详情功能开发中')
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.profile-orders-page {
  padding: 0;
}

.table-card {
  border: none;
  border-radius: 12px;
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.coupon-info {
  margin-top: 5px;
}
</style>
