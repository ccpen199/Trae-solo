<template>
  <div class="product-container">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="商品名称/编号/关键字"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-select v-model="searchForm.brandId" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="item in brands" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="item in suppliers" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
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
          <span>商品列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAddCategory">新建分类</el-button>
            <el-button type="primary" @click="handleAdd">上架商品</el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="productList" v-loading="loading" stripe>
        <el-table-column prop="code" label="商品编号" min-width="120" />
        <el-table-column prop="name" label="商品名称" min-width="180" />
        <el-table-column prop="category_name" label="分类" min-width="100" />
        <el-table-column prop="brand_name" label="品牌" min-width="100" />
        <el-table-column prop="cost_price" label="成本价" min-width="100">
          <template #default="{ row }">
            ¥{{ row.cost_price }}
          </template>
        </el-table-column>
        <el-table-column prop="sell_price" label="售价" min-width="100">
          <template #default="{ row }">
            ¥{{ row.sell_price }}
          </template>
        </el-table-column>
        <el-table-column prop="stock_quantity" label="库存" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.stock_quantity <= row.warning_line ? 'danger' : 'success'">
              {{ row.stock_quantity || 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier_name" label="供应商" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
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
          @size-change="loadProductList"
          @current-change="loadProductList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品' : '上架商品'"
      width="700px"
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品编号" prop="code">
              <el-input v-model="productForm.code" placeholder="请输入商品编号" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category_id">
              <el-select v-model="productForm.category_id" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand_id">
              <el-select v-model="productForm.brand_id" placeholder="请选择品牌" style="width: 100%">
                <el-option v-for="item in brands" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier_id">
              <el-select v-model="productForm.supplier_id" placeholder="请选择供应商" style="width: 100%">
                <el-option v-for="item in suppliers" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可评论">
              <el-switch v-model="productForm.is_commentable" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="成本价" prop="cost_price">
              <el-input-number
                v-model="productForm.cost_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="成本价"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="售价" prop="sell_price">
              <el-input-number
                v-model="productForm.sell_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="售价"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-switch v-model="productForm.status" active-text="上架" inactive-text="下架" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="库存数量">
              <el-input-number
                v-model="productForm.stock_quantity"
                :min="0"
                style="width: 100%"
                placeholder="库存数量"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预警线">
              <el-input-number
                v-model="productForm.warning_line"
                :min="1"
                style="width: 100%"
                placeholder="库存预警线"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="关键字">
          <el-input v-model="productForm.keywords" placeholder="多个关键字用逗号分隔" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryDialogVisible" title="新建分类" width="400px">
      <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort_order" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddCategorySubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const categoryDialogVisible = ref(false)
const isEdit = ref(false)

const productFormRef = ref(null)
const categoryFormRef = ref(null)

const searchForm = reactive({
  keyword: '',
  categoryId: '',
  brandId: '',
  supplierId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const productList = ref([])
const categories = ref([])
const brands = ref([])
const suppliers = ref([])

const productForm = reactive({
  id: '',
  name: '',
  code: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  cost_price: 0,
  sell_price: 0,
  keywords: '',
  description: '',
  is_commentable: 1,
  status: 1,
  stock_quantity: 0,
  warning_line: 10
})

const categoryForm = reactive({
  name: '',
  sort_order: 0
})

const productRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入商品编号', trigger: 'blur' }],
  cost_price: [
    { required: true, message: '请输入成本价', trigger: 'blur' },
    { type: 'number', min: 0, message: '成本价不能小于0', trigger: 'blur' }
  ],
  sell_price: [
    { required: true, message: '请输入售价', trigger: 'blur' },
    { type: 'number', min: 0, message: '售价不能小于0', trigger: 'blur' }
  ]
}

const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

async function loadProductList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await request.get('/api/products', { params })
    if (res.success) {
      productList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await request.get('/api/products/categories/list')
    if (res.success) {
      categories.value = res.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function loadBrands() {
  try {
    const res = await request.get('/api/products/brands/list')
    if (res.success) {
      brands.value = res.data
    }
  } catch (error) {
    console.error('加载品牌失败:', error)
  }
}

async function loadSuppliers() {
  try {
    const res = await request.get('/api/suppliers/list')
    if (res.success) {
      suppliers.value = res.data
    }
  } catch (error) {
    console.error('加载供应商失败:', error)
  }
}

function handleSearch() {
  pagination.page = 1
  loadProductList()
}

function handleReset() {
  Object.assign(searchForm, {
    keyword: '',
    categoryId: '',
    brandId: '',
    supplierId: '',
    status: ''
  })
  pagination.page = 1
  loadProductList()
}

function handleAdd() {
  isEdit.value = false
  Object.assign(productForm, {
    id: '',
    name: '',
    code: '',
    category_id: '',
    brand_id: '',
    supplier_id: '',
    cost_price: 0,
    sell_price: 0,
    keywords: '',
    description: '',
    is_commentable: 1,
    status: 1,
    stock_quantity: 0,
    warning_line: 10
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(productForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    category_id: row.category_id,
    brand_id: row.brand_id,
    supplier_id: row.supplier_id,
    cost_price: row.cost_price,
    sell_price: row.sell_price,
    keywords: row.keywords,
    description: row.description,
    is_commentable: row.is_commentable,
    status: row.status,
    stock_quantity: row.stock_quantity || 0,
    warning_line: row.warning_line || 10
  })
  dialogVisible.value = true
}

async function handleToggleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  const actionText = newStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定要${actionText}该商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.put(`/api/products/${row.id}/status`, { status: newStatus })
    if (res.success) {
      ElMessage.success(res.message)
      loadProductList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
    }
  }
}

async function handleSubmit() {
  if (!productFormRef.value) return
  
  await productFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        let res
        if (isEdit.value) {
          res = await request.put(`/api/products/${productForm.id}`, productForm)
        } else {
          res = await request.post('/api/products', productForm)
        }
        
        if (res.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
          dialogVisible.value = false
          loadProductList()
        }
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

function handleDialogClosed() {
  productFormRef.value?.resetFields()
}

function handleAddCategory() {
  Object.assign(categoryForm, {
    name: '',
    sort_order: 0
  })
  categoryDialogVisible.value = true
}

async function handleAddCategorySubmit() {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await request.post('/api/products/categories', categoryForm)
        if (res.success) {
          ElMessage.success('分类添加成功')
          categoryDialogVisible.value = false
          loadCategories()
        }
      } catch (error) {
        console.error('添加分类失败:', error)
      }
    }
  })
}

onMounted(() => {
  loadProductList()
  loadCategories()
  loadBrands()
  loadSuppliers()
})
</script>

<style scoped>
.product-container {
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
