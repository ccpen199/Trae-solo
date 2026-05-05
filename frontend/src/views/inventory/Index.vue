<template>
  <div class="inventory-container">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="商品名称/编号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="库存不足" value="warning" />
            <el-option label="库存稳定" value="normal" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="stats-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-card warning">
            <div class="stat-icon">
              <el-icon size="40"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.warningCount }}</div>
              <div class="stat-label">库存预警商品</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card normal">
            <div class="stat-icon">
              <el-icon size="40"><CheckCircle /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.normalCount }}</div>
              <div class="stat-label">库存稳定商品</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card info">
            <div class="stat-icon">
              <el-icon size="40"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalStock }}</div>
              <div class="stat-label">总库存量</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>库存列表</span>
          <el-button type="primary" @click="handleAdd" v-if="canAdd">
            <el-icon><Plus /></el-icon>
            调整库存
          </el-button>
        </div>
      </template>
      
      <el-table :data="inventoryList" v-loading="loading" stripe>
        <el-table-column prop="product_code" label="商品编号" min-width="120" />
        <el-table-column prop="product_name" label="商品名称" min-width="200">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image
                v-if="row.product_image"
                :src="row.product_image"
                :preview-src-list="[row.product_image]"
                fit="cover"
                class="product-image"
              />
              <span>{{ row.product_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stock_quantity" label="当前库存" min-width="120">
          <template #default="{ row }">
            <span :class="getStockClass(row)">
              <el-icon v-if="row.stock_quantity <= row.warning_line"><Warning /></el-icon>
              {{ row.stock_quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="warning_line" label="预警线" min-width="100" />
        <el-table-column label="库存状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStockTagType(row)">
              {{ row.stock_quantity <= row.warning_line ? '不足' : '稳定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="最后更新" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleAdjust(row)">调整库存</el-button>
            <el-button type="warning" link @click="handleSetWarning(row)">设置预警</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadInventoryList"
          @current-change="loadInventoryList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="adjustVisible"
      title="调整库存"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border v-if="currentInventory.product_name">
        <el-descriptions-item label="商品编号">{{ currentInventory.product_code }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ currentInventory.product_name }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ currentInventory.stock_quantity }}</el-descriptions-item>
        <el-descriptions-item label="预警线">{{ currentInventory.warning_line }}</el-descriptions-item>
      </el-descriptions>
      
      <el-form :model="adjustForm" label-width="100px" style="margin-top: 20px">
        <el-form-item label="调整类型">
          <el-radio-group v-model="adjustForm.type">
            <el-radio :value="1">增加库存</el-radio>
            <el-radio :value="2">减少库存</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数量">
          <el-input-number
            v-model="adjustForm.quantity"
            :min="1"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input
            v-model="adjustForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirmAdjust">确认调整</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="warningVisible"
      title="设置预警线"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="商品编号">{{ currentInventory.product_code }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ currentInventory.product_name }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ currentInventory.stock_quantity }}</el-descriptions-item>
      </el-descriptions>
      
      <el-form :model="warningForm" label-width="100px" style="margin-top: 20px">
        <el-form-item label="预警线">
          <el-input-number
            v-model="warningForm.warningLine"
            :min="0"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="warningVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirmWarning">确认设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const adjustVisible = ref(false)
const warningVisible = ref(false)
const canAdd = ref(true)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const inventoryList = ref([])
const currentInventory = ref({})

const stats = reactive({
  warningCount: 0,
  normalCount: 0,
  totalStock: 0
})

const adjustForm = reactive({
  type: 1,
  quantity: 1,
  reason: ''
})

const warningForm = reactive({
  warningLine: 10
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

function getStockClass(row) {
  if (row.stock_quantity <= row.warning_line) {
    return 'stock-warning'
  }
  return 'stock-normal'
}

function getStockTagType(row) {
  if (row.stock_quantity <= row.warning_line) {
    return 'danger'
  }
  return 'success'
}

async function loadInventoryList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status
    }
    
    const res = await request.get('/api/inventory', { params })
    if (res.success) {
      inventoryList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载库存列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await request.get('/api/inventory/stats')
    if (res.success) {
      stats.warningCount = res.data.warningCount
      stats.normalCount = res.data.normalCount
      stats.totalStock = res.data.totalStock
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

function handleSearch() {
  pagination.page = 1
  loadInventoryList()
}

function handleReset() {
  Object.assign(searchForm, {
    keyword: '',
    status: ''
  })
  pagination.page = 1
  loadInventoryList()
}

function handleAdd() {
  Object.assign(currentInventory, {
    product_code: '',
    product_name: '',
    stock_quantity: 0,
    warning_line: 10
  })
  Object.assign(adjustForm, {
    type: 1,
    quantity: 1,
    reason: ''
  })
  adjustVisible.value = true
}

function handleAdjust(row) {
  currentInventory.value = { ...row }
  Object.assign(adjustForm, {
    type: 1,
    quantity: 1,
    reason: ''
  })
  adjustVisible.value = true
}

function handleSetWarning(row) {
  currentInventory.value = { ...row }
  warningForm.warningLine = row.warning_line || 10
  warningVisible.value = true
}

async function handleConfirmAdjust() {
  if (!adjustForm.quantity || adjustForm.quantity < 1) {
    ElMessage.warning('请输入有效的调整数量')
    return
  }
  
  submitting.value = true
  try {
    const data = {
      type: adjustForm.type,
      quantity: adjustForm.quantity,
      reason: adjustForm.reason
    }
    
    const res = await request.put(`/api/inventory/${currentInventory.value.product_id}/adjust`, data)
    if (res.success) {
      ElMessage.success('库存调整成功')
      adjustVisible.value = false
      loadInventoryList()
      loadStats()
    }
  } catch (error) {
    console.error('调整库存失败:', error)
  } finally {
    submitting.value = false
  }
}

async function handleConfirmWarning() {
  submitting.value = true
  try {
    const res = await request.put(`/api/inventory/${currentInventory.value.product_id}/warning`, {
      warning_line: warningForm.warningLine
    })
    if (res.success) {
      ElMessage.success('预警线设置成功')
      warningVisible.value = false
      loadInventoryList()
      loadStats()
    }
  } catch (error) {
    console.error('设置预警线失败:', error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadInventoryList()
  loadStats()
})
</script>

<style scoped>
.inventory-container {
  min-height: 100%;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  flex-wrap: wrap;
}

.stats-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
}

.stat-card.warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-card.normal {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.stat-card.info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.stat-icon {
  margin-right: 20px;
}

.stat-card.warning .stat-icon {
  color: #d97706;
}

.stat-card.normal .stat-icon {
  color: #059669;
}

.stat-card.info .stat-icon {
  color: #2563eb;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
}

.stat-card.warning .stat-value {
  color: #d97706;
}

.stat-card.normal .stat-value {
  color: #059669;
}

.stat-card.info .stat-value {
  color: #2563eb;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.product-cell {
  display: flex;
  align-items: center;
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 10px;
}

.stock-warning {
  color: #f56c6c;
  font-weight: 600;
}

.stock-normal {
  color: #67c23a;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
