<template>
  <div class="product-list-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="产品名称/编号/品牌"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="产品分类">
          <el-select
            v-model="searchForm.categoryId"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-select
            v-model="searchForm.brandId"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="brand in brands"
              :key="brand.id"
              :label="brand.name"
              :value="brand.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.isOnSale"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="已上架" :value="true" />
            <el-option label="已下架" :value="false" />
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
          <span>产品列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加产品
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="productList"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="product_no" label="产品编号" width="150" />
        <el-table-column prop="name" label="产品名称" min-width="180" />
        <el-table-column prop="brand_name" label="品牌" width="100" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="unit" label="单位" width="80" align="center" />
        <el-table-column prop="purchase_price" label="采购价" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.purchase_price?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="sale_price" label="销售价" width="100" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">
              ¥{{ row.sale_price?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="is_on_sale" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_on_sale === 1 ? 'success' : 'info'" size="small">
              {{ row.is_on_sale === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ row.created_at ? formatDate(row.created_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleInventory(row)">库存</el-button>
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
      :title="dialogTitle"
      width="700px"
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
            <el-form-item label="产品名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-select
                v-model="formData.brandId"
                placeholder="请选择品牌"
                style="width: 100%"
              >
                <el-option
                  v-for="brand in brands"
                  :key="brand.id"
                  :label="brand.name"
                  :value="brand.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="产品分类">
              <el-select
                v-model="formData.categoryId"
                placeholder="请选择分类"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位">
              <el-input v-model="formData.unit" placeholder="如：台/个/件" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上下架">
              <el-radio-group v-model="formData.isOnSale">
                <el-radio :value="1">上架</el-radio>
                <el-radio :value="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="采购价">
              <el-input-number
                v-model="formData.purchasePrice"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售价">
              <el-input-number
                v-model="formData.salePrice"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低库存">
              <el-input-number
                v-model="formData.minStock"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高库存">
              <el-input-number
                v-model="formData.maxStock"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入产品描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="inventoryDialogVisible"
      title="库存盘点"
      width="500px"
    >
      <el-form :model="inventoryForm" label-width="100px">
        <el-form-item label="产品">
          <el-input :value="currentProduct?.name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="currentProductInventory?.quantity" disabled />
        </el-form-item>
        <el-form-item label="修改数量">
          <el-input-number
            v-model="inventoryForm.newQuantity"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="修改原因" prop="reason">
          <el-input
            v-model="inventoryForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入修改原因"
          />
        </el-form-item>
        <el-form-item label="盘点仓库">
          <el-select
            v-model="inventoryForm.warehouseId"
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
      </el-form>
      <template #footer>
        <el-button @click="inventoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="inventoryLoading" @click="handleInventorySubmit">
          确认盘点
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getProductList, createProduct, updateProduct, inventoryCheck, getInventoryList } from '@/api/products'
import { getProductCategories, getBrands, getWarehouses } from '@/api/common'

const loading = ref(false)
const submitLoading = ref(false)
const inventoryLoading = ref(false)
const dialogVisible = ref(false)
const inventoryDialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)
const currentProduct = ref(null)
const currentProductInventory = ref(null)

const productList = ref([])
const categories = ref([])
const brands = ref([])
const warehouses = ref([])

const searchForm = reactive({
  keyword: '',
  categoryId: null,
  brandId: null,
  isOnSale: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  name: '',
  brandId: null,
  categoryId: null,
  unit: '',
  purchasePrice: 0,
  salePrice: 0,
  isOnSale: 1,
  minStock: 0,
  maxStock: 999999,
  description: ''
})

const inventoryForm = reactive({
  newQuantity: 0,
  reason: '',
  warehouseId: null
})

const formRules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑产品' : '添加产品')

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const fetchCategories = async () => {
  try {
    const res = await getProductCategories()
    categories.value = res.data || []
  } catch (error) {
    console.error('Fetch categories error:', error)
  }
}

const fetchBrands = async () => {
  try {
    const res = await getBrands()
    brands.value = res.data || []
  } catch (error) {
    console.error('Fetch brands error:', error)
  }
}

const fetchWarehouses = async () => {
  try {
    const res = await getWarehouses()
    warehouses.value = res.data || []
    if (warehouses.value.length > 0) {
      inventoryForm.warehouseId = warehouses.value[0].id
    }
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
      categoryId: searchForm.categoryId || undefined,
      brandId: searchForm.brandId || undefined,
      isOnSale: searchForm.isOnSale !== null ? searchForm.isOnSale : undefined
    }

    const res = await getProductList(params)
    productList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch product list error:', error)
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
  searchForm.categoryId = null
  searchForm.brandId = null
  searchForm.isOnSale = null
  pagination.page = 1
  fetchData()
}

const resetForm = () => {
  formData.name = ''
  formData.brandId = null
  formData.categoryId = null
  formData.unit = ''
  formData.purchasePrice = 0
  formData.salePrice = 0
  formData.isOnSale = 1
  formData.minStock = 0
  formData.maxStock = 999999
  formData.description = ''
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  resetForm()
  Object.assign(formData, {
    name: row.name,
    brandId: row.brand_id,
    categoryId: row.category_id,
    unit: row.unit,
    purchasePrice: row.purchase_price,
    salePrice: row.sale_price,
    isOnSale: row.is_on_sale,
    minStock: row.min_stock || 0,
    maxStock: row.max_stock || 999999,
    description: row.description
  })
  dialogVisible.value = true
}

const handleInventory = async (row) => {
  currentProduct.value = row
  inventoryForm.newQuantity = 0
  inventoryForm.reason = ''
  
  try {
    const res = await getInventoryList({ productId: row.id, page: 1, pageSize: 1 })
    currentProductInventory.value = res.data?.list?.[0] || { quantity: 0 }
    inventoryForm.newQuantity = currentProductInventory.value.quantity || 0
  } catch (error) {
    console.error('Fetch inventory error:', error)
    currentProductInventory.value = { quantity: 0 }
  }
  
  inventoryDialogVisible.value = true
}

const handleInventorySubmit = async () => {
  if (!inventoryForm.reason) {
    ElMessage.warning('请输入修改原因')
    return
  }

  inventoryLoading.value = true
  try {
    await inventoryCheck(currentProduct.value.id, {
      newQuantity: inventoryForm.newQuantity,
      reason: inventoryForm.reason,
      warehouseId: inventoryForm.warehouseId
    })
    ElMessage.success('库存盘点完成')
    inventoryDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('Inventory check error:', error)
  } finally {
    inventoryLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateProduct(editId.value, formData)
          ElMessage.success('更新成功')
        } else {
          await createProduct(formData)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('Submit error:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchCategories()
  fetchBrands()
  fetchWarehouses()
  fetchData()
})
</script>

<style scoped>
.product-list-container {
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
