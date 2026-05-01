<template>
  <div class="orders-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <div class="header-actions">
            <el-select v-model="statusFilter" placeholder="订单状态" clearable style="width: 150px; margin-right: 12px">
              <el-option label="待支付" value="PENDING_PAYMENT" />
              <el-option label="已支付" value="PAID" />
              <el-option label="已发货" value="SHIPPED" />
              <el-option label="已收货" value="DELIVERED" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="已取消" value="CANCELLED" />
            </el-select>
            <el-button type="primary" @click="fetchOrders">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="orders" style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column label="商品信息">
          <template #default="{ row }">
            <div v-for="item in row.items" :key="item.id" class="order-item">
              <span>{{ item.productName }}</span>
              <span class="item-info">x{{ item.quantity }} ¥{{ (item.totalPrice / 100).toFixed(2) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="支付金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ (row.payAmount / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewOrder(row)">查看</el-button>
            <el-button type="primary" link size="small" v-if="row.status === 'PENDING_PAYMENT'" @click="payOrder(row)">
              支付
            </el-button>
            <el-button type="danger" link size="small" v-if="canCancel(row.status)" @click="cancelOrder(row)">
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchOrders"
        @current-change="fetchOrders"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const statusFilter = ref<string>('')
const orders = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    PENDING_PAYMENT: 'warning',
    PAID: 'primary',
    SHIPPED: 'info',
    DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REFUNDED: 'danger',
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    PENDING_PAYMENT: '待支付',
    PAID: '已支付',
    SHIPPED: '已发货',
    DELIVERED: '已收货',
    AFTER_SALE_PERIOD: '售后期',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
  }
  return map[status] || status
}

function canCancel(status: string) {
  return ['PENDING_PAYMENT', 'PAID'].includes(status)
}

async function fetchOrders() {
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    const result = await api.get('/orders', { params })
    if (result.success) {
      orders.value = result.data || []
      total.value = result.total || 0
    }
  } catch (e) {
    console.error('获取订单列表失败', e)
  }
}

function viewOrder(row: any) {
  ElMessage.info(`查看订单: ${row.orderNo}`)
}

async function payOrder(row: any) {
  try {
    const result = await api.post(`/orders/${row.id}/pay`)
    if (result.success) {
      ElMessage.success('支付成功')
      fetchOrders()
    }
  } catch (e) {
    console.error('支付失败', e)
  }
}

async function cancelOrder(row: any) {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const result = await api.post(`/orders/${row.id}/cancel`, { reason: '用户取消' })
    if (result.success) {
      ElMessage.success('订单已取消')
      fetchOrders()
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('取消订单失败', e)
    }
  }
}

watch(statusFilter, () => {
  page.value = 1
  fetchOrders()
})

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.item-info {
  color: #909399;
  font-size: 12px;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}
</style>
