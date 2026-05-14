<template>
  <div class="favorites-page">
    <div class="container">
      <div class="page-header">
        <h1>我的收藏</h1>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="!isLoggedIn" class="not-logged-in">
        <div class="empty-icon">🔒</div>
        <p>请先登录查看收藏</p>
        <router-link to="/login" class="login-link">立即登录</router-link>
      </div>

      <div v-else-if="favorites.length === 0" class="empty-state">
        <div class="empty-icon">💔</div>
        <p>还没有收藏任何活动</p>
        <router-link to="/activities" class="explore-link">去探索活动</router-link>
      </div>

      <div v-else class="favorites-grid">
        <div 
          v-for="activity in favorites" 
          :key="activity.id" 
          class="favorite-card"
          @click="goToDetail(activity.id)"
        >
          <div class="favorite-image">
            <img :src="activity.images[0] || 'https://via.placeholder.com/300x200'" :alt="activity.name" />
            <button class="remove-btn" @click.stop="removeFavorite(activity.id)">✕</button>
          </div>
          <div class="favorite-info">
            <h3>{{ activity.name }}</h3>
            <div class="meta">
              <span>{{ activity.city }}</span>
              <span>{{ activity.type }}</span>
            </div>
            <div class="bottom">
              <span class="price">{{ activity.is_free ? '免费' : `¥${activity.price}` }}</span>
              <span class="rating">⭐ {{ activity.rating }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { activityAPI } from '../api'

const router = useRouter()
const favorites = ref([])
const loading = ref(true)
const isLoggedIn = ref(false)

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await activityAPI.getFavorites()
    favorites.value = res.data
  } catch (error) {
    console.error('获取收藏失败:', error)
    if (error.response?.status === 401) {
      isLoggedIn.value = false
    }
  } finally {
    loading.value = false
  }
}

const removeFavorite = async (id) => {
  try {
    await activityAPI.toggleFavorite(id)
    favorites.value = favorites.value.filter(f => f.id !== id)
    alert('已取消收藏')
  } catch (error) {
    alert('取消收藏失败')
    console.error('取消收藏失败:', error)
  }
}

const goToDetail = (id) => {
  router.push(`/activities/${id}`)
}

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('token')
  if (isLoggedIn.value) {
    loadFavorites()
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.favorites-page {
  padding-bottom: 100px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header h1 {
  font-size: 32px;
  margin-bottom: 30px;
  color: #333;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #999;
}

.not-logged-in, .empty-state {
  text-align: center;
  padding: 100px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.not-logged-in p, .empty-state p {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.login-link, .explore-link {
  display: inline-block;
  background: #FF6B6B;
  color: white;
  padding: 12px 30px;
  border-radius: 30px;
  text-decoration: none;
  font-size: 16px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.favorite-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s;
}

.favorite-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.favorite-image {
  position: relative;
  height: 180px;
}

.favorite-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.favorite-info {
  padding: 15px;
}

.favorite-info h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.meta span {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 3px 8px;
  border-radius: 4px;
}

.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #FF6B6B;
}

.rating {
  font-size: 14px;
  color: #f39c12;
}

@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>