<template>
  <div class="favorites-page">
    <van-nav-bar title="我的收藏" left-arrow @click-left="goBack" />
    
    <van-tabs v-model:active="activeTab">
      <van-tab title="家具">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div class="furniture-list">
            <van-card
              v-for="item in furnitureList"
              :key="item.id"
              :thumb="item.target_image"
              :title="item.target_name"
              :price="item.target_price"
              class="furniture-card"
              @click="goToFurniture(item.target_id)"
            />
          </div>
          <van-empty description="暂无收藏" v-if="!loading && furnitureList.length === 0" />
        </van-list>
      </van-tab>
      
      <van-tab title="文章">
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
              @click="goToArticle(item.target_id)"
            >
              <div class="article-image" v-if="item.target_image">
                <img :src="item.target_image" alt="cover" />
              </div>
              <div class="article-info">
                <h3 class="article-title">{{ item.target_name }}</h3>
              </div>
            </div>
          </div>
          <van-empty description="暂无收藏" v-if="!articleLoading && articleList.length === 0" />
        </van-list>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFavorites } from '@/api/interaction'

const router = useRouter()

const activeTab = ref(0)
const loading = ref(false)
const finished = ref(false)
const furnitureList = ref([])
const page = ref(1)

const articleLoading = ref(false)
const articleFinished = ref(false)
const articleList = ref([])
const articlePage = ref(1)
const pageSize = 10

const loadFavorites = async (type) => {
  try {
    const res = await getFavorites({
      target_type: type === 'furniture' ? 'furniture' : 'article',
      page: type === 'furniture' ? page.value : articlePage.value,
      page_size: pageSize
    })
    
    if (res.success) {
      const list = res.data.list || []
      if (type === 'furniture') {
        if (page.value === 1) {
          furnitureList.value = list
        } else {
          furnitureList.value.push(...list)
        }
        if (list.length < pageSize) {
          finished.value = true
        }
      } else {
        if (articlePage.value === 1) {
          articleList.value = list
        } else {
          articleList.value.push(...list)
        }
        if (list.length < pageSize) {
          articleFinished.value = true
        }
      }
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error)
  }
}

const onLoad = async () => {
  page.value++
  await loadFavorites('furniture')
  loading.value = false
}

const onArticleLoad = async () => {
  articlePage.value++
  await loadFavorites('article')
  articleLoading.value = false
}

const goBack = () => {
  router.back()
}

const goToFurniture = (id) => {
  router.push(`/furniture/${id}`)
}

const goToArticle = (id) => {
  router.push(`/article/${id}`)
}

onMounted(() => {
  loadFavorites('furniture')
})
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
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

.furniture-list, .article-list {
  padding: 10px;
}

.furniture-card {
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
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
  align-items: center;
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
</style>
