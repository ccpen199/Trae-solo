<template>
  <div class="furniture-detail-page">
    <van-nav-bar 
      title="商品详情" 
      left-arrow 
      @click-left="goBack"
      :fixed="true"
      :placeholder="true"
    >
      <template #right>
        <van-icon name="share-o" size="22" @click="handleShare" style="cursor: pointer" />
      </template>
    </van-nav-bar>
    
    <van-swipe 
      class="detail-swipe" 
      :autoplay="3000"
      indicator-color="white"
      v-if="furniture.images?.length"
    >
      <van-swipe-item v-for="(image, index) in furniture.images" :key="index">
        <img :src="image" class="detail-image" />
      </van-swipe-item>
    </van-swipe>
    
    <div class="detail-info">
      <div class="price-section">
        <span class="current-price">¥{{ furniture.price }}</span>
        <span class="original-price" v-if="furniture.original_price">¥{{ furniture.original_price }}</span>
        <van-tag type="danger" size="small" v-if="furniture.original_price && furniture.original_price > furniture.price">
          {{ Math.round((1 - furniture.price / furniture.original_price) * 100) }}%OFF
        </van-tag>
      </div>
      
      <h2 class="product-name">{{ furniture.name }}</h2>
      
      <div class="product-meta">
        <div class="rating-section">
          <van-rate :model-value="furniture.rating" readonly size="16" color="#ffd21e" />
          <span class="rating-text">{{ furniture.rating }}分</span>
          <span class="review-count">{{ furniture.review_count }}人评价</span>
        </div>
        <div class="favorite-section" @click="toggleFavorite">
          <van-icon 
            :name="furniture.is_favorited ? 'star' : 'star-o'" 
            size="20" 
            :color="furniture.is_favorited ? '#ffd21e' : '#999'"
          />
          <span class="favorite-count">{{ furniture.favorite_count }}</span>
        </div>
      </div>
      
      <van-cell-group inset class="info-group">
        <van-cell title="品牌" :value="furniture.brand" is-link />
        <van-cell title="分类" :value="furniture.category" is-link />
        <van-cell title="风格" :value="furniture.style" is-link />
        <van-cell title="空间" :value="furniture.space_type" is-link />
        <van-cell title="材质" :value="furniture.material" is-link />
        <van-cell title="颜色" :value="furniture.color" is-link />
        <van-cell title="尺寸" :value="furniture.dimensions" is-link />
        <van-cell title="重量" :value="furniture.weight ? `${furniture.weight}kg` : '-'">
          <template #right-icon>
            <van-icon name="arrow" size="16" color="#c8c9cc" />
          </template>
        </van-cell>
      </van-cell-group>
      
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">产品描述</h3>
        </div>
        <p class="description">{{ furniture.description }}</p>
      </div>
      
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">3D模型预览</h3>
          <van-tag type="primary" size="small">VR</van-tag>
        </div>
        <div class="model-preview" @click="goToModel">
          <img :src="furniture.images?.[0]" class="model-image" />
          <div class="model-overlay">
            <van-icon name="eye-o" size="32" color="#fff" />
            <span class="model-text">点击查看3D模型</span>
          </div>
          <van-tag type="primary" round class="model-tag">
            支持单指旋转、双指缩放
          </van-tag>
        </div>
      </div>
      
      <div class="section" v-if="furniture.images?.length > 1">
        <div class="section-header">
          <h3 class="section-title">产品图片</h3>
        </div>
        <div class="image-grid">
          <img 
            v-for="(image, index) in furniture.images.slice(1)" 
            :key="index"
            :src="image" 
            class="grid-image"
          />
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">搭配空间</h3>
          <van-tag plain type="primary" size="small">可筛选</van-tag>
        </div>
        
        <div class="space-filters">
          <van-tag 
            v-for="item in spaceFilters" 
            :key="item"
            :type="activeSpaceFilter === item ? 'primary' : 'default'"
            plain
            @click="activeSpaceFilter = item"
          >
            {{ item }}
          </van-tag>
        </div>
        
        <div class="space-grid">
          <div 
            v-for="item in spaces.slice(0, 4)" 
            :key="item.id" 
            class="space-item"
          >
            <img :src="item.images?.[0]" class="space-image" />
            <div class="space-info">
              <h4 class="space-name">{{ item.name }}</h4>
              <div class="space-tags">
                <van-tag size="small" plain>{{ item.space_type }}</van-tag>
                <van-tag size="small" plain type="primary">{{ item.style }}</van-tag>
              </div>
            </div>
          </div>
        </div>
        
        <div class="space-actions">
          <van-button type="primary" size="small" round @click="openPanorama">
            <van-icon name="scan" size="14" /> 全景模式
          </van-button>
          <van-button type="default" size="small" round @click="openSpaceDetail">
            <van-icon name="info-o" size="14" /> 空间设计详情
          </van-button>
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">买家评价 ({{ commentTotal }})</h3>
          <van-icon name="arrow" size="16" color="#999" />
        </div>
        
        <div class="review-list" v-if="comments.length > 0">
          <div v-for="item in comments" :key="item.id" class="review-item">
            <div class="review-header">
              <div class="user-avatar">
                <img :src="item.user_avatar" alt="avatar" v-if="item.user_avatar" />
                <div class="avatar-placeholder" v-else>{{ item.user_name?.[0] || 'U' }}</div>
              </div>
              <div class="review-user">
                <span class="user-name">{{ item.user_name }}</span>
                <van-rate :model-value="5" readonly size="12" color="#ffd21e" />
              </div>
              <span class="review-date">{{ item.created_at }}</span>
            </div>
            <p class="review-content">{{ item.content }}</p>
          </div>
        </div>
        
        <van-empty description="暂无评价" v-else />
      </div>
      
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">购买渠道</h3>
        </div>
        
        <van-cell-group inset>
          <van-cell title="官方商城" value="¥3999" is-link>
            <template #icon>
              <van-tag type="primary" size="small">推荐</van-tag>
            </template>
          </van-cell>
          <van-cell title="淘宝旗舰店" value="¥4199" is-link />
          <van-cell title="京东自营" value="¥4299" is-link />
        </van-cell-group>
      </div>
    </div>
    
    <div class="goods-action">
      <div class="action-icons">
        <div class="action-icon" @click="handleChat">
          <van-icon name="chat-o" size="20" />
          <span class="icon-text">客服</span>
        </div>
        <div class="action-icon">
          <van-icon name="shop-o" size="20" />
          <span class="icon-text">店铺</span>
        </div>
        <div class="action-icon" @click="toggleFavorite">
          <van-icon :name="furniture.is_favorited ? 'star' : 'star-o'" size="20" :color="furniture.is_favorited ? '#ffd21e' : ''" />
          <span class="icon-text">收藏</span>
        </div>
      </div>
      <div class="action-buttons">
        <div class="action-btn warning" @click="requireLogin">
          加入购物车
        </div>
        <div class="action-btn danger" @click="requireLogin">
          立即购买
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFurnitureDetail } from '@/api/furniture'
import { getComments } from '@/api/content'
import { toggleFavorite as toggleFavoriteApi } from '@/api/interaction'
import { useUserStore } from '@/store/user'
import { showToast, showDialog, Dialog } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const furniture = ref({
  images: []
})
const comments = ref([])
const commentTotal = ref(0)
const activeSpaceFilter = ref('全部')

