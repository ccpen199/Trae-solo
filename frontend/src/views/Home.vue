<template>
  <div class="home-page page-container">
    <div class="header">
      <div class="search-bar">
        <el-input placeholder="搜索家具、设计师、案例..." class="search-input" />
      </div>
    </div>

    <div v-if="loading" class="loading">
      <el-icon class="loading-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12.01" y2="18"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg></el-icon>
    </div>

    <div v-else-if="error" class="error">
      <p>加载失败，点击重试</p>
      <el-button @click="loadData">重试</el-button>
    </div>

    <div v-else class="content">
      <div class="banner-section">
        <el-carousel :interval="4000" type="card">
          <el-carousel-item v-for="banner in banners" :key="banner.id">
            <div class="banner-item" @click="goLink(banner.link)">
              <img :src="banner.image" :alt="banner.title" />
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

      <div class="coupon-section">
        <div class="section-header">
          <h3>优惠券</h3>
          <span class="more" @click="goCoupons">查看全部</span>
        </div>
        <div class="coupon-list">
          <div 
            v-for="coupon in coupons" 
            :key="coupon.id" 
            class="coupon-item"
            @click="receiveCoupon(coupon.id)"
          >
            <div class="coupon-amount">¥{{ coupon.amount }}</div>
            <div class="coupon-info">
              <div class="coupon-name">{{ coupon.name }}</div>
              <div class="coupon-condition">满{{ coupon.min_amount }}可用</div>
            </div>
            <div class="coupon-btn">
              <span>{{ hasCoupon(coupon.id) ? '已领取' : '领取' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>好生活</h3>
          <span class="more" @click="goPosts">更多</span>
        </div>
        <div class="post-list">
          <div 
            v-for="post in posts" 
            :key="post.id" 
            class="post-card"
            @click="goPostDetail(post.id)"
          >
            <div class="post-images">
              <img :src="getFirstImage(post.images)" alt="" />
            </div>
            <div class="post-info">
              <h4 class="post-title">{{ post.title }}</h4>
              <div class="post-meta">
                <span class="author">{{ post.nickname }}</span>
                <span class="stats">
                  <span><Heart class="icon" />{{ post.likes }}</span>
                  <span><Eye class="icon" />{{ post.views }}</span>
                  <span><MessageCircle class="icon" />{{ post.comments }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>定制案例</h3>
          <span class="more" @click="goCases">更多</span>
        </div>
        <div class="case-list">
          <div 
            v-for="item in cases" 
            :key="item.id" 
            class="case-card"
            @click="goCaseDetail(item.id)"
          >
            <div class="case-image">
              <img :src="getFirstImage(item.images)" alt="" />
            </div>
            <div class="case-info">
              <h4>{{ item.title }}</h4>
              <p class="case-designer">{{ item.real_name }}</p>
              <div class="case-stats">
                <span>{{ item.area }}㎡</span>
                <span>{{ item.style }}</span>
                <span>¥{{ item.budget.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>活动中心</h3>
          <span class="more" @click="goActivities">更多</span>
        </div>
        <div class="activity-list">
          <div 
            v-for="activity in activities" 
            :key="activity.id" 
            class="activity-card"
          >
            <img :src="activity.image" :alt="activity.title" />
            <div class="activity-overlay">
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>推荐设计师</h3>
          <span class="more" @click="goDesigners">更多</span>
        </div>
        <div class="designer-list">
          <div 
            v-for="designer in designers" 
            :key="designer.id" 
            class="designer-card"
            @click="goDesignerDetail(designer.id)"
          >
            <div class="designer-avatar">
              <img :src="designer.avatar || '/default-avatar.png'" :alt="designer.real_name" />
            </div>
            <div class="designer-info">
              <h4>{{ designer.real_name }}</h4>
              <p>{{ designer.experience }}年经验</p>
              <div class="designer-stats">
                <span>作品 {{ designer.works_count }}</span>
                <span>粉丝 {{ designer.followers }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>热销单品</h3>
          <span class="more" @click="goProducts">更多</span>
        </div>
        <div class="product-grid">
          <div 
            v-for="product in products" 
            :key="product.id" 
            class="product-card"
            @click="goProductDetail(product.id)"
          >
            <div class="product-image">
              <img :src="getFirstImage(product.images)" :alt="product.title" />
            </div>
            <div class="product-info">
              <h4 class="product-title">{{ product.title }}</h4>
              <p class="product-style">{{ product.style }}</p>
              <div class="product-price">
                <span class="current-price">¥{{ product.price }}</span>
                <span class="original-price">¥{{ product.original_price }}</span>
              </div>
              <div class="product-sales">销量 {{ product.sales }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, Eye, MessageCircle } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { homeAPI, couponAPI } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElIcon } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const error = ref(false)
const banners = ref([])
const posts = ref([])
const products = ref([])
const activities = ref([])
const designers = ref([])
const coupons = ref([])
const cases = ref([])
const myCoupons = ref([])

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  error.value = false
  try {
    const data = await homeAPI.index()
    banners.value = data.banners || []
    posts.value = data.posts || []
    products.value = data.products || []
    activities.value = data.activities || []
    designers.value = data.designers || []
    coupons.value = data.coupons || []
    cases.value = data.cases || []
    
    if (userStore.isLoggedIn) {
      try {
        myCoupons.value = await couponAPI.mine()
      } catch {}
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function getFirstImage(imagesStr) {
  try {
    const images = JSON.parse(imagesStr)
    return images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2ZmZiI+PC9yZWN0Pjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZ1cm5pdHVyZTwvdGV4dD48L3N2Zz4='
  } catch {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2ZmZiI+PC9yZWN0Pjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZ1cm5pdHVyZTwvdGV4dD48L3N2Zz4='
  }
}

function hasCoupon(couponId) {
  return myCoupons.value.some(c => c.coupon_id === couponId)
}

async function receiveCoupon(id) {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (hasCoupon(id)) {
    ElMessage.info('已领取')
    return
  }
  try {
    console.log('领取优惠券 ID:', id)
    await couponAPI.receive(id)
    myCoupons.value.push({ coupon_id: id })
    ElMessage.success('领取成功')
  } catch (error) {
    console.error('领取优惠券失败:', error)
    ElMessage.error('领取失败')
  }
}

function goLink(link) {
  if (link) {
    router.push(link)
  }
}

function goPosts() { router.push('/posts') }
function goCases() { router.push('/cases') }
function goDesigners() { router.push('/designers') }
function goProducts() { router.push('/products') }
function goCoupons() { router.push('/coupons') }
function goActivities() { router.push('/activities') }
function goPostDetail(id) { router.push(`/post/${id}`) }
function goCaseDetail(id) { router.push(`/case/${id}`) }
function goDesignerDetail(id) { router.push(`/designer/${id}`) }
function goProductDetail(id) { router.push(`/product/${id}`) }
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  background: white;
  padding: 12px;
  z-index: 99;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.search-bar {
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  border-radius: 25px;
  background: #f5f5f5;
  border: none;
}

.content {
  padding: 12px;
}

.section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.more {
  font-size: 13px;
  color: #999;
}

.banner-section {
  margin-bottom: 16px;
}

.banner-item {
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
}

.banner-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.coupon-section {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.coupon-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.coupon-item {
  flex-shrink: 0;
  background: white;
  border-radius: 8px;
  padding: 12px;
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coupon-amount {
  font-size: 24px;
  font-weight: 700;
  color: #f59e0b;
}

.coupon-name {
  font-size: 13px;
  font-weight: 500;
}

.coupon-condition {
  font-size: 11px;
  color: #999;
}

.coupon-btn {
  background: #f59e0b;
  color: white;
  text-align: center;
  padding: 4px;
  border-radius: 4px;
  font-size: 12px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.post-images {
  height: 180px;
}

.post-images img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-info {
  padding: 12px;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author {
  font-size: 12px;
  color: #666;
}

.stats {
  display: flex;
  gap: 16px;
}

.stats span {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon {
  width: 14px;
  height: 14px;
}

.case-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.case-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.case-image {
  height: 120px;
}

.case-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.case-info {
  padding: 10px;
}

.case-info h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.case-designer {
  font-size: 11px;
  color: #999;
  margin: 0 0 6px 0;
}

.case-stats {
  display: flex;
  gap: 8px;
}

.case-stats span {
  font-size: 10px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.activity-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.activity-card {
  position: relative;
  height: 140px;
  border-radius: 12px;
  overflow: hidden;
}

.activity-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  padding: 12px;
  color: white;
}

.activity-overlay h4 {
  font-size: 13px;
  margin: 0 0 4px 0;
}

.activity-overlay p {
  font-size: 11px;
  margin: 0;
  opacity: 0.9;
}

.designer-list {
  display: flex;
  gap: 16px;
  overflow-x: auto;
}

.designer-card {
  flex-shrink: 0;
  width: 120px;
  text-align: center;
}

.designer-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 8px;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f5f5;
}

.designer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.designer-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.designer-info p {
  font-size: 11px;
  color: #999;
  margin: 0 0 6px 0;
}

.designer-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.designer-stats span {
  font-size: 11px;
  color: #666;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.product-image {
  height: 160px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 10px;
}

.product-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-style {
  font-size: 11px;
  color: #999;
  margin: 0 0 6px 0;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.current-price {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
}

.original-price {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}

.product-sales {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-icon {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error p {
  margin-bottom: 16px;
}
</style>