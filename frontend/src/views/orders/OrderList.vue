<template>
  <div class="order-list">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 180px">
            <el-option
              v-for="(label, value) in STATUS_LABEL"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.search"
            placeholder="订单号/标题/模型名称"
            clearable
            style="width: 240px"
            @keyup.enter="fetchOrders"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchOrders">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="primary" v-if="canCreateOrder" @click="router.push('/orders/create')">
            <el-icon><Plus /></el-icon>
            创建订单
          </el-button>
        </div>
      </template>

      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.id)">
              {{ row.order_no }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="model_name" label="模型名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="current_status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="STATUS_COLOR[row.current_status]" effect="light">
              {{ STATUS_LABEL[row.current_status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsible_name" label="负责人" width="100" />
        <el-table-column prop="actual_cost" label="实际金额" width="120">
          <template #default="{ row }">
            <span v-if="row.actual_cost !== null && row.actual_cost !== undefined">
              ¥{{ row.actual_cost.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.id)">详情</el-button>
            <el-button 
              type="primary" 
              link 
              v-if="hasAvailableActions(row)" 
              @click="goToProcess(row.id)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchOrders"
          @current-change="fetchOrders"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { STATUS_LABEL, STATUS_COLOR, STATUS, ROLES } from '@/utils/constants'
import request from '@/utils/request'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const orders = ref([])

const filters = reactive({
  status: '',
  search: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const canCreateOrder = computed(() => 
  authStore.role === ROLES.CONSUMER || authStore.role === ROLES.OPERATOR
)

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}

function hasAvailableActions(row) {
  if (!row.stateInfo || !row.stateInfo.allowedActions) return false
  return row.stateInfo.allowedActions.length > 0
}

async function fetchOrders() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filters.status) params.status = filters.status
    if (filters.search) params.search = filters.search

    const res = await request.get('/orders', { params })
    orders.value = res.data.orders || []
    pagination.total = res.data.pagination?.total || 0
  } catch (err) {
    console.error('获取订单列表失败:', err)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.status = ''
  filters.search = ''
  pagination.page = 1
  fetchOrders()
}

function goToDetail(orderId) {
  router.push(`/orders/${orderId}`)
}

function goToProcess(orderId) {
  router.push(`/orders/${orderId}/process`)
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-list {
  height: 100%;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
