<template>
  <div class="orders-page">
    <el-card>
      <template #header>
        <span>订单管理</span>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待查询航班" value="pending_query" />
            <el-option label="待选座选舱" value="pending_select" />
            <el-option label="待支付出票" value="pending_payment" />
            <el-option label="行程通知" value="itinerary_notified" />
            <el-option label="待改签退票" value="pending_rebook_refund" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNumber" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>订单列表</span>
      </template>
      
      <el-table :data="orders" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_number" label="订单号" width="180" />
        <el-table-column prop="passenger_name" label="旅客" width="100" />
        <el-table-column label="订单状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="scope">
            <span class="price">¥{{ scope.row.total_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button type="primary" link @click="handleViewDetail(scope.row)">
              详情
            </el-button>
            <el-button 
              v-if="canProcessOrder(scope.row)"
              type="success" 
              link 
              @click="handleProcess(scope.row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="orders.length === 0 && !loading" description="暂无订单数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import api from '@/api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const orders = ref([])

const searchForm = reactive({
  status: '',
  orderNumber: ''
})

const canProcessOrder = computed(() => userStore.canPerformAction('select_cabin') || userStore.canPerformAction('approve'))

const loadOrders = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.orderNumber) params.orderNumber = searchForm.orderNumber
    
    orders.value = await api.get('/orders', { params })
  } catch (error) {
    console.error('加载订单失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadOrders()
}

const resetSearch = () => {
  searchForm.status = ''
  searchForm.orderNumber = ''
  loadOrders()
}

const handleViewDetail = (order) => {
  router.push(`/orders/${order.id}`)
}

const handleProcess = (order) => {
  router.push(`/orders/${order.id}`)
}

const getStatusType = (status) => {
  const typeMap = {
    pending_query: 'info',
    pending_select: 'warning',
    pending_payment: 'primary',
    itinerary_notified: 'success',
    pending_rebook_refund: 'danger',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusName = (status) => {
  const nameMap = {
    pending_query: '待查询航班',
    pending_select: '待选座选舱',
    pending_payment: '待支付出票',
    itinerary_notified: '行程通知',
    pending_rebook_refund: '待改签退票',
    completed: '已完成',
    cancelled: '已取消'
  }
  return nameMap[status] || status
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}

.price {
  color: #F56C6C;
  font-weight: bold;
}
</style>
