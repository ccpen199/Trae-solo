<template>
  <div class="posts-page page-container">
    <div class="header">
      <h1>好生活</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else class="content">
      <div class="post-list">
        <div 
          v-for="post in posts" 
          :key="post.id" 
          class="post-card"
          @click="goDetail(post.id)"
        >
          <div class="post-images">
            <img :src="getFirstImage(post.images)" alt="" />
          </div>
          <div class="post-info">
            <h4 class="post-title">{{ post.title }}</h4>
            <p class="post-content">{{ post.content }}</p>
            <div class="post-meta">
              <div class="author-info">
                <img :src="post.avatar || '/default-avatar.png'" class="author-avatar" />
                <span class="author-name">{{ post.nickname }}</span>
              </div>
              <div class="post-stats">
                <span><Heart class="stat-icon" />{{ post.likes }}</span>
                <span><Eye class="stat-icon" />{{ post.views }}</span>
                <span><MessageCircle class="stat-icon" />{{ post.comments }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="total > limit"
        :current-page="page"
        :page-size="limit"
        :total="total"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, Eye, MessageCircle } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { postAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const posts = ref([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

onMounted(() => {
  loadPosts()
})

async function loadPosts() {
  loading.value = true
  try {
    const data = await postAPI.list({ page: page.value, limit: limit.value })
    posts.value = data.posts || []
    total.value = data.total || 0
  } catch {
    posts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(val) {
  page.value = val
  loadPosts()
}

function getFirstImage(imagesStr) {
  try {
    const images = JSON.parse(imagesStr)
    return images[0] || '/default-image.png'
  } catch {
    return '/default-image.png'
  }
}

function goDetail(id) {
  router.push(`/post/${id}`)
}
</script>

<style scoped>
.header {
  background: white;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content {
  padding: 12px;
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
  height: 200px;
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
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.post-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.author-name {
  font-size: 12px;
  color: #666;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.post-stats span {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  width: 14px;
  height: 14px;
}

.pagination {
  padding: 16px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
</style>