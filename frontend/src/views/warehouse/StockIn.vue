<template>
  <div class="stock-in-list-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="入库单号/供应商"
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
        <el-form-item label="入库时间">
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
        <div class="card-header">
          <span>入库记录</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            产品入库
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="stockInList"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="stock_in_no" label="入库单号" width="180" />
        <el-table-column prop="purchase_no" label="采购单号" width="150">
          <template #default="{ row }">
            {{ row.purchase_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="120">
          <template #default="{ row }">
            {{ row.supplier || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="warehouse_name" label="仓库" width="100" />
        <el-table-column prop="total_quantity" label="入库数量" width="100" align="center" />
        <el-table-column prop="total_amount" label="入库金额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ row.total_amount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="production_date" label="生产日期" width="120">
          <template #default="{ row }">
            {{ row.production_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="expiry_date" label="到期日期" width="120">
          <template #default="{ row }">
            {{ row.expiry_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="入库时间" width="160">
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

    <el-dialog
      v-model="dialogVisible"
      title="产品入库"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="采购单号">
              <el-input v-model="formData.purchaseNo" placeholder="请输入采购单号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="formData.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库仓库" prop="warehouseId">
              <el-select
                v-model="formData.warehouseId"
                placeholder="请选择仓库"
                style="width: 100%"
              >
                <el-option
                  v-for="wh in warehouses"
                  :key="wh.id"
                  :label="wh.name"
                  :value="wh.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产日期">
              <el-date-picker
                v-model="formData.productionDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日期">
              <el-date-picker
                v-model="formData.expiryDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="入库明细">
          <el-table :data="formData.items" border style="width: 100%; margin-bottom: 10px;">
            <el-table-column prop="productName" label="产品" min-width="200">
              <template #default="{ row, $index }">
                <el-select
                  v-model="row.productId"
                  placeholder="选择产品"
                  filterable
                  style="width: 100%"
                  @change="(val) => handleProductChange(val, $index)"
                >
                  <el-option
                    v-for="product in productList"
                    :key="product.id"
                    :label="`${product.name} - ${product.product_no}`"
                    :value="product.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="unitPrice" label="单价" width="120">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.unitPrice"
                  :min="0"
                  :precision="2"
                  style="width: 100px"
                />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="120">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  style="width: 100px"
                />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                ¥{{ (row.unitPrice * row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" @click="addItem" size="small">
            <el-icon><Plus /></el-icon>
            添加产品
          </el-button>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确认入库
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getStockInList, stockIn } from '@/api/products'
import { getProductList } from '@/api/products'
import { getWarehouses } from '@/api/common'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)

const stockInList = ref([])
const warehouses = ref([])
const productList = ref([])

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

const formData = reactive({
  purchaseNo: '',
  supplier: '',
  warehouseId: null,
  productionDate: null,
  expiryDate: null,
  remark: '',
  items: [
    { productId: null, productName: '', unit: '', unitPrice: 0, quantity: 1 }
  ]
})

const formRules = {
  warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const fetchWarehouses = async () => {
  try {
    const res = await getWarehouses()
    warehouses.value = res.data || []
    if (warehouses.value.length > 0) {
      formData.warehouseId = warehouses.value[0].id
    }
  } catch (error) {
    console.error('Fetch warehouses error:', error)
  }
}

const fetchProducts = async () => {
  try {
    const res = await getProductList({ page: 1, pageSize: 1000 })
    productList.value = res.data?.list || []
  } catch (error) {
    console.error('Fetch products error:', error)
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

    const res = await getStockInList(params)
    stockInList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch stock in list error:', error)
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

const handleAdd = () => {
  formData.purchaseNo = ''
  formData.supplier = ''
  formData.productionDate = null
  formData.expiryDate = null
  formData.remark = ''
  formData.items = [
    { productId: null, productName: '', unit: '', unitPrice: 0, quantity: 1 }
  ]
  dialogVisible.value = true
}

const handleView = (row) => {
  ElMessage.info('详情功能开发中')
}

const handleProductChange = (productId, index) => {
  const product = productList.value.find(p => p.id === productId)
  if (product) {
    formData.items[index].productName = product.name
    formData.items[index].unit = product.unit
    formData.items[index].unitPrice = product.purchase_price || 0
  }
}

const addItem = () => {
  formData.items.push({
    productId: null,
    productName: '',
    unit: '',
    unitPrice: 0,
    quantity: 1
  })
}

const removeItem = (index) => {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1)
  } else {
    ElMessage.warning('至少需要一个产品')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const validItems = formData.items.filter(item => item.productId && item.quantity > 0)
      if (validItems.length === 0) {
        ElMessage.warning('请添加产品')
        return
      }

      submitLoading.value = true
      try {
        await stockIn({
          purchaseNo: formData.purchaseNo,
          supplier: formData.supplier,
          warehouseId: formData.warehouseId,
          productionDate: formData.productionDate,
          expiryDate: formData.expiryDate,
          remark: formData.remark,
          items: validItems.map(item => ({
            productId: item.productId,
            unitPrice: item.unitPrice,
            quantity: item.quantity
          }))
        })
        ElMessage.success('入库成功')
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('Stock in error:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchWarehouses()
  fetchProducts()
  fetchData()
})
</script>

<style scoped>
.stock-in-list-container {
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
