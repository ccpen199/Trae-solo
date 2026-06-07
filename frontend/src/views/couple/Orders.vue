<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">订单中心</h2>
      <p class="page-subtitle">管理您的婚礼服务订单</p>
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
        <el-table-column prop="service_name" label="服务名称" />
        <el-table-column prop="company_name" label="商家" />
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
            <el-button type="warning" size="small" link v-if="row.status === 'delivered'" @click="showReview = true; currentOrder = row">评价</el-button>
            <el-button type="danger" size="small" link v-if="['pending', 'confirmed'].includes(row.status)" @click="cancelOrder(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="orders.length === 0" description="暂无订单" />
    </el-card>

    <el-dialog v-model="showReview" title="订单评价" width="500px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="reviewForm.rating" />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="reviewForm.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReview = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('')
const orders = ref([])
const showReview = ref(false)
const currentOrder = ref(null)
const reviewForm = reactive({
  rating: 5,
  content: ''
})

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

async function cancelOrder(order) {
  try {
    await ElMessageBox.confirm('确定要取消此订单吗？', '提示', { type: 'warning' })
    await api.put(`/orders/${order.id}/cancel`, { reason: '用户取消' })
    ElMessage.success('订单已取消')
    loadOrders()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

async function submitReview() {
  try {
    await api.put(`/orders/${currentOrder.value.id}/review`, reviewForm)
    ElMessage.success('评价成功')
    showReview.value = false
    loadOrders()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadOrders()
})
</script>
