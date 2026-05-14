<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1>探索当地，发现精彩</h1>
        <p>美团民宿活动，带你体验不一样的旅行</p>
        <router-link to="/activities" class="explore-btn">立即探索</router-link>
      </div>
    </section>

    <section class="categories">
      <div class="container">
        <h2>活动分类</h2>
        <div class="category-grid">
          <div 
            v-for="category in categories" 
            :key="category.id" 
            class="category-card"
            @click="goToActivities(category.id)"
          >
            <div class="category-icon">{{ category.icon }}</div>
            <span class="category-name">{{ category.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <h2>为什么选择我们</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">🌍</div>
            <h3>本地体验</h3>
            <p>深入当地生活，感受独特文化</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <h3>丰富活动</h3>
            <p>艺术、美食、技能，应有尽有</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">✨</div>
            <h3>精选品质</h3>
            <p>严格筛选，保证体验质量</p>
          </div>
        </div>
      </div>
    </section>

    <section class="recommend">
      <div class="container">
        <div class="section-header">
          <h2>热门推荐</h2>
          <router-link to="/activities" class="view-more">查看更多 →</router-link>
        </div>
        <div class="activity-list">
          <div 
            v-for="activity in activities" 
            :key="activity.id" 
            class="activity-card"
            @click="goToDetail(activity.id)"
          >
            <div class="activity-image">
              <img :src="activity.images[0] || '/placeholder.jpg'" :alt="activity.name" />
            </div>
            <div class="activity-info">
              <h3>{{ activity.name }}</h3>
              <div class="activity-meta">
                <span>{{ activity.city }}</span>
                <span>{{ activity.type }}</span>
              </div>
              <div class="activity-footer">
                <span class="price">{{ activity.is_free ? '免费' : `¥${activity.price}` }}</span>
                <span class="rating">⭐ {{ activity.rating }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { activityAPI } from '../api'

const router = useRouter()
const activities = ref([])

const categories = [
  { id: 'hot', name: '热门活动', icon: '🔥' },
  { id: 'local', name: '体验当地', icon: '📍' },
  { id: 'art', name: '艺术之旅', icon: '🎨' },
  { id: 'limited', name: '限定活动', icon: '🎯' },
  { id: 'skill', name: 'Get新技能', icon: '💡' },
  { id: 'personalized', name: '个性化', icon: '🌟' }
]

onMounted(async () => {
  try {
    const res = await activityAPI.getActivities({ page: 1, per_page: 6 })
    activities.value = res.data.activities
  } catch (error) {
    console.error('获取活动失败:', error)
  }
})

const goToActivities = (type) => {
  router.push(`/activities?type=${type}`)
}

const goToDetail = (id) => {
  router.push(`/activities/${id}`)
}
</script>

<style scoped>
.home {
  padding-bottom: 80px;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 100px 20px;
}

.hero-content h1 {
  font-size: 48px;
  margin-bottom: 20px;
}

.hero-content p {
  font-size: 20px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.explore-btn {
  background: white;
  color: #667eea;
  padding: 15px 40px;
  border-radius: 30px;
  text-decoration: none;
  font-size: 18px;
  font-weight: bold;
  display: inline-block;
  transition: transform 0.3s;
}

.explore-btn:hover {
  transform: scale(1.05);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.categories h2, .features h2, .recommend h2 {
  text-align: center;
  font-size: 32px;
  margin-bottom: 30px;
  color: #333;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.category-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.category-card:hover {
  background: #ffe4e1;
  transform: translateY(-5px);
}

.category-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.category-name {
  font-size: 14px;
  color: #333;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.feature-card {
  text-align: center;
  padding: 30px;
}

.feature-icon {
  font-size: 50px;
  margin-bottom: 15px;
}

.feature-card h3 {
  font-size: 20px;
  margin-bottom: 10px;
  color: #333;
}

.feature-card p {
  color: #666;
  font-size: 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.view-more {
  color: #FF6B6B;
  text-decoration: none;
  font-size: 14px;
}

.activity-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.activity-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.3s;
}

.activity-card:hover {
  transform: translateY(-5px);
}

.activity-image img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.activity-info {
  padding: 15px;
}

.activity-info h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.activity-meta span {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 3px 8px;
  border-radius: 4px;
}

.activity-footer {
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
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-list {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero-content h1 {
    font-size: 32px;
  }
}
</style>