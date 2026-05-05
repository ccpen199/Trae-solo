<template>
  <div class="furniture-model-page">
    <van-nav-bar title="3D模型预览" left-arrow @click-left="goBack">
      <template #right>
        <van-icon name="share-o" size="20" />
      </template>
    </van-nav-bar>
    
    <div class="model-container">
      <div class="model-viewer">
        <img :src="furniture.images?.[0]" class="model-image" alt="3D模型" />
        <div class="model-overlay">
          <van-icon name="eye-o" size="48" color="#fff" />
          <p class="model-text">3D模型预览</p>
          <p class="model-tip">单指旋转 · 双指缩放</p>
        </div>
      </div>
    </div>
    
    <div class="model-info">
      <h3 class="model-name">{{ furniture.name }}</h3>
      <div class="model-meta">
        <van-tag type="primary">{{ furniture.category }}</van-tag>
        <van-tag type="success">{{ furniture.style }}</van-tag>
        <van-tag>{{ furniture.space_type }}</van-tag>
      </div>
      
      <div class="model-actions">
        <van-button type="default" round block>
          <van-icon name="scan" size="16" /> 全景模式
        </van-button>
        <van-button type="primary" round block @click="goToDetail">
          查看商品详情
        </van-button>
      </div>
    </div>
    
    <van-goods-action>
      <van-goods-action-icon :icon="isFavorited ? 'star' : 'star-o'" text="收藏" @click="toggleFavorite" />
      <van-goods-action-icon icon="cart-o" text="购物车" @click="requireLogin" />
      <van-goods-action-button type="warning" text="加入购物车" @click="requireLogin" />
      <van-goods-action-button type="danger" text="立即购买" @click="requireLogin" />
    </van-goods-action>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFurnitureDetail } from '@/api/furniture'
import { toggleFavorite as toggleFavoriteApi } from '@/api/interaction'
import { useUserStore } from '@/store/user'
import { showToast, showDialog, Dialog } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const furniture = ref({
  name: '',
  images: [],
  category: '',
  style: '',
  space_type: ''
})
const isFavorited = ref(false)

const loadFurnitureDetail = async () => {
  try {
    const id = route.params.id
    const res = await getFurnitureDetail(id)
    if (res.success) {
      furniture.value = res.data
      isFavorited.value = res.data.is_favorited
    }
  } catch (error) {
    console.error('加载商品详情失败:', error)
  }
}

const goBack = () => {
  router.back()
}

const goToDetail = () => {
  router.push(`/furniture/${route.params.id}`)
}

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  
  try {
    const res = await toggleFavoriteApi('furniture', furniture.value.id)
    if (res.success) {
      isFavorited.value = res.data.is_favorited
      showToast(isFavorited.value ? '收藏成功' : '已取消收藏')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
  }
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
  }).catch(() => {})
}

onMounted(() => {
  loadFurnitureDetail()
})
</script>

<style scoped>
.furniture-model-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
}

.model-container {
  background: #fff;
  padding: 20px;
}

.model-viewer {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
}

.model-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.model-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.model-tip {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0;
}

.model-info {
  background: #fff;
  margin-top: 10px;
  padding: 16px;
}

.model-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.model-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.model-actions {
  display: flex;
  gap: 12px;
}

:deep(.van-goods-action) {
  padding-bottom: env(safe-area-inset-bottom);
}

:deep(.van-goods-action-button--warning) {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
}

:deep(.van-goods-action-button--danger) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
