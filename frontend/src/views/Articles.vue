<template>
  <div class="articles-page">
    <van-nav-bar title="装修攻略">
      <template #right>
        <van-icon name="search" size="20" @click="showSearch = true" />
      </template>
    </van-nav-bar>
    
    <van-tabs v-model:active="activeCategory" sticky>
      <van-tab 
        v-for="(item, index) in categories" 
        :key="item"
        :title="item"
        @click="onCategoryChange(index)"
      />
    </van-tabs>
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
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
              <p class="article-desc" v-if="item.content">{{ stripHtml(item.content) }}</p>
              <div class="article-meta">
                <div class="author-info">
                  <van-avatar :src="item.author_avatar" size="24" />
                  <span class="author-name">{{ item.author_name }}</span>
                </div>
                <div class="article-stats">
                  <span class="stat">
                    <van-icon name="eye-o" size="12" />
                    {{ formatNumber(item.views) }}
                  </span>
                  <span class="stat">
                    <van-icon name="like-o" size="12" />
                    {{ formatNumber(item.likes) }}
                  </span>
                  <span class="stat">
                    <van-icon name="chat-o" size="12" />
                    {{ item.comment_count }}
                  </span>
                </div>
              </div>
              <div class="article-tags" v-if="item.tags?.length">
                <van-tag 
                  v-for="tag in item.tags.slice(0, 3)" 
                  :key="tag"
                  size="small"
                  plain
                  type="primary"
                >
                  {{ tag }}
                </van-tag>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
    
    <van-popup v-model:show="showSearch" position="top" round>
      <div class="search-popup">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索攻略"
          :show-action="true"
          @search="onSearch"
          @cancel="showSearch = false"
        />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getArticleList } from '@/api/content'

const router = useRouter()

const categories = ['全部', '装修攻略', '家具选购', '风格搭配', '避坑指南', '软装设计']
const activeCategory = ref(0)
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = 10
const articleList = ref([])
const showSearch = ref(false)
const searchKeyword = ref('')

const loadArticles = async () => {
  try {
    const params = {
      page: page.value,
      page_size: pageSize
    }
    
    if (categories[activeCategory.value] !== '全部') {
      params.category = categories[activeCategory.value]
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    const res = await getArticleList(params)
    if (res.success) {
      if (page.value === 1) {
        articleList.value = res.data.list
      } else {
        articleList.value.push(...res.data.list)
      }
      
      if (res.data.list.length < pageSize) {
        finished.value = true
      }
    }
  } catch (error) {
    console.error('加载攻略列表失败:', error)
  }
}

const onLoad = async () => {
  page.value++
  await loadArticles()
  loading.value = false
}

const onRefresh = async () => {
  page.value = 1
  finished.value = false
  await loadArticles()
  refreshing.value = false
}

const onCategoryChange = (index) => {
  page.value = 1
  finished.value = false
  articleList.value = []
  loadArticles()
}

const onSearch = (value) => {
  searchKeyword.value = value
  page.value = 1
  finished.value = false
  showSearch.value = false
  loadArticles()
}

const stripHtml = (str) => {
  return str?.replace(/<[^>]*>/g, '').substring(0, 80) + '...' || ''
}

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num
}

const goToArticle = (item) => {
  router.push(`/article/${item.id}`)
}

onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.articles-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
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
  gap: 8px;
}

.article-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-name {
  font-size: 12px;
  color: #666;
}

.article-stats {
  display: flex;
  gap: 12px;
}

.stat {
  font-size: 11px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 2px;
}

.article-tags {
  display: flex;
  gap: 6px;
}

.search-popup {
  padding: 10px 16px;
  background: #fff;
}

:deep(.van-search) {
  padding: 0;
}

:deep(.van-search__content) {
  background: #f5f5f5;
}
</style>
