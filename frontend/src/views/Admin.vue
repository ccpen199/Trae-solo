<template>
  <el-container style="min-height: 100vh;">
    <el-aside width="220px" style="background-color: #304156;">
      <div style="height: 60px; line-height: 60px; text-align: center; color: #fff; font-size: 18px; font-weight: bold; background-color: #263445;">
        <el-icon size="24"><ShoppingCart /></el-icon>
        管理后台
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
        @select="handleMenuSelect"
      >
        <el-menu-item index="products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="categories">
          <el-icon><Folder /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="back">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回商城</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 16px; font-weight: bold;">{{ pageTitle }}</span>
        <div>
          <span style="margin-right: 10px;">欢迎，{{ userStore.userInfo?.username }}</span>
          <el-button type="primary" text @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main style="background-color: #f0f2f5;">
        <el-card v-if="activeMenu === 'products'">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>商品列表</span>
              <el-button type="primary" @click="showProductDialog()">
                <el-icon><Plus /></el-icon>
                新增商品
              </el-button>
            </div>
          </template>

          <div style="margin-bottom: 20px;">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索商品名称"
              style="width: 250px; margin-right: 10px;"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="searchCategory" placeholder="选择分类" clearable style="width: 150px; margin-right: 10px;">
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
            <el-select v-model="searchStatus" placeholder="选择状态" clearable style="width: 120px; margin-right: 10px;">
              <el-option label="在售" value="on_sale" />
              <el-option label="下架" value="off_sale" />
            </el-select>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>

          <el-table :data="products" v-loading="loading" border style="width: 100%;">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="image_url" label="图片" width="100">
              <template #default="scope">
                <el-image
                  :src="scope.row.image_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20product%20placeholder&image_size=square'"
                  style="width: 60px; height: 60px;"
                  fit="cover"
                />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" min-width="200" />
            <el-table-column prop="price" label="价格" width="100">
              <template #default="scope">
                <span style="color: #ff4d4f; font-weight: bold;">¥{{ scope.row.price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="80" />
            <el-table-column prop="category_name" label="分类" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'on_sale' ? 'success' : 'info'">
                  {{ scope.row.status === 'on_sale' ? '在售' : '下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="primary" text size="small" @click="showProductDialog(scope.row)">编辑</el-button>
                <el-button type="danger" text size="small" @click="handleDeleteProduct(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            style="margin-top: 20px; text-align: right;"
            background
            layout="prev, pager, next, total"
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            @current-change="handlePageChange"
          />
        </el-card>

        <el-card v-else-if="activeMenu === 'categories'">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>分类列表</span>
              <el-button type="primary" @click="showCategoryDialog()">
                <el-icon><Plus /></el-icon>
                新增分类
              </el-button>
            </div>
          </template>

          <el-table :data="categories" v-loading="loading" border style="width: 100%;">
            <el-table-column prop="id" label="ID" width="100" />
            <el-table-column prop="name" label="分类名称" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="primary" text size="small" @click="showCategoryDialog(scope.row)">编辑</el-button>
                <el-button type="danger" text size="small" @click="handleDeleteCategory(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>

    <el-dialog
      v-model="productDialogVisible"
      :title="isEdit ? '编辑商品' : '新增商品'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productRules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品价格" prop="price">
          <el-input-number
            v-model="productForm.price"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number
            v-model="productForm.stock"
            :min="0"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="productForm.categoryId" placeholder="请选择分类" style="width: 100%;">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品状态" prop="status">
          <el-radio-group v-model="productForm.status">
            <el-radio label="on_sale">上架</el-radio>
            <el-radio label="off_sale">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="商品图片" prop="imageUrl">
          <el-input v-model="productForm.imageUrl" placeholder="请输入图片URL" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitProduct">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="categoryDialogVisible"
      :title="isCategoryEdit ? '编辑分类' : '新增分类'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitCategory">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import {
  getAllProductsAdmin, getCategories, createProduct, updateProduct, deleteProduct,
  createCategory, updateCategory, deleteCategory
} from '@/api/product'
import { ShoppingCart, Goods, Folder, ArrowLeft, Plus, Search } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const activeMenu = ref('products')
const loading = ref(false)
const submitLoading = ref(false)

const products = ref([])
const categories = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchKeyword = ref('')
const searchCategory = ref('')
const searchStatus = ref('')

const productDialogVisible = ref(false)
const categoryDialogVisible = ref(false)
const isEdit = ref(false)
const isCategoryEdit = ref(false)
const productFormRef = ref(null)
const categoryFormRef = ref(null)

const pageTitle = computed(() => {
  switch (activeMenu.value) {
    case 'products': return '商品管理'
    case 'categories': return '分类管理'
    default: return ''
  }
})

const productForm = reactive({
  id: null,
  name: '',
  price: 0,
  stock: 0,
  categoryId: null,
  status: 'on_sale',
  imageUrl: '',
  description: ''
})

const categoryForm = reactive({
  id: null,
  name: '',
  description: ''
})

const productRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }]
}

const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const handleMenuSelect = (index) => {
  if (index === 'back') {
    router.push('/home')
  }
}

const fetchCategories = async () => {
  try {
    const res = await getCategories()
    if (res.success) {
      categories.value = res.data
    }
  } catch (error) {
    console.error('获取分类失败', error)
  }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (searchCategory.value) {
      params.categoryId = searchCategory.value
    }
    if (searchStatus.value) {
      params.status = searchStatus.value
    }

    const res = await getAllProductsAdmin(params)
    if (res.success) {
      products.value = res.data.products
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取商品列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchProducts()
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchProducts()
}

const resetProductForm = () => {
  productForm.id = null
  productForm.name = ''
  productForm.price = 0
  productForm.stock = 0
  productForm.categoryId = null
  productForm.status = 'on_sale'
  productForm.imageUrl = ''
  productForm.description = ''
}

const resetCategoryForm = () => {
  categoryForm.id = null
  categoryForm.name = ''
  categoryForm.description = ''
}

const showProductDialog = (product = null) => {
  resetProductForm()
  if (product) {
    isEdit.value = true
    productForm.id = product.id
    productForm.name = product.name
    productForm.price = product.price
    productForm.stock = product.stock
    productForm.categoryId = product.category_id
    productForm.status = product.status
    productForm.imageUrl = product.image_url
    productForm.description = product.description
  } else {
    isEdit.value = false
  }
  productDialogVisible.value = true
}

const showCategoryDialog = (category = null) => {
  resetCategoryForm()
  if (category) {
    isCategoryEdit.value = true
    categoryForm.id = category.id
    categoryForm.name = category.name
    categoryForm.description = category.description
  } else {
    isCategoryEdit.value = false
  }
  categoryDialogVisible.value = true
}

const handleSubmitProduct = async () => {
  if (!productFormRef.value) return

  await productFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data = {
          name: productForm.name,
          description: productForm.description,
          price: productForm.price,
          stock: productForm.stock,
          categoryId: productForm.categoryId,
          imageUrl: productForm.imageUrl,
          status: productForm.status
        }

        let res
        if (isEdit.value) {
          res = await updateProduct(productForm.id, data)
        } else {
          res = await createProduct(data)
        }

        if (res.success) {
          ElMessage.success(isEdit.value ? '商品更新成功' : '商品创建成功')
          productDialogVisible.value = false
          fetchProducts()
        }
      } catch (error) {
        console.error('提交商品失败', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleSubmitCategory = async () => {
  if (!categoryFormRef.value) return

  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data = {
          name: categoryForm.name,
          description: categoryForm.description
        }

        let res
        if (isCategoryEdit.value) {
          res = await updateCategory(categoryForm.id, data)
        } else {
          res = await createCategory(data)
        }

        if (res.success) {
          ElMessage.success(isCategoryEdit.value ? '分类更新成功' : '分类创建成功')
          categoryDialogVisible.value = false
          fetchCategories()
          if (activeMenu.value === 'products') {
            fetchProducts()
          }
        }
      } catch (error) {
        console.error('提交分类失败', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDeleteProduct = async (product) => {
  try {
    await ElMessageBox.confirm(`确定要删除商品"${product.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteProduct(product.id)
    if (res.success) {
      ElMessage.success('商品删除成功')
      fetchProducts()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商品失败', error)
    }
  }
}

const handleDeleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteCategory(category.id)
    if (res.success) {
      ElMessage.success('分类删除成功')
      fetchCategories()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败', error)
    }
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    router.push('/login')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出登录失败', error)
    }
  }
}

watch(activeMenu, (newVal) => {
  if (newVal === 'products') {
    fetchProducts()
  } else if (newVal === 'categories') {
    fetchCategories()
  }
})

onMounted(() => {
  fetchCategories()
  fetchProducts()
})
</script>
