<template>
  <div class="purchase-container">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="全部" clearable style="width: 200px">
            <el-option v-for="item in suppliers" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待确认" :value="1" />
            <el-option label="已确认" :value="2" />
            <el-option label="已发货" :value="3" />
            <el-option label="已收货" :value="4" />
            <el-option label="已完成" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>采购单列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新建采购单
          </el-button>
        </div>
      </template>
      
      <el-table :data="purchaseList" v-loading="loading" stripe>
        <el-table-column prop="purchase_no" label="采购单号" min-width="180" />
        <el-table-column prop="supplier_name" label="供应商" min-width="150" />
        <el-table-column prop="total_amount" label="采购金额" min-width="120">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.total_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 3"
              type="success"
              link
              @click="handleReceive(row)"
            >确认收货</el-button>
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
          @size-change="loadPurchaseList"
          @current-change="loadPurchaseList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      title="新建采购单"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="purchaseFormRef"
        :model="purchaseForm"
        :rules="purchaseRules"
        label-width="100px"
      >
        <el-form-item label="供应商" prop="supplier_id">
          <el-select
            v-model="purchaseForm.supplier_id"
            placeholder="请选择供应商"
            style="width: 300px"
            @change="handleSupplierChange"
          >
            <el-option v-for="item in suppliers" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="采购商品">
          <div class="product-table-wrapper">
            <el-table :data="purchaseForm.items" border style="width: 100%">
              <el-table-column label="商品" min-width="200">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.product_id"
                    placeholder="请选择商品"
                    style="width: 100%"
                    @change="(val) => handleProductChange(val, $index)"
                    :disabled="!purchaseForm.supplier_id"
                  >
                    <el-option
                      v-for="item in supplierProducts"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="成本价" width="120">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.unit_price"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @change="calculateTotal"
                  />
                </template>
              </el-table-column>
              <el-table-column label="数量" width="100">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.quantity"
                    :min="1"
                    style="width: 100%"
                    @change="calculateTotal"
                  />
                </template>
              </el-table-column>
              <el-table-column label="小计" width="120">
                <template #default="{ row }">
                  <span class="amount-text">¥{{ (row.quantity * row.unit_price).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    link
                    @click="removeItem($index)"
                    :disabled="purchaseForm.items.length <= 1"
                  >删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <el-button type="primary" link @click="addItem" class="add-item-btn">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="总金额">
          <span class="total-amount">¥{{ purchaseForm.total_amount.toFixed(2) }}</span>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="purchaseForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="采购单详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="采购单号">{{ currentPurchase.purchase_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentPurchase.status)">{{ getStatusText(currentPurchase.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="供应商">{{ currentPurchase.supplier_name }}</el-descriptions-item>
        <el-descriptions-item label="采购金额" class="amount-text">¥{{ currentPurchase.total_amount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentPurchase.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentPurchase.supplier_phone }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentPurchase.supplier_contact }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentPurchase.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider>采购商品</el-divider>
      
      <el-table :data="currentPurchase.items || []" border>
        <el-table-column prop="product_name" label="商品名称" />
        <el-table-column prop="product_code" label="商品编号" />
        <el-table-column prop="unit_price" label="单价">
          <template #default="{ row }">¥{{ row.unit_price }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="total_price" label="小计">
          <template #default="{ row }">¥{{ row.total_price }}</template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button v-if="currentPurchase.status === 3" type="success" @click="handleReceive(currentPurchase)">
          确认收货
        </el-button>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)

const purchaseFormRef = ref(null)

const searchForm = reactive({
  supplierId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const purchaseList = ref([])
const suppliers = ref([])
const supplierProducts = ref([])
const currentPurchase = ref({})

const purchaseForm = reactive({
  supplier_id: '',
  items: [{ product_id: '', unit_price: 0, quantity: 1 }],
  total_amount: 0,
  remark: ''
})

const purchaseRules = {
  supplier_id: [{ required: true, message: '请选择供应商', trigger: 'change' }]
}

const statusMap = {
  1: '待确认',
  2: '已确认',
  3: '已发货',
  4: '已收货',
  5: '已完成'
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

function getStatusType(status) {
  const types = {
    1: 'warning',
    2: 'primary',
    3: 'info',
    4: 'success',
    5: ''
  }
  return types[status] || ''
}

function getStatusText(status) {
  return statusMap[status] || '未知'
}

async function loadPurchaseList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      supplierId: searchForm.supplierId,
      status: searchForm.status
    }
    
    const res = await request.get('/api/purchase', { params })
    if (res.success) {
      purchaseList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载采购单列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadSuppliers() {
  try {
    const res = await request.get('/api/suppliers/list')
    if (res.success) {
      suppliers.value = res.data
    }
  } catch (error) {
    console.error('加载供应商列表失败:', error)
  }
}

async function handleSupplierChange(supplierId) {
  if (!supplierId) {
    supplierProducts.value = []
    return
  }
  
  try {
    const res = await request.get(`/api/purchase/supplier/products/${supplierId}`)
    if (res.success) {
      supplierProducts.value = res.data
    }
  } catch (error) {
    console.error('加载供应商商品失败:', error)
  }
}

function handleProductChange(productId, index) {
  const product = supplierProducts.value.find(p => p.id === productId)
  if (product) {
    purchaseForm.items[index].unit_price = product.cost_price || 0
  }
  calculateTotal()
}

function addItem() {
  purchaseForm.items.push({ product_id: '', unit_price: 0, quantity: 1 })
}

function removeItem(index) {
  if (purchaseForm.items.length > 1) {
    purchaseForm.items.splice(index, 1)
    calculateTotal()
  }
}

function calculateTotal() {
  purchaseForm.total_amount = purchaseForm.items.reduce((sum, item) => {
    return sum + (item.unit_price || 0) * (item.quantity || 0)
  }, 0)
}

function handleSearch() {
  pagination.page = 1
  loadPurchaseList()
}

function handleReset() {
  Object.assign(searchForm, {
    supplierId: '',
    status: ''
  })
  pagination.page = 1
  loadPurchaseList()
}

function handleAdd() {
  Object.assign(purchaseForm, {
    supplier_id: '',
    items: [{ product_id: '', unit_price: 0, quantity: 1 }],
    total_amount: 0,
    remark: ''
  })
  supplierProducts.value = []
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!purchaseFormRef.value) return
  
  await purchaseFormRef.value.validate(async (valid) => {
    if (valid) {
      const validItems = purchaseForm.items.filter(item => item.product_id && item.quantity > 0 && item.unit_price >= 0)
      if (validItems.length === 0) {
        ElMessage.warning('请至少添加一个有效商品')
        return
      }
      
      submitting.value = true
      try {
        const res = await request.post('/api/purchase', {
          supplier_id: purchaseForm.supplier_id,
          items: validItems,
          remark: purchaseForm.remark
        })
        
        if (res.success) {
          ElMessage.success('采购单创建成功')
          dialogVisible.value = false
          loadPurchaseList()
        }
      } catch (error) {
        console.error('创建采购单失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

async function handleView(row) {
  try {
    const res = await request.get(`/api/purchase/${row.id}`)
    if (res.success) {
      currentPurchase.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    console.error('获取采购单详情失败:', error)
  }
}

async function handleReceive(row) {
  try {
    await ElMessageBox.confirm('确认收到货物后，库存将自动增加，确定要确认收货吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.put(`/api/purchase/${row.id}/status`, { status: 4 })
    if (res.success) {
      ElMessage.success('确认收货成功，库存已更新')
      detailVisible.value = false
      loadPurchaseList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认收货失败:', error)
    }
  }
}

onMounted(() => {
  loadPurchaseList()
  loadSuppliers()
})
</script>

<style scoped>
.purchase-container {
  min-height: 100%;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  flex-wrap: wrap;
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

.amount-text {
  color: #f56c6c;
  font-weight: 600;
}

.total-amount {
  font-size: 20px;
  color: #f56c6c;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.product-table-wrapper {
  width: 100%;
}

.add-item-btn {
  margin-top: 12px;
}
</style>
