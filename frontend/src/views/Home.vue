<template>
  <div class="home-page">
    <van-sticky>
      <van-nav-bar title="家居搭配">
        <template #left>
          <van-icon name="location-o" size="20" />
          <span class="location-text">北京</span>
        </template>
        <template #right>
          <van-icon name="bell-o" size="22" class="nav-icon" />
        </template>
      </van-nav-bar>
      
      <div class="search-bar" @click="goToSearch">
        <van-icon name="search" size="16" color="#999" />
        <span class="search-placeholder">搜索家具、风格、攻略</span>
        <div class="search-actions">
          <van-icon name="photograph" size="20" color="#667eea" />
        </div>
      </div>
    </van-sticky>
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <template v-if="bannerList.length > 0">
          <van-swipe 
            class="banner-swipe" 
            :autoplay="3000"
            indicator-color="white"
          >
            <van-swipe-item v-for="item in bannerList" :key="item.id">
              <img :src="item.image" class="banner-image" @click="onBannerClick(item)" />
            </van-swipe-item>
          </van-swipe>
        </template>
        
        <van-grid :column-num="5" class="category-grid">
          <van-grid-item 
            v-for="category in categories" 
            :key="category.name"
            @click="goToCategory(category)"
          >
            <div class="category-icon" :style="{ background: category.color }">
              <van-icon :name="category.icon" size="24" color="#fff" />
            </div>
            <span class="category-name">{{ category.name }}</span>
          </van-grid-item>
        </van-grid>
        
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">热门推荐</h3>
            <van-icon name="arrow" size="16" color="#999" />
          </div>
          
          <div class="furniture-grid">
            <van-card
              v-for="item in furnitureList"
              :key="item.id"
              :thumb="item.images?.[0]"
              :title="item.name"
              :desc="item.brand"
              :price="item.price"
              :origin-price="item.original_price"
              class="furniture-card"
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
        </div>
        
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">精选攻略</h3>
            <van-icon name="arrow" size="16" color="#999" @click="goToArticles" />
          </div>
          
          <div class="article-list">
            <div 
              v-for="item in articleList" 
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
                <div class="article-stats">
                  <span class="stat">
                    <van-icon name="eye-o" size="12" />
                    {{ item.views }}
                  </span>
                  <span class="stat">
                    <van-icon name="like-o" size="12" />
                    {{ item.likes }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section" v-if="spaceList.length > 0">
          <div class="section-header">
            <h3 class="section-title">空间搭配</h3>
            <van-icon name="arrow" size="16" color="#999" />
          </div>
          
          <van-swipe class="space-swipe" :show-indicators="false">
            <van-swipe-item v-for="item in spaceList" :key="item.id">
              <div class="space-item" @click="goToSpace(item)">
                <img :src="item.images?.[0]" class="space-image" />
                <div class="space-overlay">
                  <h4 class="space-name">{{ item.name }}</h4>
                  <div class="space-tags">
                    <van-tag plain size="small" color="#fff">{{ item.space_type }}</van-tag>
                    <van-tag plain size="small" color="#fff">{{ item.style }}</van-tag>
                  </div>
                </div>
              </div>
            </van-swipe-item>
          </van-swipe>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFurnitureList } from '@/api/furniture'
import { getArticleList } from '@/api/content'

const router = useRouter()

const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = 10

const bannerList = ref([
  {
    id: 1,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20living%20room%20with%20elegant%20furniture%20banner%20style&image_size=landscape_16_9',
    link: '/furniture/1'
  },
  {
    id: 2,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scandinavian%20style%20bedroom%20furniture%20promotion%20banner&image_size=landscape_16_9',
    link: '/articles/1'
  },
  {
    id: 3,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kitchen%20dining%20furniture%20modern%20minimalist%20banner&image_size=landscape_16_9',
    link: '/articles/2'
  }
])

const categories = [
  { name: '沙发', icon: 'chat', color: '#667eea' },
  { name: '床', icon: 'manager', color: '#f093fb' },
  { name: '餐桌', icon: 'friends', color: '#4facfe' },
  { name: '柜子', icon: 'shopping-cart-o', color: '#43e97b' },
  { name: '更多', icon: 'apps-o', color: '#fa709a' }
]

const furnitureList = ref([])
const articleList = ref([])
const spaceList = ref([])

const loadData = async () => {
  try {
    const [furnitureRes, articleRes] = await Promise.all([
      getFurnitureList({ page: page.value, page_size: pageSize }),
      getArticleList({ page: 1, page_size: 3 })
    ])

    if (furnitureRes.success) {
      if (page.value === 1) {
        furnitureList.value = furnitureRes.data.list
      } else {
        furnitureList.value.push(...furnitureRes.data.list)
      }
      
      if (furnitureRes.data.list.length < pageSize) {
        finished.value = true
      }
    }

    if (articleRes.success) {
      articleList.value = articleRes.data.list
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const onLoad = async () => {
  await loadData()
  loading.value = false
  page.value++
}

const onRefresh = async () => {
  page.value = 1
  finished.value = false
  await loadData()
  refreshing.value = false
}

const goToSearch = () => {
  router.push('/search')
}

const goToCategory = (category) => {
  router.push({
    path: '/search-result',
    query: { category: category.name }
  })
}

const goToDetail = (item) => {
  router.push(`/furniture/${item.id}`)
}

const goToArticles = () => {
  router.push('/articles')
}

const goToArticle = (item) => {
  router.push(`/article/${item.id}`)
}

const goToSpace = (item) => {
  // router.push(`/space/${item.id}`)
}

const onBannerClick = (item) => {
  if (item.link) {
    router.push(item.link)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
}

:deep(.van-nav-bar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.van-nav-bar__title) {
  color: #fff;
  font-weight: 600;
}

.location-text {
  color: #fff;
  font-size: 14px;
  margin-left: 4px;
}

.nav-icon {
  color: #fff;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.search-bar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: #f5f5f5;
  border-radius: 20px 20px 0 0;
}

.search-placeholder {
  flex: 1;
  margin-left: 8px;
  font-size: 14px;
  color: #999;
  background: #fff;
  padding: 10px 16px;
  border-radius: 20px;
  position: relative;
  z-index: 1;
}

.search-actions {
  position: absolute;
  right: 28px;
  z-index: 2;
  padding: 10px;
}

.banner-swipe {
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.category-grid {
  margin: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 0;
}

.category-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}

.category-name {
  font-size: 12px;
  color: #333;
}

.section {
  background: #fff;
  margin-bottom: 10px;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.furniture-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.furniture-card {
  margin: 0;
}

:deep(.van-card) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.van-card__thumb) {
  width: 100%;
  height: 140px;
}

:deep(.van-card__content) {
  padding: 12px;
}

:deep(.van-card__title) {
  font-size: 14px;
  -webkit-line-clamp: 2;
  line-height: 1.4;
}

.review-count {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-item {
  display: flex;
  gap: 12px;
}

.article-image {
  width: 120px;
  height: 90px;
  border-radius: 8px;
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

.space-swipe {
  margin: 0 -16px;
}

.space-item {
  position: relative;
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
}

.space-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.space-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  padding: 40px 16px 16px;
}

.space-name {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
}

.space-tags {
  display: flex;
  gap: 8px;
}
</style>
