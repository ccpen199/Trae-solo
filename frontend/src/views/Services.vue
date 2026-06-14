<template>
  <div class="services-page">
    <div class="page-header">
      <h2 class="page-title">生活服务</h2>
      <div class="header-actions">
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="category-card">
          <template #header>
            <span style="font-weight: 600;">服务分类</span>
          </template>
          <el-menu
            :default-active="activeCategory"
            @select="handleCategoryChange"
            background-color="#fff"
            text-color="#303133"
            active-text-color="#409eff"
          >
            <el-menu-item :index="null">
              <el-icon><Menu /></el-icon>
              全部商户
            </el-menu-item>
            <el-sub-menu v-for="cat in categories" :key="cat.id" :index="String(cat.id)">
              <template #title>
                <el-icon><Goods /></el-icon>
                <span>{{ cat.name }}</span>
              </template>
            </el-sub-menu>
          </el-menu>
        </el-card>
        
        <el-card class="filter-card" style="margin-top: 20px;">
          <template #header>
            <span style="font-weight: 600;">筛选条件</span>
          </template>
          <div class="filter-item">
            <div class="filter-label">资质状态</div>
            <el-radio-group v-model="qualificationFilter" @change="loadMerchants">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="verified">已核验</el-radio-button>
              <el-radio-button value="pending">待核验</el-radio-button>
            </el-radio-group>
          </div>
          <div class="filter-item">
            <div class="filter-label">评分排序</div>
            <el-radio-group v-model="ratingSort">
              <el-radio-button value="">默认</el-radio-button>
              <el-radio-button value="desc">评分从高到低</el-radio-button>
              <el-radio-button value="asc">评分从低到高</el-radio-button>
            </el-radio-group>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="18">
        <el-card class="merchants-card" v-loading="loading">
          <div class="merchants-grid">
            <div v-for="merchant in merchants" :key="merchant.id" class="merchant-item" @click="goToDetail(merchant.id)">
              <div class="merchant-header">
                <el-avatar :size="56" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                  {{ merchant.name.charAt(0) }}
                </el-avatar>
                <div class="merchant-info">
                  <div class="merchant-name">
                    {{ merchant.name }}
                    <el-tag v-if="merchant.qualification_status === 'verified'" type="success" size="small" effect="dark">
                      资质已核验
                    </el-tag>
                    <el-tag v-else type="warning" size="small">
                      资质待核验
                    </el-tag>
                  </div>
                  <div class="merchant-meta">
                    <el-rate v-model="merchant.avg_rating || merchant.rating" disabled show-score text-color="#ff9900" size="small" />
                    <span class="review-count">{{ merchant.review_count || 0 }}条评价</span>
                  </div>
                  <div class="merchant-contact">
                    <el-icon><Phone /></el-icon>
                    <span>{{ merchant.contact_phone }}</span>
                    <el-icon style="margin-left: 15px;"><Location /></el-icon>
                    <span>{{ merchant.address }}</span>
                  </div>
                </div>
              </div>
              <div class="merchant-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ merchant.products?.length || 0 }}</span>
                  <span class="stat-label">在售商品</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ merchant.avg_rating || merchant.rating }}</span>
                  <span class="stat-label">综合评分</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ merchant.review_count || 0 }}</span>
                  <span class="stat-label">用户评价</span>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-if="!loading && merchants.length === 0" description="暂无商户数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMerchants, getCategories } from '../api'

const router = useRouter()
const loading = ref(false)
const merchants = ref([])
const categories = ref([])
const activeCategory = ref(null)
const filters = reactive({
  category_id: null,
  qualification_status: ''
})
const qualificationFilter = ref('')
const ratingSort = ref('')

async function loadCategories() {
  const res = await getCategories()
  categories.value = res.data.filter(c => c.parent_id === null)
}

async function loadMerchants() {
  loading.value = true
  try {
    const params = {}
    if (filters.category_id) params.category_id = filters.category_id
    if (qualificationFilter.value) params.qualification_status = qualificationFilter.value
    
    let res = await getMerchants(params)
    let list = res.data
    
    if (ratingSort.value === 'desc') {
      list.sort((a, b) => (b.avg_rating || b.rating) - (a.avg_rating || a.rating))
    } else if (ratingSort.value === 'asc') {
      list.sort((a, b) => (a.avg_rating || a.rating) - (b.avg_rating || b.rating))
    }
    
    merchants.value = list
  } finally {
    loading.value = false
  }
}

function handleCategoryChange(index) {
  filters.category_id = index ? parseInt(index) : null
  activeCategory.value = index
  loadMerchants()
}

function goToDetail(id) {
  router.push(`/services/merchants/${id}`)
}

function loadData() {
  loadCategories()
  loadMerchants()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.services-page {
  padding: 0;
}

.category-card, .filter-card, .merchants-card {
  border: none;
  border-radius: 12px;
}

.filter-item {
  margin-bottom: 20px;
}

.filter-item:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}

.merchants-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.merchant-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.merchant-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.merchant-header {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.merchant-info {
  flex: 1;
}

.merchant-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.merchant-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
}

.review-count {
  font-size: 13px;
  color: #909399;
}

.merchant-contact {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #606266;
}

.merchant-stats {
  display: flex;
  gap: 30px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}
</style>
