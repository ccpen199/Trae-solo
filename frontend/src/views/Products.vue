<template>
  <div class="card-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3>商品目录</h3>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增商品
      </el-button>
    </div>

    <el-form :inline="true" class="search-form">
      <el-form-item label="分类">
        <el-select v-model="searchForm.category_id" placeholder="全部分类" clearable style="width: 150px;">
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="searchForm.keyword" placeholder="商品名称/编码" clearable style="width: 200px;" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadProducts">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="products" v-loading="loading" stripe>
      <el-table-column prop="code" label="商品编码" width="120" />
      <el-table-column prop="name" label="商品名称" min-width="200" />
      <el-table-column prop="category_name" label="分类" width="100" />
      <el-table-column prop="supplier_name" label="供应商" width="120" />
      <el-table-column prop="specification" label="规格" min-width="150" />
      <el-table-column prop="unit" label="单位" width="60" />
      <el-table-column prop="unit_price" label="单价" width="100">
        <template #default="{ row }">
          ¥{{ row.unit_price?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="stock_quantity" label="库存" width="80" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="addToCart(row)">加入采购</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showCreateDialog" title="新增商品" width="600px">
      <el-form :model="productForm" :rules="productRules" ref="productFormRef" label-width="100px">
        <el-form-item label="商品编码" prop="code">
          <el-input v-model="productForm.code" placeholder="请输入商品编码" />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="productForm.category_id" placeholder="请选择分类" style="width: 100%;">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="productForm.supplier_id" placeholder="请选择供应商" style="width: 100%;">
            <el-option
              v-for="sup in suppliers"
              :key="sup.id"
              :label="sup.name"
              :value="sup.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="productForm.specification" placeholder="请输入规格" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="productForm.unit" placeholder="请输入单位，如：个、台、箱" />
        </el-form-item>
        <el-form-item label="单价" prop="unit_price">
          <el-input-number v-model="productForm.unit_price" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="税率">
          <el-select v-model="productForm.tax_rate" style="width: 100%;">
            <el-option :value="0.13" label="13%" />
            <el-option :value="0.09" label="9%" />
            <el-option :value="0.06" label="6%" />
            <el-option :value="0" label="0%" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="productForm.stock_quantity" :min="0" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createProduct" :loading="creating">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const creating = ref(false)
const products = ref([])
const categories = ref([])
const suppliers = ref([])
const showCreateDialog = ref(false)
const productFormRef = ref(null)

const searchForm = reactive({
  category_id: null,
  keyword: ''
})

const productForm = reactive({
  code: '',
  name: '',
  category_id: null,
  supplier_id: null,
  specification: '',
  unit: '个',
  unit_price: 0,
  tax_rate: 0.13,
  stock_quantity: 0
})

const productRules = {
  code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  unit_price: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

const loadCategories = async () => {
  try {
    categories.value = await request.get('/products/categories')
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadSuppliers = async () => {
  try {
    suppliers.value = await request.get('/products/suppliers')
  } catch (error) {
    console.error('加载供应商失败:', error)
  }
}

const loadProducts = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.category_id) params.category_id = searchForm.category_id
    if (searchForm.keyword) params.keyword = searchForm.keyword
    
    products.value = await request.get('/products/', { params })
  } catch (error) {
    console.error('加载商品失败:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.category_id = null
  searchForm.keyword = ''
  loadProducts()
}

const createProduct = async () => {
  if (!productFormRef.value) return
  
  await productFormRef.value.validate(async (valid) => {
    if (valid) {
      creating.value = true
      try {
        await request.post('/products/', productForm)
        ElMessage.success('商品创建成功')
        showCreateDialog.value = false
        loadProducts()
      } catch (error) {
        console.error('创建商品失败:', error)
      } finally {
        creating.value = false
      }
    }
  })
}

const addToCart = (product) => {
  const cartItems = JSON.parse(localStorage.getItem('purchaseCart') || '[]')
  const existingItem = cartItems.find(item => item.product_id === product.id)
  
  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cartItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.unit_price,
      quantity: 1
    })
  }
  
  localStorage.setItem('purchaseCart', JSON.stringify(cartItems))
  ElMessage.success('已加入采购清单')
}

onMounted(() => {
  loadCategories()
  loadSuppliers()
  loadProducts()
})
</script>
