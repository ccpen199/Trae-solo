<template>
  <div class="accessory-list-page">
    <div class="container">
      <h1 class="page-title">配件商城</h1>
      
      <div class="page-content">
        <div class="filter-sidebar">
          <div class="filter-section">
            <h3 class="filter-title">配件分类</h3>
            <div class="category-list">
              <div 
                class="category-item" 
                :class="{ active: categoryFilter === '' }"
                @click="categoryFilter = ''"
              >
                全部配件
              </div>
              <div 
                class="category-item" 
                v-for="cat in categories" 
                :key="cat.id"
                :class="{ active: categoryFilter === cat.id }"
                @click="categoryFilter = cat.id"
              >
                {{ cat.name }}
                <span class="count">({{ cat.count || 0 }})</span>
              </div>
            </div>
          </div>
          
          <div class="filter-section" v-if="upgradePackages.length > 0">
            <h3 class="filter-title">优化改造包</h3>
            <div class="upgrade-list">
              <div class="upgrade-item" v-for="pkg in upgradePackages" :key="pkg.id">
                <div class="upgrade-info">
                  <h4>{{ pkg.name }}</h4>
                  <p>{{ pkg.description }}</p>
                  <div class="upgrade-price">
                    <span class="currency">¥</span>
                    <span class="amount">{{ pkg.price }}</span>
                  </div>
                </div>
                <el-button 
                  type="primary" 
                  size="small"
                  :loading="pkg.adding"
                  @click="handleAddUpgrade(pkg)"
                >
                  添加
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="main-content">
          <div class="search-bar">
            <el-input
              v-model="keyword"
              placeholder="搜索配件..."
              clearable
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          
          <div class="accessories-grid" v-loading="loading">
            <el-empty v-if="accessories.length === 0 && !loading" description="暂无配件" />
            
            <div class="accessory-card" v-for="item in accessories" :key="item.id">
              <div class="accessory-image">
                <el-image
                  :src="item.image || 'https://picsum.photos/200/200?random=' + item.id"
                  fit="cover"
                  lazy
                />
              </div>
              <div class="accessory-info">
                <div class="accessory-category">{{ item.categoryName || '配件' }}</div>
                <h3 class="accessory-name">{{ item.name }}</h3>
                <p class="accessory-desc">{{ item.description || '精选优质配件，品质保证' }}</p>
                <div class="accessory-footer">
                  <div class="accessory-price">
                    <span class="currency">¥</span>
                    <span class="amount">{{ item.price }}</span>
                  </div>
                  <div class="accessory-action">
                    <el-input-number 
                      v-model="item.quantity" 
                      :min="1"
                      :max="99"
                      size="small"
                      :controls="false"
                      style="width: 80px"
                    />
                    <el-button 
                      type="primary" 
                      size="small"
                      :loading="item.adding"
                      @click="handleAddToCart(item)"
                    >
                      <el-icon><ShoppingCart /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pagination-wrapper" v-if="total > 0">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[12, 24, 48]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { accessoryApi } from '@/api/accessory'
import { useCartStore } from '@/store/cart'
import { useUserStore } from '@/store/user'

const cartStore = useCartStore()
const userStore = useUserStore()

const loading = ref(false)
const accessories = ref([])
const categories = ref([])
const upgradePackages = ref([])
const total = ref(0)
const keyword = ref('')
const categoryFilter = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 12
})

const fetchAccessories = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      categoryId: categoryFilter.value || undefined,
      keyword: keyword.value || undefined
    }
    
    const result = await accessoryApi.getList(params)
    accessories.value = result.data.list || []
    
    accessories.value.forEach(item => {
      item.quantity = 1
      item.adding = false
    })
    
    total.value = result.data.total || 0
  } catch (error) {
    console.error('获取配件列表失败:', error)
    ElMessage.error('获取配件列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const result = await accessoryApi.getCategories()
    categories.value = result.data || []
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const fetchUpgradePackages = async () => {
  try {
    const result = await accessoryApi.getUpgradePackages()
    upgradePackages.value = result.data || []
    
    upgradePackages.value.forEach(pkg => {
      pkg.adding = false
    })
  } catch (error) {
    console.error('获取改造包失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchAccessories()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchAccessories()
}

const handlePageChange = () => {
  fetchAccessories()
}

const handleAddToCart = async (item) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  item.adding = true
  try {
    await cartStore.addAccessory({
      accessoryId: item.id,
      name: item.name,
      categoryName: item.categoryName,
      image: item.image,
      unitPrice: item.price,
      quantity: item.quantity
    })
    ElMessage.success('已加入购物车')
  } catch (error) {
    console.error('加入购物车失败:', error)
    ElMessage.error(error.response?.data?.message || '加入购物车失败')
  } finally {
    item.adding = false
  }
}

const handleAddUpgrade = async (pkg) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  pkg.adding = true
  try {
    await cartStore.addUpgrade({
      upgradePackageId: pkg.id,
      name: pkg.name,
      description: pkg.description,
      unitPrice: pkg.price,
      quantity: 1
    })
    ElMessage.success('已加入购物车')
  } catch (error) {
    console.error('加入购物车失败:', error)
    ElMessage.error(error.response?.data?.message || '加入购物车失败')
  } finally {
    pkg.adding = false
  }
}

watch(categoryFilter, () => {
  pagination.page = 1
  fetchAccessories()
})

onMounted(() => {
  fetchCategories()
  fetchUpgradePackages()
  fetchAccessories()
})
</script>

<style scoped>
.accessory-list-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.page-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  font-weight: bold;
}

.page-content {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
}

.filter-sidebar {
  flex-shrink: 0;
}

.filter-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.filter-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.category-item {
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
  font-size: 14px;
}

.category-item:hover {
  background: #f5f7fa;
  color: #667eea;
}

.category-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.category-item .count {
  opacity: 0.8;
}

.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.upgrade-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upgrade-info h4 {
  font-size: 14px;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
}

.upgrade-info p {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.upgrade-price {
  display: flex;
  align-items: baseline;
}

.upgrade-price .currency {
  font-size: 12px;
  color: #f56c6c;
  font-weight: bold;
}

.upgrade-price .amount {
  font-size: 18px;
  color: #f56c6c;
  font-weight: bold;
}

.main-content {
  min-width: 0;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar .el-input {
  max-width: 400px;
}

.accessories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.accessory-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.accessory-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.accessory-image {
  height: 180px;
  overflow: hidden;
}

.accessory-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.accessory-card:hover .accessory-image img {
  transform: scale(1.05);
}

.accessory-info {
  padding: 15px;
}

.accessory-category {
  display: inline-block;
  font-size: 12px;
  color: #667eea;
  background: #f0f2ff;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.accessory-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 8px;
  font-weight: bold;
}

.accessory-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.accessory-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.accessory-price {
  display: flex;
  align-items: baseline;
}

.accessory-price .currency {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.accessory-price .amount {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
}

.accessory-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-wrapper {
  margin-top: 30px;
  text-align: center;
}

@media (max-width: 1200px) {
  .accessories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .page-content {
    grid-template-columns: 1fr;
  }
  
  .filter-sidebar {
    display: flex;
    gap: 20px;
  }
  
  .filter-section {
    flex: 1;
  }
  
  .category-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .upgrade-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .upgrade-item {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 576px) {
  .accessories-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-sidebar {
    flex-direction: column;
  }
}
</style>
