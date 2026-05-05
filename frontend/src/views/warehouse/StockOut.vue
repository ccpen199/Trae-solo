<template>
  <div class="stock-out-list-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="出库单号/订单号"
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
        <el-form-item label="出库时间">
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
        <span>出库记录</span>
      </template>

      <el-table
        v-loading="loading"
        :data="stockOutList"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="stock_out_no" label="出库单号" width="180" />
        <el-table-column prop="order_no" label="关联订单" width="180">
          <template #default="{ row }">
            {{ row.order_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="warehouse_name" label="仓库" width="100" />
        <el-table-column prop="total_quantity" label="出库数量" width="100" align="center" />
        <el-table-column prop="total_amount" label="出库金额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ row.total_amount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="stock_out_type" label="出库类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getOutTypeLabel(row.stock_out_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="出库时间" width="160">
          <template #default="{ row }">
            {{ row.created_at ? formatDate(row.created_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
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
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getStockOutList } from '@/api/products'
import { getWarehouses } from '@/api/common'

const loading = ref(false)

const stockOutList = ref([])
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

const getOutTypeLabel = (type) => {
  const map = {
    order: '订单出库',
    return: '退货出库',
    other: '其他出库'
  }
  return map[type] || type
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

    const res = await getStockOutList(params)
    stockOutList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch stock out list error:', error)
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

const handleView = (row) => {
  ElMessage.info('详情功能开发中')
}

onMounted(() => {
  fetchWarehouses()
  fetchData()
})
</script>

<style scoped>
.stock-out-list-container {
  padding: 0;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
</style>
