<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button 
            v-if="userStore.role === 'supplier'"
            type="primary" 
            @click="goToCreate"
          >
            <el-icon><Plus /></el-icon>
            新增资产登记
          </el-button>
        </div>
      </template>
      
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="选择状态" clearable @change="fetchOrders">
          <el-option
            v-for="[key, info] in Object.entries(statusMap)"
            :key="key"
            :label="info.label"
            :value="key"
          />
        </el-select>
        <el-button type="primary" @click="fetchOrders">查询</el-button>
        <el-button @click="filterStatus = null; fetchOrders">重置</el-button>
      </div>
      
      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="goToDetail(row.id)">{{ row.order_no }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="160">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金额" width="140">
          <template #default="{ row }">
            ¥{{ Number(row.total_amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
          </template>
        </el-table-column>
        <el-table-column prop="supplier_org" label="供应商" width="140">
          <template #default="{ row }">
            {{ row.supplier_org?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="core_org" label="核心企业" width="140">
          <template #default="{ row }">
            {{ row.core_org?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="expected_completion_date" label="期望完成日期" width="140">
          <template #default="{ row }">
            {{ row.expected_completion_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="is_locked" label="锁定状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_locked" type="danger">已锁定</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { statusMap } from '@/api'
import * as api from '@/api'

const router = useRouter()
const userStore = useUserStore()

const orders = ref([])
const loading = ref(false)
const filterStatus = ref(null)

const goToCreate = () => router.push('/orders/create')
const goToDetail = (id) => router.push(`/orders/${id}`)

const fetchOrders = async () => {
  loading.value = true
  try {
    orders.value = await api.getOrders(filterStatus.value)
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
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

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
</style>
