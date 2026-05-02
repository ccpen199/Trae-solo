<template>
  <div class="home-container">
    <el-header style="height: auto; padding: 0;">
      <div class="header-inner">
        <div class="logo">
          <h1><router-link to="/">C2C二手交易平台</router-link></h1>
        </div>
        
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品..."
            @keyup.enter="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>

        <div class="header-actions">
          <template v-if="userStore.isLoggedIn">
            <router-link to="/publish">
              <el-button type="primary">
                <el-icon><Plus /></el-icon>
                发布商品
              </el-button>
            </router-link>
            
            <el-dropdown>
              <span class="user-info">
                <el-avatar :size="32">
                  {{ userStore.userInfo?.nickname?.charAt(0) }}
                </el-avatar>
                <span class="nickname">{{ userStore.userInfo?.nickname }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <router-link to="/profile">个人中心</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/orders">我的订单</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/my-products">我的商品</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/favorites">我的收藏</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/chat">消息中心</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin || userStore.isCustomerService">
                    <router-link to="/admin">管理后台</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          
          <template v-else>
            <router-link to="/login">
              <el-button>登录</el-button>
            </router-link>
            <router-link to="/register">
              <el-button type="primary">注册</el-button>
            </router-link>
          </template>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <div class="filter-bar">
        <el-radio-group v-model="activeCategory" class="category-radio" @change="handleCategoryChange">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button
            v-for="cat in categories"
            :key="cat.value"
            :label="cat.value"
          >
            {{ cat.label }}
          </el-radio-button>
        </el-radio-group>

        <div class="filter-right">
          <el-select v-model="sortBy" placeholder="排序" @change="handleSort" style="width: 120px;">
            <el-option label="最新发布" value="newest" />
            <el-option label="价格最低" value="price_asc" />
            <el-option label="价格最高" value="price_desc" />
          </el-select>
        </div>
      </div>

      <div class="products-grid" v-loading="loading">
        <template v-for="product in products" :key="product.id">
          <router-link :to="`/products/${product.id}`" class="product-link">
            <el-card
              class="product-card card-hover"
              :body-style="{ padding: 0 }"
            >
              <div class="product-image-wrapper">
                <img
                  class="product-image"
                  :src="getProductImage(product)"
                  alt="商品图片"
                />
                <el-tag
                  v-if="product.needsAppraisal"
                  type="warning"
                  class="appraisal-tag"
                >
                  需鉴定
                </el-tag>
              </div>
              <div class="product-info">
                <h3 class="product-title">{{ product.title }}</h3>
                <div class="product-price">
                  <span class="price-tag">¥{{ product.price.toFixed(2) }}</span>
                  <span class="original-price" v-if="product.originalPrice">
                    ¥{{ product.originalPrice.toFixed(2) }}
                  </span>
                </div>
                <div class="product-footer">
                  <span class="seller-info">
                    <span>{{ product.sellerNickname }}</span>
                  </span>
                  <el-tag
                    v-if="product.brand"
                    size="small"
                    type="info"
                  >
                    {{ product.brand }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </router-link>
        </template>

        <el-empty v-if="!loading && products.length === 0" description="暂无商品" />
      </div>

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store'
import { productApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const products = ref([])
const categories = ref([
  { label: '数码产品', value: '数码产品' },
  { label: '家用电器', value: '家用电器' },
  { label: '奢侈品', value: '奢侈品' },
  { label: '服饰', value: '服饰' },
  { label: '运动户外', value: '运动户外' }
])
const searchKeyword = ref('')
const activeCategory = ref('')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(16)
const total = ref(0)

const productImages = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%20smartphone%20used%20electronics%20product%20photo&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sony%20camera%20lens%20used%20photography%20product%20photo&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20watch%20Rolex%20used%20jewelry%20product%20photo&image_size=square'
]

const getProductImage = (product) => {
  if (product.images && product.images.length > 0) {
    return product.images[0]
  }
  const index = (product.id || 0) % productImages.length
  return productImages[index]
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      category: activeCategory.value,
      keyword: searchKeyword.value,
      sortBy: sortBy.value
    }
    const result = await productApi.getList(params)
    products.value = result.data.products || []
    total.value = result.data.total || 0
  } catch (e) {
    console.error('Failed to fetch products:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchProducts()
}

const handleCategoryChange = () => {
  currentPage.value = 1
  fetchProducts()
}

const handleSort = () => {
  fetchProducts()
}

const handlePageChange = () => {
  fetchProducts()
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Logout error:', e)
    }
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.logo a {
  color: inherit;
}

.search-bar {
  flex: 0 0 400px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.nickname {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
}

.category-radio {
  display: flex;
  flex-wrap: wrap;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.product-link {
  text-decoration: none;
  color: inherit;
}

.product-card {
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.product-image-wrapper {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.appraisal-tag {
  position: absolute;
  top: 10px;
  right: 10px;
}

.product-info {
  padding: 16px;
}

.product-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 42px;
}

.product-price {
  margin-bottom: 12px;
}

.price-tag {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.original-price {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
</style>
