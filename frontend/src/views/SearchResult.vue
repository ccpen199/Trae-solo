<template>
  <div class="search-result-page">
    <van-nav-bar title="搜索结果" left-arrow @click-left="goBack">
      <template #right>
        <van-icon name="filter-o" size="20" @click="showFilter = true" />
      </template>
    </van-nav-bar>
    
    <div class="search-header">
      <van-search
        v-model="keyword"
        placeholder="搜索家具、品牌、风格"
        :show-action="true"
        @search="onSearch"
        @cancel="goBack"
      />
    </div>
    
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="家具">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <div class="result-grid">
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
                <template #tags>
                  <van-tag plain type="primary" size="small">{{ item.style }}</van-tag>
                  <van-tag plain type="success" size="small">{{ item.space_type }}</van-tag>
                </template>
              </van-card>
            </div>
            <van-empty description="暂无结果" v-if="!loading && resultList.length === 0" />
          </van-list>
        </van-pull-refresh>
      </van-tab>
      
      <van-tab title="攻略">
        <van-list
          v-model:loading="articleLoading"
          :finished="articleFinished"
          finished-text="没有更多了"
          @load="onArticleLoad"
        >
          <div class="article-list">
            <div 
              v-for="item in articleList" 
              :key="item.id" 
              class="article-item"
              @click="goToArticle(item)"
            >
              <div class="article-image" v-if="item.cover_image">
                <img :src="item.cover_image" alt="cover" />
              </div>
              <div class="article-info">
                <h3 class="article-title">{{ item.title }}</h3>
                <div class="article-meta">
                  <span class="author">{{ item.author_name }}</span>
                  <van-tag type="primary" size="small">{{ item.category }}</van-tag>
                </div>
              </div>
            </div>
          </div>
          <van-empty description="暂无结果" v-if="!articleLoading && articleList.length === 0" />
        </van-list>
      </van-tab>
    </van-tabs>
    
    <van-popup v-model:show="showFilter" position="right" round>
      <div class="filter-popup">
        <div class="filter-header">
          <span class="filter-title">筛选</span>
          <van-icon name="cross" size="20" @click="showFilter = false" />
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFurnitureList } from '@/api/furniture'
import { getArticleList } from '@/api/content'

const router = useRouter()
const route = useRoute()

const keyword = ref(route.query.keyword || route.query.category || '')
const activeTab = ref(0)
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = 10
const resultList = ref([])
const showFilter = ref(false)

const articleLoading = ref(false)
const articleFinished = ref(false)
const articlePage = ref(1)
const articleList = ref([])

const loadResults = async () => {
  try {
    const params = {
      page: page.value,
      page_size: pageSize,
      keyword: keyword.value
    }
    
    if (route.query.category) {
      params.category = route.query.category
    }
    
    const res = await getFurnitureList(params)
    if (res.success) {
      if (page.value === 1) {
        resultList.value = res.data.list
      } else {
        resultList.value.push(...res.data.list)
      }
      
      if (res.data.list.length < pageSize) {
        finished.value = true
      }
    }
  } catch (error) {
    console.error('加载搜索结果失败:', error)
  }
}

const loadArticles = async () => {
  try {
    const res = await getArticleList({
      page: articlePage.value,
      page_size: pageSize,
      keyword: keyword.value
    })
    if (res.success) {
      if (articlePage.value === 1) {
        articleList.value = res.data.list
      } else {
        articleList.value.push(...res.data.list)
      }
      
      if (res.data.list.length < pageSize) {
        articleFinished.value = true
      }
    }
  } catch (error) {
    console.error('加载文章失败:', error)
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

const onArticleLoad = async () => {
  articlePage.value++
  await loadArticles()
  articleLoading.value = false
}

const onSearch = (value) => {
  keyword.value = value
  page.value = 1
  finished.value = false
  resultList.value = []
  loadResults()
}

const resetFilter = () => {
  // 重置筛选条件
}

const applyFilter = () => {
  showFilter.value = false
  page.value = 1
  finished.value = false
  loadResults()
}

const goBack = () => {
  router.back()
}

const goToDetail = (item) => {
  router.push(`/furniture/${item.id}`)
}

const goToArticle = (item) => {
  router.push(`/article/${item.id}`)
}

onMounted(() => {
  loadResults()
})
</script>

<style scoped>
.search-result-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
}

.search-header {
  padding: 10px 16px;
  background: #fff;
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

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 10px;
}

.result-card {
  margin: 0;
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
  width: 120px;
  height: 90px;
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

.filter-actions {
  display: flex;
  gap: 12px;
  padding: 20px 0;
}
</style>
