<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const error = ref('')
const posts = ref([])
const categories = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const selectedCategory = ref('')
const keyword = ref('')

const fetchCategories = async () => {
  try {
    const res = await request.get('/community/categories')
    categories.value = res.data || []
  } catch (err) {
    console.error('Fetch categories error:', err)
  }
}

const fetchPosts = async () => {
  try {
    loading.value = true
    error.value = ''
    
    let url = `/community/posts?page=${page.value}&limit=${limit.value}`
    if (selectedCategory.value) url += `&category=${encodeURIComponent(selectedCategory.value)}`
    if (keyword.value) url += `&keyword=${encodeURIComponent(keyword.value)}`
    
    const res = await request.get(url)
    posts.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (err) {
    console.error('Fetch posts error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchPosts()
}

const handleCategoryChange = (cat) => {
  selectedCategory.value = selectedCategory.value === cat ? '' : cat
  page.value = 1
  fetchPosts()
}

const handlePageChange = (p) => {
  page.value = p
  fetchPosts()
}

const goToCreate = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  ElMessage.info('发布功能开发中...')
}

onMounted(() => {
  fetchCategories()
  fetchPosts()
})
</script>

<template>
  <Layout>
    <div class="community-page">
      <div class="container">
        <div class="page-header">
          <div class="header-left">
            <h1 class="page-title">社区</h1>
            <p class="page-desc">分享养宠经验，交流养宠心得</p>
          </div>
          <el-button type="primary" @click="goToCreate">
            <el-icon><Edit /></el-icon>
            发布帖子
          </el-button>
        </div>

        <div class="filter-section">
          <div class="category-tags">
            <el-tag
              :type="!selectedCategory ? 'primary' : 'info'"
              class="cat-tag"
              @click="handleCategoryChange('')"
            >
              全部
            </el-tag>
            <el-tag
              v-for="cat in categories"
              :key="cat.id"
              :type="selectedCategory === cat.name ? 'primary' : 'info'"
              class="cat-tag"
              @click="handleCategoryChange(cat.name)"
            >
              <span>{{ cat.icon }}</span>
              {{ cat.name }}
            </el-tag>
          </div>
          
          <el-input
            v-model="keyword"
            placeholder="搜索帖子..."
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-skeleton v-if="loading" :rows="6" animated />
        
        <div v-else-if="error" class="error-state">
          <el-empty description="加载失败">
            <el-button type="primary" @click="fetchPosts">点击重试</el-button>
          </el-empty>
        </div>

        <div v-else-if="posts.length === 0" class="empty-state">
          <el-empty description="暂无帖子，快来发布第一条吧" />
        </div>

        <template v-else>
          <div class="post-list">
            <div 
              v-for="post in posts" 
              :key="post.id" 
              class="post-card"
              @click="$router.push(`/community/${post.id}`)"
            >
              <div class="post-author">
                <el-avatar :src="post.avatar">
                  {{ post.nickname?.charAt(0) || '用' }}
                </el-avatar>
                <div class="author-info">
                  <span class="author-name">{{ post.nickname }}</span>
                  <el-tag size="small" type="info">{{ post.category }}</el-tag>
                </div>
              </div>
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-excerpt">{{ post.content }}</p>
              <div class="post-stats">
                <span class="stat">
                  <el-icon><View /></el-icon>
                  {{ post.views_count || 0 }}
                </span>
                <span class="stat">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ post.comments_count || 0 }}
                </span>
                <span class="stat">
                  <el-icon><Star /></el-icon>
                  {{ post.likes_count || 0 }}
                </span>
              </div>
            </div>
          </div>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="page"
              :page-size="limit"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="handlePageChange"
            />
          </div>
        </template>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.community-page {
  min-height: 80vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.page-desc {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 16px;
}

.category-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.cat-tag {
  cursor: pointer;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 30px;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
}

.post-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
  line-height: 1.4;
}

.post-excerpt {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-stats {
  display: flex;
  gap: 24px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.error-state,
.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
