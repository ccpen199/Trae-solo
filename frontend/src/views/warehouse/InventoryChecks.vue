<template>
  <div class="inventory-checks-list-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="盘点单号/产品名称"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="仓库">
          <el-select
            v-model="searchForm.warehouseId"
            placeholder="全部仓库"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="wh in warehouses"
              :key="wh.id"
              :label="wh.name"
              :value="wh.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <span>库存盘点记录</span>
      </template>

      <el-table
        v-loading="loading"
        :data="inventoryChecksList"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="check_no" label="盘点单号" width="180" />
        <el-table-column prop="product_name" label="产品名称" min-width="180" />
        <el-table-column prop="warehouse_name" label="仓库" width="100" />
        <el-table-column prop="before_quantity" label="原库存" width="100" align="center" />
        <el-table-column prop="after_quantity" label="新库存" width="100" align="center" />
        <el-table-column prop="change_quantity" label="差异" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: (row.after_quantity - row.before_quantity) >= 0 ? '#67c23a' : '#f56c6c' }">
              {{ (row.after_quantity - row.before_quantity) >= 0 ? '+' : '' }}{{ row.after_quantity - row.before_quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="修改原因" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.reason" placement="top">
              <span>{{ row.reason || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column prop="created_at" label="盘点时间" width="160">
          <template #default="{ row }">
            {{ row.created_at ? formatDate(row.created_at) : '-' }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import { getInventoryChecks } from '@/api/products'
import { getWarehouses } from '@/api/common'

const loading = ref(false)

const inventoryChecksList = ref([])
const warehouses = ref([])

const searchForm = reactive({
  keyword: '',
  warehouseId: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const fetchWarehouses = async () => {
  try {
    const res = await getWarehouses()
    warehouses.value = res.data || []
  } catch (error) {
    console.error('Fetch warehouses error:', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      warehouseId: searchForm.warehouseId || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined
    }

    const res = await getInventoryChecks(params)
    inventoryChecksList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch inventory checks list error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.warehouseId = null
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

onMounted(() => {
  fetchWarehouses()
  fetchData()
})
</script>

<style scoped>
.inventory-checks-list-container {
  padding: 0;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
</style>
