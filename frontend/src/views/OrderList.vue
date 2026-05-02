<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="primary" @click="goToEntry">
            <el-icon><Plus /></el-icon> 新车牌入场
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="车牌号">
          <el-input v-model="searchForm.plateNumber" placeholder="请输入车牌号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待车位停放" value="pending_parking" />
            <el-option label="待出场计费" value="pending_billing" />
            <el-option label="待支付抬杆" value="pending_payment" />
            <el-option label="待对账" value="pending_reconciliation" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="200" />
        <el-table-column prop="plate_number" label="车牌号" width="120" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ scope.row.statusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parking_space_no" label="车位号" width="100" />
        <el-table-column prop="total_amount" label="金额" width="100">
          <template #default="scope">
            ¥{{ scope.row.total_amount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="entry_time" label="入场时间" width="180" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button type="primary" link @click="viewDetail(scope.row)">查看</el-button>
            <el-button 
              v-if="scope.row.availableActions && scope.row.availableActions.length > 0"
              type="warning" link 
              @click="viewDetail(scope.row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadOrders"
        @current-change="loadOrders"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { orderApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const orders = ref([])

const searchForm = reactive({
  plateNumber: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getStatusTagType = (status) => {
  const map = {
    pending_parking: 'primary',
    pending_billing: 'warning',
    pending_payment: 'danger',
    pending_reconciliation: 'info',
    completed: 'success'
  }
  return map[status] || 'info'
}

const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.plateNumber) {
      params.plateNumber = `%${searchForm.plateNumber}%`
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }
    
    const res = await orderApi.getList(params)
    orders.value = res.data.orders
    pagination.total = res.data.pagination.total
  } catch (error) {
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadOrders()
}

const handleReset = () => {
  searchForm.plateNumber = ''
  searchForm.status = ''
  pagination.page = 1
  loadOrders()
}

const viewDetail = (row) => {
  router.push(`/orders/${row.id}`)
}

const goToEntry = () => {
  router.push('/entry')
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>