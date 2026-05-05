<template>
  <div class="search-page">
    <van-sticky>
      <div class="search-header">
        <van-search
          v-model="keyword"
          placeholder="搜索家具、品牌、风格"
          :show-action="true"
          @search="onSearch"
          @cancel="goBack"
        />
      </div>
    </van-sticky>
    
    <div class="search-content" v-if="!showResult">
      <div class="search-type-selector">
        <div 
          class="search-type" 
          :class="{ active: searchType === 'keyword' }"
          @click="searchType = 'keyword'"
        >
          <van-icon name="search" size="24" :color="searchType === 'keyword' ? '#667eea' : '#999'" />
          <span :class="{ active: searchType === 'keyword' }">关键词搜索</span>
        </div>
        <div 
          class="search-type" 
          :class="{ active: searchType === 'image' }"
          @click="searchType = 'image'"
        >
          <van-icon name="photograph" size="24" :color="searchType === 'image' ? '#667eea' : '#999'" />
          <span :class="{ active: searchType === 'image' }">图片识别</span>
        </div>
      </div>
      
      <template v-if="searchType === 'keyword'">
        <div class="search-section" v-if="historyList.length > 0">
          <div class="section-header">
            <span class="section-title">搜索历史</span>
            <van-icon name="delete" size="16" color="#999" @click="clearHistory" />
          </div>
          <div class="tag-list">
            <van-tag 
              v-for="item in historyList" 
              :key="item"
              plain
              class="history-tag"
              @click="onHistoryClick(item)"
            >
              {{ item }}
            </van-tag>
          </div>
        </div>
        
        <div class="search-section">
          <div class="section-header">
            <span class="section-title">热门搜索</span>
          </div>
          <div class="tag-list">
            <van-tag 
              v-for="item in hotSearchList" 
              :key="item"
              type="primary"
              plain
              class="hot-tag"
              @click="onHotSearchClick(item)"
            >
              {{ item }}
            </van-tag>
          </div>
        </div>
        
        <div class="search-section">
          <div class="section-header">
            <span class="section-title">分类筛选</span>
          </div>
          <van-grid :column-num="4" class="category-grid">
            <van-grid-item 
              v-for="category in categoryList" 
              :key="category.name"
              @click="goToCategory(category.name)"
            >
              <div class="category-item">
                <div class="category-icon" :style="{ background: category.color }">
                  <van-icon :name="category.icon" size="20" color="#fff" />
                </div>
                <span class="category-name">{{ category.name }}</span>
              </div>
            </van-grid-item>
          </van-grid>
        </div>
      </template>
      
      <template v-else>
        <div class="image-search-section">
          <van-uploader
            v-model="uploadedImages"
            :max-count="1"
            :after-read="afterRead"
            accept="image/*"
          >
            <div class="upload-area">
              <van-icon name="photograph" size="48" color="#667eea" />
              <div class="upload-text">
                <p class="upload-title">上传图片或拍照</p>
                <p class="upload-desc">系统将识别家具并返回相似商品</p>
              </div>
            </div>
          </van-uploader>
          
          <div class="search-tips">
            <div class="tip-item">
              <van-icon name="passed" size="14" color="#43e97b" />
              <span>框选家具范围，识别更准确</span>
            </div>
            <div class="tip-item">
              <van-icon name="passed" size="14" color="#43e97b" />
              <span>支持沙发、床、桌椅等多种家具</span>
            </div>
            <div class="tip-item">
              <van-icon name="passed" size="14" color="#43e97b" />
              <span>可继续用标签细化搜索结果</span>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <div class="search-result" v-else>
      <van-tabs v-model:active="activeTab" sticky>
        <van-tab title="家具">
          <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <van-list
              v-model:loading="loading"
              :finished="finished"
              finished-text="没有更多了"
              @load="onLoad"
            >
              <div class="result-list">
                <van-card
                  v-for="item in resultList"
                  :key="item.id"
                  :thumb="item.images?.[0]"
                  :title="item.name"
                  :desc="item.brand"
                  :price="item.price"
                  :origin-price="item.original_price"
                  class="result-card"
                  @click="goToDetail(item)"
                >
                  <template #num>
                    <van-rate :model-value="item.rating" readonly size="12" color="#ffd21e" />
                    <span class="review-count">({{ item.review_count }})</span>
                  </template>
                  <template #tags>
                    <van-tag plain type="primary" size="small">{{ item.style }}</van-tag>
                    <van-tag plain type="success" size="small">{{ item.space_type }}</van-tag>
                  </template>
                </van-card>
              </div>
            </van-list>
          </van-pull-refresh>
        </van-tab>
        
        <van-tab title="攻略">
          <div class="article-list">
            <div 
              v-for="item in articleResultList" 
              :key="item.id" 
              class="article-item"
              @click="goToArticle(item)"
            >
              <div class="article-image">
                <img :src="item.cover_image" alt="cover" />
              </div>
              <div class="article-info">
                <h4 class="article-title">{{ item.title }}</h4>
                <div class="article-meta">
                  <span class="author">{{ item.author_name }}</span>
                  <van-tag type="primary" size="small">{{ item.category }}</van-tag>
                </div>
              </div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
    
    <van-popup v-model:show="showFilter" position="right" round>
      <div class="filter-popup">
        <div class="filter-header">
          <span class="filter-title">筛选</span>
          <van-icon name="cross" size="20" @click="showFilter = false" />
        </div>
        
        <div class="filter-section">
          <h4 class="filter-section-title">风格</h4>
          <div class="filter-options">
            <van-tag 
              v-for="item in filters.styles" 
              :key="item"
              :type="selectedFilters.style === item ? 'primary' : 'default'"
              plain
              @click="toggleFilter('style', item)"
            >
              {{ item }}
            </van-tag>
          </div>
        </div>
        
        <div class="filter-section">
          <h4 class="filter-section-title">空间</h4>
          <div class="filter-options">
            <van-tag 
              v-for="item in filters.spaceTypes" 
              :key="item"
              :type="selectedFilters.space_type === item ? 'primary' : 'default'"
              plain
              @click="toggleFilter('space_type', item)"
            >
              {{ item }}
            </van-tag>
          </div>
        </div>
        
        <div class="filter-section">
          <h4 class="filter-section-title">材质</h4>
          <div class="filter-options">
            <van-tag 
              v-for="item in filters.materials" 
              :key="item"
              :type="selectedFilters.material === item ? 'primary' : 'default'"
              plain
              @click="toggleFilter('material', item)"
            >
              {{ item }}
            </van-tag>
          </div>
        </div>
        
        <div class="filter-section">
          <h4 class="filter-section-title">价格区间</h4>
          <van-slider
            v-model="priceRange"
            :min="0"
            :max="10000"
            :step="100"
            active-color="#667eea"
          />
          <div class="price-display">
            <span>¥{{ priceRange[0] }}</span>
            <span>¥{{ priceRange[1] }}</span>
          </div>
        </div>
        
        <div class="filter-actions">
          <van-button type="default" block @click="resetFilter">重置</van-button>
          <van-button type="primary" block @click="applyFilter">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFurnitureList, getFurnitureFilters, imageSearch } from '@/api/furniture'