const spaceFilters = ['全部', '客厅', '卧室', '餐厅', '书房']
const spaces = ref([
  { id: 1, name: '北欧风格客厅', space_type: '客厅', style: '北欧', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20living%20room%20with%20sofa%20minimalist&image_size=landscape_4_3'] },
  { id: 2, name: '现代简约卧室', space_type: '卧室', style: '现代简约', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20bedroom%20elegant&image_size=landscape_4_3'] },
  { id: 3, name: '日式餐厅', space_type: '餐厅', style: '日式', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20dining%20room%20minimalist&image_size=landscape_4_3'] },
  { id: 4, name: '轻奢书房', space_type: '书房', style: '意式轻奢', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20study%20room%20elegant&image_size=landscape_4_3'] }
])

const loadFurnitureDetail = async () => {
  try {
    const id = route.params.id
    const res = await getFurnitureDetail(id)
    if (res.success) {
      furniture.value = res.data
      commentTotal.value = res.data.review_count
    }
  } catch (error) {
    console.error('加载商品详情失败:', error)
  }
}

const loadComments = async () => {
  try {
    const id = route.params.id
    const res = await getComments('furniture', id, { page: 1, page_size: 5 })
    if (res.success) {
      comments.value = res.data.list
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

const goBack = () => {
  router.back()
}

const goToModel = () => {
  router.push(`/furniture-model/${route.params.id}`)
}

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  
  try {
    const res = await toggleFavoriteApi('furniture', furniture.value.id)
    if (res.success) {
      furniture.value.is_favorited = res.data.is_favorited
      if (res.data.is_favorited) {
        furniture.value.favorite_count++
      } else {
        furniture.value.favorite_count--
      }
      showToast(res.data.is_favorited ? '收藏成功' : '已取消收藏')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
  }
}

const handleChat = () => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  showToast('即将跳转客服聊天')
}

const requireLogin = () => {
  showDialog({
    title: '提示',
    message: '登录后才能进行此操作，是否立即登录？',
    confirmButtonText: '去登录',
    cancelButtonText: '取消'
  }).then(() => {
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
  }).catch(() => {
    // 用户取消
  })
}

const handleShare = () => {
  showToast('分享功能开发中...')
}

const openPanorama = () => {
  showToast('全景模式开发中...')
}

const openSpaceDetail = () => {
  showToast('空间设计详情开发中...')
}

onMounted(() => {
  loadFurnitureDetail()
  loadComments()
})
</script>

<style scoped>
.furniture-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
}

.detail-swipe {
  background: #fff;
}

.detail-image {
  width: 100%;
  height: 375px;
  object-fit: cover;
}

.detail-info {
  background: #fff;
  padding-bottom: 20px;
}

.price-section {
  padding: 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  color: #ff4d4f;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.product-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  padding: 0 16px;
  margin: 0 0 12px;
  line-height: 1.5;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-text {
  font-size: 14px;
  color: #ffd21e;
  font-weight: 500;
}

.review-count {
  font-size: 12px;
  color: #999;
}

.favorite-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.favorite-count {
  font-size: 12px;
  color: #666;
}

.info-group {
  margin: 16px;
  border-radius: 8px;
}

:deep(.van-cell__title) {
  font-size: 14px;
  color: #666;
}

:deep(.van-cell__value) {
  font-size: 14px;
  color: #333;
}

.section {
  margin-top: 10px;
  background: #fff;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.description {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}

.model-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.model-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.model-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.model-text {
  color: #fff;
  font-size: 14px;
}

.model-tag {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(102, 126, 234, 0.9);
  border: none;
  color: #fff;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.grid-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.space-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.space-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.space-item {
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
}

.space-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.space-info {
  padding: 8px;
}

.space-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-tags {
  display: flex;
  gap: 4px;
}

.space-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.review-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.review-user {
  flex: 1;
  margin-left: 10px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: block;
}

.review-date {
  font-size: 12px;
  color: #999;
}

.review-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.goods-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid #eee;
  z-index: 100;
}

.action-icons {
  display: flex;
  gap: 16px;
  margin-right: 16px;
}

.action-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #666;
  cursor: pointer;
}

.icon-text {
  font-size: 10px;
}

.action-buttons {
  display: flex;
  flex: 1;
  gap: 8px;
}

.action-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn.warning {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
}

.action-btn.danger {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
