<template>
  <div class="activity-detail">
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <div class="gallery-section">
        <div class="main-image">
          <img :src="activity.images[0] || 'https://via.placeholder.com/800x500'" :alt="activity.name" />
        </div>
        <div class="thumbnails" v-if="activity.images.length > 1">
          <img 
            v-for="(img, index) in activity.images" 
            :key="index" 
            :src="img" 
            :alt="`${activity.name} ${index + 1}`"
            class="thumbnail"
            :class="{ active: activeImageIndex === index }"
            @click="activeImageIndex = index"
          />
        </div>
      </div>

      <div class="container">
        <div class="content-section">
          <div class="main-info">
            <div class="header">
              <h1>{{ activity.name }}</h1>
              <div class="actions">
                <button 
                  class="action-btn favorite-btn" 
                  :class="{ active: isFavorite }"
                  @click="toggleFavorite"
                >
                  <span>{{ isFavorite ? '❤️' : '🤍' }}</span>
                  <span>{{ isFavorite ? '已收藏' : '收藏' }}</span>
                </button>
                <button class="action-btn share-btn" @click="share">
                  <span>🔗</span>
                  <span>分享</span>
                </button>
              </div>
            </div>

            <div class="basic-info">
              <span class="type">{{ typeName }}</span>
              <span v-if="activity.sub_type" class="sub-type">{{ subTypeName }}</span>
              <span class="city">{{ activity.city }}</span>
              <span class="location">{{ activity.location }}</span>
            </div>

            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-value">⭐ {{ activity.rating }}</span>
                <span class="stat-label">评分</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ activity.review_count }}</span>
                <span class="stat-label">评论</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ activity.duration }}</span>
                <span class="stat-label">时长</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ activity.max_participants }}人</span>
                <span class="stat-label">最多参与</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ activity.language }}</span>
                <span class="stat-label">语言</span>
              </div>
            </div>

            <div class="price-section">
              <span class="price-label">价格</span>
              <span class="price-value">{{ activity.is_free ? '免费' : `¥${activity.price}` }}</span>
              <span v-if="!activity.is_free" class="price-unit">/人</span>
            </div>
          </div>

          <div class="details-section">
            <div class="detail-card">
              <h3>📝 活动简介</h3>
              <p>{{ activity.description }}</p>
            </div>

            <div class="detail-card">
              <h3>🎁 提供物品</h3>
              <ul>
                <li v-for="item in activity.provided_items" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="detail-card">
              <h3>🎒 自备物品</h3>
              <ul>
                <li v-for="item in activity.required_items" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="detail-card">
              <h3>📋 预订须知</h3>
              <p>{{ activity.booking_notes }}</p>
            </div>

            <div v-if="activity.organizer" class="detail-card organizer-card">
              <h3>👤 组织者</h3>
              <div class="organizer-info">
                <img :src="activity.organizer.avatar || 'https://via.placeholder.com/80x80'" class="organizer-avatar" />
                <div class="organizer-detail">
                  <h4>{{ activity.organizer.name }}</h4>
                  <p>{{ activity.organizer.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="reviews-section">
            <h3>💬 用户评论 ({{ activity.review_count }})</h3>
            
            <div v-if="activity.reviews.length === 0" class="empty-reviews">
              <div class="empty-icon">💭</div>
              <p>暂无评论，快来做第一个评价的人吧！</p>
            </div>

            <div v-else class="reviews-list">
              <div v-for="review in activity.reviews" :key="review.id" class="review-item">
                <img :src="review.user_avatar || 'https://via.placeholder.com/50x50'" class="reviewer-avatar" />
                <div class="review-content">
                  <div class="review-header">
                    <span class="reviewer-name">{{ review.user_name }}</span>
                    <span class="review-rating">⭐ {{ review.rating }}</span>
                  </div>
                  <p class="review-text">{{ review.content }}</p>
                  <span class="review-date">{{ formatDate(review.created_at) }}</span>
                </div>
              </div>
            </div>

            <div v-if="isLoggedIn" class="add-review">
              <textarea 
                v-model="reviewContent" 
                placeholder="写下你的评价..."
                class="review-input"
              ></textarea>
              <div class="review-actions">
                <select v-model="reviewRating" class="rating-select">
                  <option :value="1">1星</option>
                  <option :value="2">2星</option>
                  <option :value="3">3星</option>
                  <option :value="4">4星</option>
                  <option :value="5">5星</option>
                </select>
                <button @click="submitReview" class="submit-btn">提交评价</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <div class="contact-info">
          <span>📞 联系客服</span>
        </div>
        <button class="book-btn">立即预订</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { activityAPI } from '../api'

const route = useRoute()
const activity = ref({})
const loading = ref(true)
const error = ref('')
const activeImageIndex = ref(0)
const isFavorite = ref(false)
const isLoggedIn = ref(false)
const reviewContent = ref('')
const reviewRating = ref(5)

const typeName = computed(() => {
  const types = {
    'hot': '热门活动',
    'local': '体验当地',
    'art': '艺术之旅',
    'limited': '限定活动',
    'skill': 'Get新技能',
    'personalized': '个性化'
  }
  return types[activity.value.type] || activity.value.type
})

const subTypeName = computed(() => {
  const subTypes = {
    'guide_tour': '向导旅行计划',
    'food': '美食制作',
    'photography': '摄影跟拍',
    'costume': '传统服饰租赁',
    'traditional': '传统活动',
    'culture': '城市历史名人文化',
    'nature': '自然风光',
    'alternative': '另类探索城市',
    'hidden': '小众去处'
  }
  return subTypes[activity.value.sub_type] || activity.value.sub_type
})

const loadActivity = async () => {
  loading.value = true
  try {
    const res = await activityAPI.getActivity(route.params.id)
    activity.value = res.data
    checkFavorite()
  } catch (err) {
    error.value = '获取活动详情失败，请稍后重试'
    console.error('获取活动失败:', err)
  } finally {
    loading.value = false
  }
}

const checkFavorite = async () => {
  if (!localStorage.getItem('token')) return
  try {
    const res = await activityAPI.getFavorites()
    const favoriteIds = res.data.map(f => f.id)
    isFavorite.value = favoriteIds.includes(activity.value.id)
  } catch (error) {
    console.error('检查收藏失败:', error)
  }
}

const toggleFavorite = async () => {
  if (!localStorage.getItem('token')) {
    alert('请先登录')
    return
  }
  try {
    const res = await activityAPI.toggleFavorite(activity.value.id)
    isFavorite.value = res.data.status === 'added'
    alert(isFavorite.value ? '收藏成功' : '取消收藏')
  } catch (error) {
    alert('网络不佳，收藏失败')
    console.error('收藏失败:', error)
  }
}

const share = () => {
  if (navigator.share) {
    navigator.share({
      title: activity.value.name,
      text: activity.value.description,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    alert('链接已复制到剪贴板')
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const submitReview = async () => {
  if (!reviewContent.value.trim()) {
    alert('请输入评价内容')
    return
  }
  try {
    await activityAPI.addReview(activity.value.id, {
      rating: Number(reviewRating.value),
      content: reviewContent.value
    })
    alert('评价提交成功')
    reviewContent.value = ''
    reviewRating.value = 5
    loadActivity()
  } catch (error) {
    alert('提交评价失败')
    console.error('提交评价失败:', error)
  }
}

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('token')
  loadActivity()
})
</script>

<style scoped>
.activity-detail {
  padding-bottom: 100px;
}

.loading, .error-state {
  text-align: center;
  padding: 100px 20px;
}

.error-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.error-state p {
  color: #999;
  font-size: 16px;
}

.gallery-section {
  background: #333;
}

.main-image img {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
}

.thumbnails {
  display: flex;
  gap: 10px;
  padding: 10px;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 60px;
  object-fit: cover;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.3s;
}

.thumbnail.active, .thumbnail:hover {
  opacity: 1;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.content-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
}

.main-info {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.header h1 {
  font-size: 24px;
  color: #333;
  flex: 1;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

.action-btn:hover {
  background: #f5f5f5;
}

.favorite-btn.active {
  background: #ffe4e1;
  border-color: #FF6B6B;
}

.basic-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.type, .sub-type, .city, .location {
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 20px;
}

.type {
  background: #FF6B6B;
  color: white;
}

.sub-type {
  background: #ffe4e1;
  color: #FF6B6B;
}

.city {
  background: #e3f2fd;
  color: #1976d2;
}

.location {
  background: #f5f5f5;
  color: #666;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 15px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.price-label {
  font-size: 14px;
  color: #999;
}

.price-value {
  font-size: 32px;
  font-weight: bold;
  color: #FF6B6B;
}

.price-unit {
  font-size: 14px;
  color: #999;
}

.details-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.detail-card h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
}

.detail-card p {
  color: #666;
  line-height: 1.8;
}

.detail-card ul {
  list-style: none;
  padding: 0;
}

.detail-card li {
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  color: #666;
}

.detail-card li:last-child {
  border-bottom: none;
}

.organizer-card {
  margin-bottom: 30px;
}

.organizer-info {
  display: flex;
  gap: 15px;
}

.organizer-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.organizer-detail h4 {
  margin-bottom: 5px;
  color: #333;
}

.organizer-detail p {
  font-size: 14px;
}

.reviews-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
}

.reviews-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #333;
}

.empty-reviews {
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.empty-reviews p {
  color: #999;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  display: flex;
  gap: 15px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.review-item:last-child {
  border-bottom: none;
}

.reviewer-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.review-content {
  flex: 1;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reviewer-name {
  font-weight: bold;
  color: #333;
}

.review-rating {
  color: #f39c12;
}

.review-text {
  color: #666;
  line-height: 1.6;
}

.review-date {
  font-size: 12px;
  color: #999;
}

.add-review {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid #eee;
}

.review-input {
  width: 100%;
  height: 100px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 15px;
}

.rating-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.submit-btn {
  background: #FF6B6B;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.contact-info {
  font-size: 14px;
  color: #666;
}

.book-btn {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

@media (max-width: 768px) {
  .content-section {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .basic-info {
    flex-direction: column;
  }
}
</style>