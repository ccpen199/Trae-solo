<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { movieApi } from '../api'
import Header from '../components/Header.vue'

const route = useRoute()
const movie = ref(null)
const loading = ref(false)

async function loadMovie() {
  loading.value = true
  try {
    const res = await movieApi.getMovie(route.params.id)
    if (res.code === 0) {
      movie.value = res.data
    }
  } catch (e) {
    console.error('加载电影详情失败', e)
  } finally {
    loading.value = false
  }
}

function buyTicket() {
  alert(`即将为您跳转选座页面！\n\n电影：${movie.value.title}\n\n（演示功能，实际购票请先选择影院和场次）`)
}

onMounted(() => {
  loadMovie()
})
</script>

<template>
  <div class="movie-detail-page">
    <Header />
    
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <div>加载中...</div>
    </div>
    
    <div v-else-if="movie" class="movie-detail">
      <div class="movie-backdrop" :style="{ backgroundImage: `url(${movie.backdrop || movie.poster})` }">
        <div class="backdrop-overlay"></div>
        <div class="movie-header-content">
          <img :src="movie.poster" :alt="movie.title" class="detail-poster" />
          <div class="movie-basic-info">
            <h1 class="detail-title">{{ movie.title }}</h1>
            <p v-if="movie.original_title" class="original-title">{{ movie.original_title }}</p>
            <div class="rating-section" v-if="movie.rating > 0">
              <span class="rating-score">{{ movie.rating }}</span>
              <span class="rating-count">{{ movie.rating_count }} 人评价</span>
            </div>
            <div class="movie-meta">
              <div class="meta-item">
                <span class="meta-label">类型：</span>
                <span class="meta-value">{{ movie.genres }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">上映日期：</span>
                <span class="meta-value">{{ movie.release_date }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">片长：</span>
                <span class="meta-value">{{ movie.duration }} 分钟</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">国家：</span>
                <span class="meta-value">{{ movie.country }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">语言：</span>
                <span class="meta-value">{{ movie.language }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">导演：</span>
                <span class="meta-value">{{ movie.director }}</span>
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn btn-primary" @click="buyTicket">立即购票</button>
            </div>
          </div>
        </div>
      </div>
      
      <main class="detail-content">
        <div class="section">
          <h2 class="section-title">剧情简介</h2>
          <p class="synopsis">{{ movie.synopsis }}</p>
        </div>
        
        <div v-if="movie.cast" class="section">
          <h2 class="section-title">演职人员</h2>
          <p class="cast-list">{{ movie.cast }}</p>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.movie-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.movie-backdrop {
  position: relative;
  height: 420px;
  background-size: cover;
  background-position: center;
}

.backdrop-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.4));
}

.movie-header-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 16px;
  display: flex;
  gap: 32px;
  color: white;
}

.detail-poster {
  width: 260px;
  height: 370px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.movie-basic-info {
  flex: 1;
}

.detail-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.original-title {
  font-size: 16px;
  opacity: 0.7;
  margin-bottom: 20px;
}

.rating-section {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}

.rating-score {
  font-size: 36px;
  font-weight: 700;
  color: #ff9500;
}

.rating-count {
  font-size: 14px;
  opacity: 0.8;
}

.movie-meta {
  margin-bottom: 32px;
}

.meta-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.meta-label {
  opacity: 0.7;
}

.meta-value {
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons .btn {
  padding: 12px 40px;
  font-size: 16px;
}

.detail-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-color);
}

.synopsis {
  line-height: 1.8;
  color: var(--text-light);
  font-size: 15px;
}

.cast-list {
  line-height: 1.8;
  color: var(--text-light);
  font-size: 15px;
}
</style>
