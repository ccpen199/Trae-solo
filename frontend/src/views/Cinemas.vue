<script setup>
import { ref, onMounted } from 'vue'
import { cinemaApi } from '../api'
import Header from '../components/Header.vue'

const cinemas = ref([])
const loading = ref(false)

async function loadCinemas() {
  loading.value = true
  try {
    const res = await cinemaApi.getCinemas({})
    if (res.code === 0) {
      cinemas.value = res.data.items
    }
  } catch (e) {
    console.error('加载影院失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCinemas()
})
</script>

<template>
  <div class="cinemas-page">
    <Header />
    
    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">影院列表</h1>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <div>加载中...</div>
      </div>
      
      <div v-else class="cinemas-list">
        <router-link 
          v-for="cinema in cinemas" 
          :key="cinema.id" 
          :to="`/cinemas/${cinema.id}`"
          class="cinema-card"
        >
          <div class="cinema-info">
            <h3 class="cinema-name">{{ cinema.name }}</h3>
            <p class="cinema-address">{{ cinema.address }}</p>
            <div class="cinema-meta">
              <span v-if="cinema.phone" class="meta-tag">📞 {{ cinema.phone }}</span>
              <span v-if="cinema.business_hours" class="meta-tag">🕐 {{ cinema.business_hours }}</span>
            </div>
          </div>
          <div class="cinema-arrow">→</div>
        </router-link>
      </div>
      
      <div v-if="!loading && cinemas.length === 0" class="empty-state">
        暂无影院数据
      </div>
    </main>
  </div>
</template>

<style scoped>
.cinemas-page {
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
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
}

.cinemas-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cinema-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
}

.cinema-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.cinema-info {
  flex: 1;
}

.cinema-name {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}

.cinema-address {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 12px;
}

.cinema-meta {
  display: flex;
  gap: 16px;
}

.meta-tag {
  font-size: 13px;
  color: var(--text-light);
}

.cinema-arrow {
  color: var(--text-light);
  font-size: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-light);
}
</style>
