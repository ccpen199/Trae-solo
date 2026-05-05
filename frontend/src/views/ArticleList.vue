<template>
  <div class="article-list-page">
    <el-header class="header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/home')">
          <el-icon :size="28"><ChatDotRound /></el-icon>
          <span>BBS论坛</span>
        </div>
        <div class="header-right">
          <el-button @click="$router.push('/home')">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
        </div>
      </div>
    </el-header>
    
    <el-main class="main">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-card class="filter-card">
            <el-form :inline="true" :model="filterForm">
              <el-form-item label="大类">
                <el-select 
                  v-model="filterForm.categoryId" 
                  placeholder="全部大类" 
                  clearable
                  @change="handleCategoryChange"
                  style="width: 150px"
                >
                  <el-option 
                    v-for="category in categories" 
                    :key="category.id" 
                    :label="category.categoryName" 
                    :value="category.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="小类" v-if="currentCategory?.subCategories?.length">
                <el-select 
                  v-model="filterForm.subCategoryId" 
                  placeholder="全部小类" 
                  clearable
                  style="width: 150px"
                >
                  <el-option 
                    v-for="sub in currentCategory.subCategories" 
                    :key="sub.id" 
                    :label="sub.subCategoryName" 
                    :value="sub.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="搜索">
                <el-input 
                  v-model="filterForm.keyword" 
                  placeholder="搜索标题/内容" 
                  clearable
                  @keyup.enter="loadArticles"
                  style="width: 200px"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="loadArticles">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
          
          <el-card class="list-card" style="margin-top: 20px;">
            <template #header>
              <div class="list-title">
                <span>帖子列表</span>
                <el-button 
                  v-if="userStore.isLoggedIn" 
                  type="primary" 
                  size="small"
                  @click="$router.push('/create')"
                >
                  <el-icon><Edit /></el-icon>
                  发帖
                </el-button>
              </div>
            </template>
            
            <div class="article-list" v-loading="loading">
              <div 
                v-for="article in articles" 
                :key="article.id" 
                class="article-item"
                @click="goToArticle(article.id)"
              >
                <div class="article-left">
                  <el-avatar :size="50" class="author-avatar">
                    {{ article.authorNickname?.charAt(0) || article.authorName?.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="article-right">
                  <div class="article-title">
                    <el-tag v-if="article.isTop" type="danger" effect="light" size="small">置顶</el-tag>
                    <el-tag v-if="article.isLocked" type="warning" effect="light" size="small">锁定</el-tag>
                    <span>{{ article.title }}</span>
                  </div>
                  <div class="article-summary" v-if="article.summary">
                    {{ article.summary }}
                  </div>
                  <div class="article-meta">
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ article.authorNickname || article.authorName }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Collection /></el-icon>
                      {{ article.categoryName }}
                    </span>
                    <span class="meta-item" v-if="article.subCategoryName">
                      <el-icon><Folder /></el-icon>
                      {{ article.subCategoryName }}
                    </span>
                    <span class="meta-item">
                      <el-icon><View /></el-icon>
                      {{ article.viewCount }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      {{ formatTime(article.createdAt) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <el-empty v-if="articles.length === 0" description="暂无帖子" />
            </div>
            
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50]"
                :total="total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadArticles"
                @current-change="loadArticles"
              />
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="side-card">
            <template #header>
              <div class="side-title">
                <el-icon><Menu /></el-icon>
                <span>分类导航</span>
              </div>
            </template>
            <div class="category-list">
              <div 
                class="category-item"
                :class="{ active: !filterForm.categoryId }"
                @click="filterForm.categoryId = null; filterForm.subCategoryId = null; loadArticles()"
              >
                <span class="category-name">全部</span>
              </div>
              <div 
                v-for="category in categories" 
                :key="category.id"
                class="category-item"
                :class="{ active: filterForm.categoryId === category.id }"
                @click="filterForm.categoryId = category.id; filterForm.subCategoryId = null; loadArticles()"
              >
                <span class="category-name">{{ category.categoryName }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getPublicArticles } from '@/api/article'
import { getPublicCategories } from '@/api/category'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const articles = ref([])
const categories = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filterForm = reactive({
  categoryId: null,
  subCategoryId: null,
  keyword: ''
})

const currentCategory = computed(() => {
  if (!filterForm.categoryId) return null
  return categories.value.find(c => c.id === filterForm.categoryId)
})

const loadCategories = async () => {
  try {
    const res = await getPublicCategories()
    categories.value = res.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      current: currentPage.value,
      size: pageSize.value
    }
    if (filterForm.categoryId) params.categoryId = filterForm.categoryId
    if (filterForm.subCategoryId) params.subCategoryId = filterForm.subCategoryId
    if (filterForm.keyword) params.keyword = filterForm.keyword
    
    const res = await getPublicArticles(params)
    articles.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = () => {
  filterForm.subCategoryId = null
  loadArticles()
}

const goToArticle = (id) => {
  router.push(`/articles/${id}`)
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  if (route.query.categoryId) {
    filterForm.categoryId = Number(route.query.categoryId)
  }
  loadCategories()
  loadArticles()
})
</script>

<style scoped>
.article-list-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  height: 60px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.main {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
  flex: 1;
}

.filter-card {
  border-radius: 8px;
}

.list-card, .side-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-list {
  min-height: 300px;
}

.article-item {
  display: flex;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.article-item:hover {
  background-color: #f9f9f9;
}

.article-item:last-child {
  border-bottom: none;
}

.author-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.article-right {
  flex: 1;
}

.article-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.article-summary {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  line-height: 1.6;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.side-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #303133;
}

.category-list {
  max-height: 400px;
  overflow-y: auto;
}

.category-item {
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.category-item:hover {
  background-color: #f5f7fa;
}

.category-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.category-name {
  font-size: 14px;
}
</style>
