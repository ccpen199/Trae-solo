<template>
  <div class="order-list">
    <div class="page-header">
      <h1>订单管理</h1>
    </div>

    <el-table :data="orders" border>
      <el-table-column prop="orderNumber" label="订单编号" />
      <el-table-column prop="title" label="订单名称" />
      <el-table-column prop="customerName" label="客户名称" />
      <el-table-column prop="totalAmount" label="金额">
        <template #default="scope">
          ¥{{ scope.row.totalAmount?.toLocaleString() || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="goToDetail(scope.row.id)">查看</el-button>
          <el-button size="small" type="success" @click="signContract(scope.row.id)" v-if="scope.row.status === 'PENDING'">签约</el-button>
          <el-button size="small" type="primary" @click="payment(scope.row.id)" v-if="scope.row.status === 'CONTRACT_SIGNED'">支付</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi } from '../api'

const router = useRouter()
const orders = ref([])

onMounted(async () => {
  await loadOrders()
})

const loadOrders = async () => {
  try {
    const res = await orderApi.list()
    orders.value = res.data.data?.orders || res.data.orders || []
  } catch (error) {
    console.error('加载订单列表失败:', error)
  }
}

const goToDetail = (id: string) => {
  router.push(`/orders/${id}`)
}

const signContract = async (id: string) => {
  try {
    await orderApi.signContract(id, { contractData: { terms: '标准合同条款' } })
    await loadOrders()
    alert('签约成功')
  } catch (error) {
    console.error('签约失败:', error)
    alert('签约失败')
  }
}

const payment = async (id: string) => {
  try {
    const order = orders.value.find(o => o.id === id)
    await orderApi.payment(id, {
      amount: order?.totalAmount || 0,
      paymentMethod: '银行转账',
      transactionId: 'TXN' + Date.now()
    })
    await loadOrders()
    alert('支付成功')
  } catch (error) {
    console.error('支付失败:', error)
    alert('支付失败')
  }
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'PENDING': 'warning',
    'CONTRACT_SIGNED': 'info',
    'PAID': 'success',
    'PRODUCTION_SCHEDULED': 'info',
    'PRODUCTION_IN_PROGRESS': 'warning',
    'PRODUCTION_COMPLETED': 'success',
    'INSTALLATION_ASSIGNED': 'info',
    'INSTALLATION_SCHEDULED': 'info',
    'INSTALLATION_IN_PROGRESS': 'warning',
    'INSTALLATION_COMPLETED': 'success',
    'ACCEPTED': 'success'
  }
  return types[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PENDING': '待处理',
    'CONTRACT_SIGNED': '已签约',
    'PAID': '已支付',
    'PRODUCTION_SCHEDULED': '生产已安排',
    'PRODUCTION_IN_PROGRESS': '生产中',
    'PRODUCTION_COMPLETED': '生产完成',
    'INSTALLATION_ASSIGNED': '安装已分配',
    'INSTALLATION_SCHEDULED': '安装已安排',
    'INSTALLATION_IN_PROGRESS': '安装中',
    'INSTALLATION_COMPLETED': '安装完成',
    'ACCEPTED': '已验收'
  }
  return texts[status] || status
}
</script>

<style scoped>
.order-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
}
</style>