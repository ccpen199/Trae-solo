<template>
  <div class="case-detail-page page-container">
    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else-if="!customCase" class="error">
      <p>案例不存在</p>
    </div>

    <div v-else class="content">
      <div class="case-images">
        <img 
          v-for="(img, index) in getImages(customCase.images)" 
          :key="index" 
          :src="img" 
          alt="" 
          class="case-image"
        />
      </div>

      <div class="case-header">
        <h1 class="case-title">{{ customCase.title }}</h1>
        <div class="case-designer">
          <img :src="customCase.avatar || '/default-avatar.png'" class="designer-avatar" />
          <span>{{ customCase.real_name }}</span>
        </div>
      </div>

      <div class="case-meta-section">
        <div class="meta-item">
          <span class="meta-label">面积</span>
          <span class="meta-value">{{ customCase.area }}㎡</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">风格</span>
          <span class="meta-value">{{ customCase.style }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">预算</span>
          <span class="meta-value">¥{{ customCase.budget.toLocaleString() }}</span>
        </div>
      </div>

      <div class="case-stats">
        <div class="stat-item" @click="handleLike">
          <Heart class="stat-icon" :class="{ liked: liked }" />
          <span>{{ customCase.likes }}</span>
        </div>
        <div class="stat-item">
          <Eye class="stat-icon" />
          <span>{{ customCase.views }}</span>
        </div>
      </div>

      <div class="case-description">
        <h3>案例介绍</h3>
        <p>{{ customCase.description || '暂无介绍' }}</p>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Heart, Eye } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { caseAPI } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const customCase = ref(null)
const liked = ref(false)

onMounted(() => {
  loadCase()
})

async function loadCase() {
  loading.value = true
  try {
    const id = route.params.id
    customCase.value = await caseAPI.detail(id)
  } catch {
    customCase.value = null
  } finally {
    loading.value = false
  }
}

function getImages(imagesStr) {
  try {
    return JSON.parse(imagesStr) || []
  } catch {
    return []
  }
}

async function handleLike() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const data = await caseAPI.like(customCase.value.id)
    customCase.value.likes = data.likes
    liked.value = true
    ElMessage.success('点赞成功')
  } catch {
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped>
.content {
  padding-bottom: 80px;
}

.case-images {
  display: flex;
  flex-wrap: wrap;
}

.case-image {
  width: 50%;
  height: 180px;
  object-fit: cover;
}

.case-header {
  background: white;
  padding: 16px;
}

.case-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.case-designer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.designer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.case-designer span {
  font-size: 14px;
  color: #666;
}

.case-meta-section {
  background: white;
  margin: 12px;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  justify-content: space-around;
}

.meta-item {
  text-align: center;
}

.meta-label {
  font-size: 12px;
  color: #999;
  display: block;
}

.meta-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.case-stats {
  background: white;
  margin: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-around;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  width: 24px;
  height: 24px;
  color: #999;
}

.stat-icon.liked {
  color: #ef4444;
}

.stat-item span {
  font-size: 12px;
  color: #666;
}

.case-description {
  background: white;
  margin: 12px;
  padding: 16px;
  border-radius: 12px;
}

.case-description h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.case-description p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
</style>