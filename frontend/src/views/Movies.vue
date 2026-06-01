<script setup>
import { ref, onMounted } from 'vue'
import { movieApi } from '../api'
import Header from '../components/Header.vue'

const activeTab = ref('showing')
const movies = ref([])
const loading = ref(false)

async function loadMovies() {
  loading.value = true
  try {
    const res = await movieApi.getMovies({ status: activeTab.value })
    if (res.code === 0) {
      movies.value = res.data.items.map(item => ({
        ...item,
        posterLoaded: false,
        posterFallback: false
      }))
    }
  } catch (e) {
    console.error('加载电影失败', e)
  } finally {
    loading.value = false
  }
}

function switchTab(tab) {
  activeTab.value = tab
  loadMovies()
}

onMounted(() => {
  loadMovies()
})
</script>

<template>
  <div class="movies-page">
    <Header />
    
    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">{{ activeTab === 'showing' ? '正在热映' : '即将上映' }}</h1>
        <div class="tab-buttons">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'showing' }"
            @click="switchTab('showing')"
          >正在热映</button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'coming' }"
            @click="switchTab('coming')"
          >即将上映</button>
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <div>加载中...</div>
      </div>
      
      <div v-else class="movies-grid">
        <router-link 
          v-for="movie in movies" 
          :key="movie.id" 
          :to="`/movies/${movie.id}`"
          class="movie-card"
        >
          <div class="movie-poster">
            <div class="poster-placeholder" v-if="!movie.posterLoaded">
              <span class="poster-icon">🎬</span>
            </div>
            <img 
              :src="movie.poster" 
              :alt="movie.title" 
              :class="{ 'poster-loaded': movie.posterLoaded }"
              @load="movie.posterLoaded = true"
              @error="movie.posterFallback = true"
              loading="lazy"
            />
            <div v-if="movie.posterFallback" class="poster-fallback">
              <span class="fallback-icon">🎬</span>
              <span class="fallback-title">{{ movie.title }}</span>
            </div>
            <div v-if="movie.rating > 0" class="movie-rating">{{ movie.rating }}</div>
          </div>
          <div class="movie-info">
            <h3 class="movie-title">{{ movie.title }}</h3>
            <p class="movie-genres">{{ movie.genres }}</p>
            <p class="movie-date">{{ movie.release_date }} 上映</p>
          </div>
        </router-link>
      </div>
      
      <div v-if="!loading && movies.length === 0" class="empty-state">
        暂无电影数据
      </div>
    </main>
  </div>
</template>

<style scoped>
.movies-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
}

.tab-buttons {
  display: flex;
  gap: 8px;
  background: white;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-light);
  transition: all 0.3s;
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

.movie-card {
  text-decoration: none;
  color: inherit;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.movie-poster {
  position: relative;
  aspect-ratio: 2/3;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.poster-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.poster-icon {
  font-size: 48px;
  opacity: 0.5;
}

.movie-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.movie-poster img.poster-loaded {
  opacity: 1;
}

.poster-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  z-index: 3;
  padding: 16px;
  text-align: center;
}

.fallback-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.fallback-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.movie-rating {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #ff9500, #ff5e3a);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.movie-info {
  padding: 12px;
}

.movie-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movie-genres {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 4px;
}

.movie-date {
  font-size: 12px;
  color: var(--text-light);
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-light);
}
</style>
