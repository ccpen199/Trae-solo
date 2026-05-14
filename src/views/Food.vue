<template>
  <div class="food-container">
    <van-nav-bar title="美食视频" right-text="">
      <template #right>
        <van-icon name="search" class="search-icon" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <van-popup v-model:show="showSearch" position="top" :style="{ height: '120px' }">
      <div class="search-popup">
        <van-search 
          v-model="searchKeyword" 
          placeholder="搜索美食教程"
          @search="handleSearch"
          show-action
        />
        <div class="hot-search">
          <span class="hot-title">热门搜索</span>
          <span 
            v-for="keyword in hotKeywords" 
            :key="keyword" 
            class="hot-tag"
            @click="searchKeyword = keyword; handleSearch()"
          >
            {{ keyword }}
          </span>
        </div>
      </div>
    </van-popup>

    <div class="video-list">
      <div 
        v-for="(video, index) in sortedVideos" 
        :key="video.id" 
        class="video-card"
        @click="goToVideoDetail(video.id)"
      >
        <div class="video-cover">
          <img :src="video.cover" class="cover-image" />
          <div class="duration-badge">{{ video.duration }}</div>
          <div v-if="video.isNew" class="new-badge">NEW</div>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <div class="video-meta">
            <span class="meta-item">
              <van-icon name="eye-o" />
              {{ formatNumber(video.views) }}
            </span>
            <span class="meta-item like-item" :class="{ liked: likedVideos.includes(video.id) }">
              <van-icon name="heart-o" />
              {{ formatNumber(video.likes + (likedVideos.includes(video.id) ? 1 : 0)) }}
            </span>
          </div>
        </div>
        <van-button 
          class="like-btn" 
          :class="{ liked: likedVideos.includes(video.id) }"
          @click.stop="toggleLike(video)"
        >
          <van-icon name="heart" />
        </van-button>
      </div>
    </div>

    <van-tabbar v-model="activeTab" active-color="#ff6b35" inactive-color="#999">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="play-circle-o" to="/food">美食</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/cart" :badge="appStore.cartCount() > 0 ? appStore.cartCount() : 0">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { videos } from '@/data/mockData'

const router = useRouter()
const appStore = useAppStore()

const showSearch = ref(false)
const searchKeyword = ref('')
const activeTab = ref(1)
const likedVideos = ref([])

const hotKeywords = ['番茄炒蛋', '红烧肉', '清蒸鱼', '家常菜']

const sortedVideos = computed(() => {
  const newVideos = videos.filter(v => v.isNew)
  const otherVideos = videos.filter(v => !v.isNew).sort((a, b) => b.likes - a.likes)
  return [...newVideos, ...otherVideos]
})

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const handleSearch = () => {
  showSearch.value = false
}

const goToVideoDetail = (id) => {
  router.push(`/video-detail/${id}`)
}

const toggleLike = (video) => {
  const index = likedVideos.value.indexOf(video.id)
  if (index > -1) {
    likedVideos.value.splice(index, 1)
  } else {
    likedVideos.value.push(video.id)
  }
}
</script>

<style scoped>
.food-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.search-icon {
  font-size: 20px;
  color: #666;
}

.search-popup {
  padding: 16px;
}

.hot-search {
  margin-top: 12px;
}

.hot-title {
  font-size: 12px;
  color: #999;
  margin-right: 8px;
}

.hot-tag {
  display: inline-block;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
  margin-right: 8px;
  margin-bottom: 8px;
}

.video-list {
  padding: 16px;
  padding-bottom: 100px;
}

.video-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  display: flex;
}

.video-cover {
  position: relative;
  width: 140px;
  height: 100px;
  flex-shrink: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.new-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff6b35;
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.video-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta {
  margin-top: auto;
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.meta-item van-icon {
  margin-right: 4px;
}

.like-item.liked {
  color: #ee0a24;
}

.like-btn {
  width: 50px;
  background: transparent;
  border: none;
  color: #999;
  flex-direction: column;
  justify-content: center;
}

.like-btn.liked {
  color: #ee0a24;
}
</style>