import { getArticleList } from '@/api/content'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()

const keyword = ref('')
const searchType = ref('keyword')
const showResult = ref(false)
const activeTab = ref(0)
const showFilter = ref(false)

const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = 10

const uploadedImages = ref([])

const historyList = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
const hotSearchList = ref([
  '北欧沙发', '实木餐桌', '简约衣柜', '轻奢茶几',
  '日式榻榻米', '真皮沙发', '儿童床', '智能书桌'
])

const categoryList = ref([
  { name: '沙发', icon: 'chat', color: '#667eea' },
  { name: '床', icon: 'manager', color: '#f093fb' },
  { name: '餐桌', icon: 'friends', color: '#4facfe' },
  { name: '柜子', icon: 'shopping-cart-o', color: '#43e97b' },
  { name: '茶几', icon: 'apps-o', color: '#fa709a' },
  { name: '书桌', icon: 'edit', color: '#fee140' },
  { name: '椅子', icon: 'contact', color: '#30cfd0' },
  { name: '更多', icon: 'ellipsis', color: '#999' }
])

const resultList = ref([])
const articleResultList = ref([])

const filters = reactive({
  categories: [],
  styles: [],
  spaceTypes: [],
  materials: [],
  brands: []
})

const selectedFilters = reactive({
  category: '',
  style: '',
  space_type: '',
  material: '',
  brand: ''
})

const priceRange = ref([0, 10000])

const loadFilters = async () => {
  try {
    const res = await getFurnitureFilters()
    if (res.success) {
      filters.categories = res.data.categories || []
      filters.styles = res.data.styles || []
      filters.spaceTypes = res.data.spaceTypes || []
      filters.materials = res.data.materials || []
      filters.brands = res.data.brands || []
    }
  } catch (error) {
    console.error('加载筛选条件失败:', error)
  }
}

const onSearch = async (value) => {
  if (!value.trim()) {
    showToast('请输入搜索关键词')
    return
  }
  
  keyword.value = value
  showResult.value = true
  page.value = 1
  finished.value = false
  resultList.value = []
  
  addToHistory(value)
  await loadResults()
}

const addToHistory = (value) => {
  const index = historyList.value.indexOf(value)
  if (index > -1) {
    historyList.value.splice(index, 1)
  }
  historyList.value.unshift(value)
  
  if (historyList.value.length > 10) {
    historyList.value = historyList.value.slice(0, 10)
  }
  
  localStorage.setItem('searchHistory', JSON.stringify(historyList.value))
}

