<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>排班列表</span>
          <el-button type="primary" @click="goToCreate">
            <el-icon><Plus /></el-icon>
            新建排班
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="草稿" value="draft" />
            <el-option label="待排班" value="pending_schedule" />
            <el-option label="已排班" value="scheduled" />
            <el-option label="车辆运行中" value="vehicle_running" />
            <el-option label="待到站预测" value="pending_arrival_prediction" />
            <el-option label="待异常处理" value="pending_exception" />
            <el-option label="待运营统计" value="pending_statistics" />
            <el-option label="已完成" value="completed" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orderList" v-loading="loading" style="width: 100%">
        <el-table-column prop="main_order_no" label="主单号" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="goToDetail(row.main_order_no)">{{ row.main_order_no }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="route_name" label="线路" />
        <el-table-column prop="plate_number" label="车牌号" width="120" />
        <el-table-column prop="departure_time" label="发车时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.departure_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="current_status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.current_status)">{{ getStatusLabel(row.current_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.main_order_no)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchOrders"
        @current-change="fetchOrders"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const orderList = ref([])

const searchForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const statusMap = {
  draft: { label: '草稿', type: 'info' },
  pending_schedule: { label: '待排班', type: 'warning' },
  scheduled: { label: '已排班', type: 'primary' },
  vehicle_running: { label: '运行中', type: 'success' },
  pending_arrival_prediction: { label: '待到站预测', type: 'warning' },
  arrival_predicted: { label: '已预测', type: 'primary' },
  pending_exception: { label: '待异常处理', type: 'danger' },
  exception_handled: { label: '异常已处理', type: 'info' },
  pending_statistics: { label: '待运营统计', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  cancelled: { label: '已取消', type: 'info' },
  withdrawn: { label: '已撤回', type: 'info' }
}

function getStatusLabel(status) {
  return statusMap[status]?.label || status
}

function getStatusType(status) {
  return statusMap[status]?.type || 'info'
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function fetchOrders() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const result = await orderApi.list(params)
    orderList.value = result.data
    pagination.total = result.pagination.total
  } catch (error) {
    console.error('获取排班列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchOrders()
}

function resetSearch() {
  searchForm.status = ''
  pagination.page = 1
  fetchOrders()
}

function goToCreate() {
  router.push('/orders/create')
}

function goToDetail(mainOrderNo) {
  router.push(`/orders/${mainOrderNo}`)
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
