<template>
  <div class="designer-detail-page page-container">
    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else-if="!designer" class="error">
      <p>设计师不存在</p>
    </div>

    <div v-else class="content">
      <div class="designer-header">
        <div class="designer-avatar-large">
          <img :src="designer.avatar || '/default-avatar.png'" :alt="designer.real_name" />
        </div>
        <div class="designer-main-info">
          <h1 class="designer-name">{{ designer.real_name }}</h1>
          <p class="designer-phone">{{ designer.phone }}</p>
          <div class="designer-stats-row">
            <div class="stat-item">
              <span class="stat-value">{{ designer.works_count }}</span>
              <span class="stat-label">作品</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ designer.followers }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ designer.likes }}</span>
              <span class="stat-label">获赞</span>
            </div>
          </div>
        </div>
        <button class="follow-btn" :class="{ followed: followed }" @click="handleFollow">
          {{ followed ? '已关注' : '关注' }}
        </button>
      </div>

      <div class="designer-bio-section">
        <h3>个人简介</h3>
        <p>{{ designer.bio || '暂无介绍' }}</p>
      </div>

      <div class="works-section">
        <h3>作品展示</h3>
        <div v-if="works.length === 0" class="empty-works">
          <p>暂无作品</p>
        </div>
        <div v-else class="works-grid">
          <div 
            v-for="work in works" 
            :key="work.id" 
            class="work-card"
            @click="goWorkDetail(work.id)"
          >
            <div class="work-image">
              <img :src="getFirstImage(work.images)" alt="" />
            </div>
            <div class="work-info">
              <h4>{{ work.title }}</h4>
              <div class="work-stats">
                <span><Heart class="icon" />{{ work.likes }}</span>
                <span><Eye class="icon" />{{ work.views }}</span>
              </div>
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
import { useRoute, useRouter } from 'vue-router'
import { Heart, Eye } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { designerAPI } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const designer = ref(null)
const works = ref([])
const followed = ref(false)

onMounted(() => {
  loadDesigner()
})

async function loadDesigner() {
  loading.value = true
  try {
    const id = route.params.id
    const data = await designerAPI.detail(id)
    designer.value = data.designer
    works.value = data.works || []
  } catch {
    designer.value = null
  } finally {
    loading.value = false
  }
}

function getFirstImage(imagesStr) {
  try {
    const images = JSON.parse(imagesStr)
    return images[0] || '/default-image.png'
  } catch {
    return '/default-image.png'
  }
}

async function handleFollow() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const data = await designerAPI.follow(designer.value.id)
    followed.value = data.followed
    designer.value.followers += data.followed ? 1 : -1
    ElMessage.success(data.followed ? '关注成功' : '取消关注')
  } catch {
    ElMessage.error('操作失败')
  }
}

function goWorkDetail(id) {
  router.push(`/designer/works/${id}`)
}
</script>

<style scoped>
.content {
  padding-bottom: 80px;
}

.designer-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 16px;
  color: white;
}

.designer-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 16px;
  border: 4px solid rgba(255, 255, 255, 0.5);
}

.designer-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.designer-main-info {
  text-align: center;
  margin-bottom: 16px;
}

.designer-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.designer-phone {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

.designer-stats-row {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.follow-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.follow-btn.followed {
  background: white;
  color: #667eea;
}

.designer-bio-section {
  background: white;
  margin: 12px;
  padding: 16px;
  border-radius: 12px;
}

.designer-bio-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.designer-bio-section p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.works-section {
  margin: 12px;
}

.works-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.empty-works {
  background: white;
  padding: 40px;
  text-align: center;
  border-radius: 12px;
  color: #999;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.work-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.work-image {
  height: 140px;
}

.work-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-info {
  padding: 10px;
}

.work-info h4 {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-stats {
  display: flex;
  gap: 12px;
}

.work-stats span {
  font-size: 11px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon {
  width: 12px;
  height: 12px;
}

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
</style>