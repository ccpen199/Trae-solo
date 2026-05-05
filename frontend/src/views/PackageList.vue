<template>
  <div class="package-list-page">
    <div class="container">
      <div class="page-header">
        <h1>套餐列表</h1>
        <p class="page-desc">选择适合您的装修套餐，开启美好家居生活</p>
      </div>
      
      <div class="filter-section" v-if="categories.length > 0">
        <div class="filter-item">
          <span class="filter-label">分类：</span>
          <el-radio-group v-model="filters.category" @change="handleFilterChange">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button 
              v-for="cat in categories" 
              :key="cat" 
              :label="cat"
            >{{ cat }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <div class="packages-grid" v-loading="loading">
        <el-empty v-if="packages.length === 0 && !loading" description="暂无套餐" />
        
        <router-link 
          v-for="pkg in packages" 
          :key="pkg.id"
          :to="'/packages/' + pkg.id"
          class="package-card-link"
        >
          <div class="package-card">
            <div class="package-image">
              <el-image 
                :src="pkg.coverImage || 'https://picsum.photos/400/250?random=' + pkg.id"
                fit="cover"
                lazy
              />
              <div class="package-badge" v-if="pkg.category">
                {{ pkg.category }}
              </div>
              <div class="package-status" v-if="pkg.status === 'active'">
                热销中
              </div>
            </div>
            <div class="package-info">
              <h3>{{ pkg.name }}</h3>
              <p class="package-desc">{{ pkg.description || '精选优质建材，打造舒适家居环境' }}</p>
              
              <div class="package-features" v-if="pkg.features && pkg.features.length">
                <el-tag 
                  v-for="(feature, index) in pkg.features.slice(0, 3)" 
                  :key="index"
                  size="small"
                  class="feature-tag"
                >
                  {{ feature }}
                </el-tag>
              </div>
              
              <div class="package-footer">
                <div class="package-price">
                  <span class="currency">¥</span>
                  <span class="amount">{{ pkg.basePrice }}</span>
                  <span class="unit">/㎡ 起</span>
                </div>
                <el-button type="primary" size="small">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </router-link>
      </div>
      
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[8, 12, 20]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { packageApi } from '@/api/package'
import { ElMessage } from 'element-plus'

const route = useRoute()

const loading = ref(false)
const packages = ref([])
const categories = ref([])
const total = ref(0)

const filters = reactive({
  category: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 8
})

const fetchPackages = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      category: filters.category || undefined,
      keyword: filters.keyword || undefined
    }
    
    const result = await packageApi.getList(params)
    packages.value = result.data.list || []
    total.value = result.data.total || 0
    
    if (categories.value.length === 0) {
      const uniqueCats = new Set()
      packages.value.forEach(p => {
        if (p.category) uniqueCats.add(p.category)
      })
      categories.value = Array.from(uniqueCats)
    }
  } catch (error) {
    console.error('获取套餐列表失败:', error)
    ElMessage.error('获取套餐列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  fetchPackages()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchPackages()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchPackages()
}

onMounted(() => {
  fetchPackages()
})
</script>

<style scoped>
.package-list-page {
  padding: 40px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.page-desc {
  color: #666;
  font-size: 16px;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-label {
  color: #606266;
  margin-right: 10px;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.package-card-link {
  text-decoration: none;
  color: inherit;
}

.package-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.package-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.package-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.package-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.package-card:hover .package-image img {
  transform: scale(1.05);
}

.package-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.package-status {
  position: absolute;
  top: 15px;
  right: 15px;
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.package-info {
  padding: 20px;
}

.package-info h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.package-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.package-features {
  margin-bottom: 15px;
}

.feature-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.package-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.package-price {
  display: flex;
  align-items: baseline;
}

.package-price .currency {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.package-price .amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.package-price .unit {
  font-size: 12px;
  color: #999;
  margin-left: 2px;
}

.pagination-wrapper {
  margin-top: 40px;
  text-align: center;
}

@media (max-width: 1200px) {
  .packages-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .packages-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .packages-grid {
    grid-template-columns: 1fr;
  }
}
</style>
