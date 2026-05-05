<template>
  <div class="inventory-list-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="产品名称/编号"
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
        <div class="card-header">
          <span>库存列表</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="inventoryList"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="product_no" label="产品编号" width="150" />
        <el-table-column prop="product_name" label="产品名称" min-width="180" />
        <el-table-column prop="brand_name" label="品牌" width="100" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="unit" label="单位" width="80" align="center" />
        <el-table-column prop="warehouse_name" label="仓库" width="120" />
        <el-table-column prop="quantity" label="库存数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStockType(row.quantity, row.min_stock, row.max_stock)" size="small">
              {{ row.quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="min_stock" label="最低库存" width="100" align="center">
          <template #default="{ row }">
            {{ row.min_stock || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="max_stock" label="最高库存" width="100" align="center">
          <template #default="{ row }">
            {{ row.max_stock || 999999 }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="最后更新" width="160">
          <template #default="{ row }">
            {{ row.updated_at ? formatDate(row.updated_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleInventoryCheck(row)">库存盘点</el-button>
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

    <el-dialog
      v-model="inventoryCheckDialogVisible"
      title="库存盘点"
      width="500px"
    >
      <el-form :model="inventoryCheckForm" label-width="100px">
        <el-form-item label="产品">
          <el-input :value="currentInventory?.product_name" disabled />
        </el-form-item>
        <el-form-item label="仓库">
          <el-input :value="currentInventory?.warehouse_name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="currentInventory?.quantity" disabled />
        </el-form-item>
        <el-form-item label="新库存数量">
          <el-input-number
            v-model="inventoryCheckForm.newQuantity"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="库存差异">
          <el-input :value="inventoryDiff" disabled>
            <template #suffix>
              <span :style="{ color: inventoryDiff >= 0 ? '#67c23a' : '#f56c6c' }">
                {{ inventoryDiff >= 0 ? '+' : '' }}{{ inventoryDiff }}
              </span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="修改原因">
          <el-input
            v-model="inventoryCheckForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入修改原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inventoryCheckDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="inventoryCheckLoading" @click="handleInventoryCheckSubmit">
          确认盘点
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getInventoryList, inventoryCheck } from '@/api/products'
import { getWarehouses } from '@/api/common'

const loading = ref(false)
const inventoryCheckLoading = ref(false)
const inventoryCheckDialogVisible = ref(false)
const currentInventory = ref(null)

const inventoryList = ref([])
const warehouses = ref([])

const searchForm = reactive({
  keyword: '',
  warehouseId: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const inventoryCheckForm = reactive({
  newQuantity: 0,
  reason: ''
})

const inventoryDiff = computed(() => {
  return inventoryCheckForm.newQuantity - (currentInventory.value?.quantity || 0)
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const getStockType = (quantity, minStock, maxStock) => {
  if (quantity === 0) {
    return 'danger'
  }
  if (minStock && quantity <= minStock) {
    return 'warning'
  }
  if (maxStock && quantity >= maxStock) {
    return 'primary'
  }
  return 'success'
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
      warehouseId: searchForm.warehouseId || undefined
    }

    const res = await getInventoryList(params)
    inventoryList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch inventory list error:', error)
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
  pagination.page = 1
  fetchData()
}

const handleInventoryCheck = (row) => {
  currentInventory.value = row
  inventoryCheckForm.newQuantity = row.quantity
  inventoryCheckForm.reason = ''
  inventoryCheckDialogVisible.value = true
}

const handleInventoryCheckSubmit = async () => {
  if (!inventoryCheckForm.reason) {
    ElMessage.warning('请输入修改原因')
    return
  }

  inventoryCheckLoading.value = true
  try {
    await inventoryCheck(currentInventory.value.product_id, {
      newQuantity: inventoryCheckForm.newQuantity,
      reason: inventoryCheckForm.reason,
      warehouseId: currentInventory.value.warehouse_id
    })
    ElMessage.success('库存盘点完成')
    inventoryCheckDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('Inventory check error:', error)
  } finally {
    inventoryCheckLoading.value = false
  }
}

onMounted(() => {
  fetchWarehouses()
  fetchData()
})
</script>

<style scoped>
.inventory-list-container {
  padding: 0;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