const clearHistory = () => {
  historyList.value = []
  localStorage.removeItem('searchHistory')
}

const onHistoryClick = (item) => {
  keyword.value = item
  onSearch(item)
}

const onHotSearchClick = (item) => {
  keyword.value = item
  onSearch(item)
}

const goToCategory = (categoryName) => {
  selectedFilters.category = categoryName
  router.push({
    path: '/search-result',
    query: { category: categoryName }
  })
}

const afterRead = async (file) => {
  const formData = new FormData()
  formData.append('image', file.file)
  
  try {
    const res = await imageSearch(formData)
    if (res.success) {
      resultList.value = res.data.similarItems || []
      showResult.value = true
    }
  } catch (error) {
    console.error('图片搜索失败:', error)
  }
}

const loadResults = async () => {
  const params = {
    page: page.value,
    page_size: pageSize,
    keyword: keyword.value,
    ...selectedFilters,
    min_price: priceRange.value[0],
    max_price: priceRange.value[1]
  }
  
  try {
    const [furnitureRes, articleRes] = await Promise.all([
      getFurnitureList(params),
      getArticleList({ keyword: keyword.value, page: 1, page_size: 10 })
    ])
    
    if (furnitureRes.success) {
      if (page.value === 1) {
        resultList.value = furnitureRes.data.list
      } else {
        resultList.value.push(...furnitureRes.data.list)
      }
      
      if (furnitureRes.data.list.length < pageSize) {
        finished.value = true
      }
    }
    
    if (articleRes.success) {
      articleResultList.value = articleRes.data.list
    }
  } catch (error) {
    console.error('加载搜索结果失败:', error)
  }
}

const onLoad = async () => {
  page.value++
  await loadResults()
  loading.value = false
}

const onRefresh = async () => {
  page.value = 1
  finished.value = false
  await loadResults()
  refreshing.value = false
}

const toggleFilter = (key, value) => {
  if (selectedFilters[key] === value) {
    selectedFilters[key] = ''
  } else {
    selectedFilters[key] = value
  }
}

const resetFilter = () => {
  selectedFilters.category = ''
  selectedFilters.style = ''
  selectedFilters.space_type = ''
  selectedFilters.material = ''
  selectedFilters.brand = ''
  priceRange.value = [0, 10000]
}

const applyFilter = () => {
  showFilter.value = false
  page.value = 1
  finished.value = false
  loadResults()
}

const goBack = () => {
  if (showResult.value) {
    showResult.value = false
    keyword.value = ''
  } else {
    router.back()
  }
}

const goToDetail = (item) => {
  router.push(`/furniture/${item.id}`)
}

const goToArticle = (item) => {
  router.push(`/article/${item.id}`)
}

onMounted(() => {
  loadFilters()
  
  if (route.query.category) {
    selectedFilters.category = route.query.category
    keyword.value = route.query.category
    showResult.value = true
    loadResults()
  }
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-header {
  background: #fff;
  padding: 10px 16px;
}

:deep(.van-search) {
  padding: 0;
}

:deep(.van-search__content) {
  background: #f5f5f5;
  border-radius: 20px;
}

.search-type-selector {
  display: flex;
  background: #fff;
  padding: 16px;
  margin-bottom: 10px;
  gap: 20px;
}

.search-type {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid transparent;
}

.search-type.active {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.search-type span {
  font-size: 14px;
  color: #666;
}

.search-type span.active {
  color: #667eea;
  font-weight: 500;
}

.search-section {
  background: #fff;
  margin-bottom: 10px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag, .hot-tag {
  margin: 0;
  padding: 6px 12px;
}

.category-grid {
  background: transparent;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-name {
  font-size: 12px;
  color: #333;
}

.image-search-section {
  padding: 20px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 12px;
}

.upload-text {
  text-align: center;
  margin-top: 16px;
}

.upload-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 6px;
}

.upload-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.search-tips {
  margin-top: 24px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  font-size: 14px;
  color: #666;
}

.search-result {
  background: #f5f5f5;
}

:deep(.van-tabs__wrap) {
  background: #fff;
}

:deep(.van-tab--active) {
  color: #667eea;
}

:deep(.van-tabs__line) {
  background: #667eea;
}

.result-list {
  padding: 10px;
}

.result-card {
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.article-list {
  padding: 10px;
}

.article-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
}

.article-image {
  width: 100px;
  height: 75px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.article-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author {
  font-size: 12px;
  color: #666;
}

.filter-popup {
  width: 80%;
  height: 100%;
  background: #fff;
  padding: 16px;
  overflow-y: auto;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.filter-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.filter-section {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}

.filter-section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.price-display {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 13px;
  color: #666;
}

.filter-actions {
  display: flex;
  gap: 12px;
  padding: 20px 0;
}

:deep(.van-uploader) {
  width: 100%;
}

:deep(.van-uploader__upload) {
  width: 100%;
  height: 100%;
  margin: 0;
}
</style>
