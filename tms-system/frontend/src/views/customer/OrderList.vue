<template>
  <div class="page-container">
    <div class="page-header">
      <h2>我的订单</h2>
    </div>

    <el-table :data="orders" v-loading="loading" stripe>
      <el-table-column prop="order_no" label="订单号" width="180" />
      <el-table-column label="运输路线" min-width="200">
        <template #default="{ row }">
          {{ row.pickup_city }} → {{ row.delivery_city }}
        </template>
      </el-table-column>
      <el-table-column label="货物" width="120">
        <template #default="{ row }">
          {{ row.goods_name }} / {{ row.weight }}吨
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="下单时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
          <el-button link type="primary" @click="handleTrack(row)" v-if="['DISPATCHED', 'IN_TRANSIT'].includes(row.status)">追踪</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50]"
      layout="total, prev, pager, next"
      @change="fetchData"
      style="margin-top: 20px; justify-content: center"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { customerApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const orders = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await customerApi.orders({ page: pagination.page, pageSize: pagination.pageSize })
    orders.value = res.data
    pagination.total = res.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

function handleDetail(row) {
  router.push(`/customer/orders/${row.id}`)
}

function handleTrack(row) {
  router.push(`/customer/track/${row.id}`)
}

function getStatusType(status) {
  const types = { PENDING: 'warning', DISPATCHED: 'primary', IN_TRANSIT: 'success', COMPLETED: 'info', CANCELLED: 'danger' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { PENDING: '待调度', DISPATCHED: '已调度', IN_TRANSIT: '运输中', COMPLETED: '已完成', CANCELLED: '已取消' }
  return texts[status] || status
}
</script>
