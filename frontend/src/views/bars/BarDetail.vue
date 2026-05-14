<template>
  <div class="bar-detail-page">
    <div v-if="loading" class="page-loading">
      <el-skeleton :rows="6" animated />
    </div>
    
    <div v-else-if="error" class="page-error">
      <el-empty description="加载失败">
        <el-button type="primary" @click="loadBar">重试</el-button>
      </el-empty>
    </div>
    
    <template v-else-if="bar">
      <div class="bar-header">
        <div class="container">
          <div class="bar-header-content">
            <div class="bar-cover">
              <img :src="bar.cover_image || bar.product_cover || defaultCover" :alt="bar.name" />
            </div>
            <div class="bar-info">
              <div class="bar-title-row">
                <h1>{{ bar.name }}</h1>
                <el-tag :type="statusTagType" size="small">{{ statusText }}</el-tag>
              </div>
              <p class="bar-desc">{{ bar.description || '暂无描述' }}</p>
              
              <div class="bar-meta">
                <div class="meta-item">
                  <el-avatar :size="24" :src="bar.owner_avatar">
                    {{ (bar.owner_nickname || 'U').charAt(0) }}
                  </el-avatar>
                  <span>吧主: {{ bar.owner_nickname }}</span>
                </div>
                <div class="meta-stats">
                  <span>{{ bar.member_count || 0 }} 成员</span>
                  <span>{{ bar.post_count || 0 }} 帖子</span>
                  <span>{{ bar.view_count || 0 }} 浏览</span>
                </div>
              </div>
              
              <div class="bar-actions" v-if="bar.status === 'active'">
                <template v-if="userStore.isLoggedIn">
                  <el-button
                    v-if="!bar.isMember"
                    type="primary"
                    @click="joinBar"
                    :loading="joining"
                  >
                    加入吧
                  </el-button>
                  <el-button
                    v-else
                    @click="leaveBar"
                    :loading="leaving"
                    :disabled="bar.memberRole === 'owner'"
                  >
                    {{ bar.memberRole === 'owner' ? '你是吧主' : '退出吧' }}
                  </el-button>
                  <el-button type="success" @click="goCreatePost">
                    发布帖子
                  </el-button>
                </template>
                <template v-else>
                  <router-link to="/login">
                    <el-button type="primary">登录后加入</el-button>
                  </router-link>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="container">
        <div class="bar-content">
          <div class="main-content">
            <div class="tabs-wrapper">
              <el-tabs v-model="activeColumn" @tab-change="loadPosts">
                <el-tab-pane
                  v-for="col in bar.columns || []"
                  :key="col.id"
                  :label="col.name"
                  :name="String(col.id)"
                />
              </el-tabs>
            </div>
            
            <div v-if="loadingPosts" class="page-loading">
              <el-skeleton :rows="3" animated />
            </div>
            
            <div v-else-if="posts.length === 0" class="page-empty">
              <el-empty description="暂无帖子">
                <template v-if="bar.status === 'active' && bar.isMember">
                  <el-button type="primary" @click="goCreatePost">发布第一个帖子</el-button>
                </template>
              </el-empty>
            </div>
            
            <div v-else class="post-list">
              <div
                v-for="post in posts"
                :key="post.id"
                class="post-item"
                @click="goToPost(post.id)"
              >
                <h3 class="post-title">
                  <el-tag v-if="post.is_top" type="danger" size="small" style="margin-right: 8px;">置顶</el-tag>
                  <el-tag v-if="post.is_recommended" type="warning" size="small" style="margin-right: 8px;">精华</el-tag>
                  {{ post.title }}
                </h3>
                <p class="post-excerpt">{{ post.content?.slice(0, 150) }}</p>
                <div class="post-meta">
                  <span class="author">
                    <el-avatar :size="18" :src="post.author_avatar">
                      {{ (post.author_nickname || 'U').charAt(0) }}
                    </el-avatar>
                    {{ post.author_nickname }}
                  </span>
                  <span class="time">{{ formatTime(post.created_at) }}</span>
                  <span class="counts">
                    <el-icon><View /></el-icon> {{ post.view_count || 0 }}
                    <el-icon><ChatDotRound /></el-icon> {{ post.comment_count || 0 }}
                    <el-icon><Star /></el-icon> {{ post.like_count || 0 }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="postPagination.total > postPagination.pageSize" class="pagination-wrapper">
              <el-pagination
                v-model:current-page="postPagination.page"
                :page-size="postPagination.pageSize"
                :total="postPagination.total"
                layout="prev, pager, next"
                @current-change="loadPosts"
              />
            </div>
          </div>
          
          <div class="sidebar">
            <el-card v-if="bar.product_name || (bar.relatedProducts && bar.relatedProducts.length > 0)">
              <template #header>
                <span>关联商品</span>
              </template>
              <div v-if="bar.product_name" class="main-product" @click="goToProduct(bar.product_id)">
                <img :src="bar.product_cover" />
                <div class="product-info">
                  <div class="product-name">{{ bar.product_name }}</div>
                  <div class="product-price" v-if="bar.product_price">¥{{ bar.product_price.toFixed(2) }}</div>
                </div>
              </div>
              <div
                v-for="p in bar.relatedProducts"
                :key="p.id"
                class="related-product"
                @click="goToProduct(p.id)"
              >
                <img :src="p.cover_image" />
                <span>{{ p.name }}</span>
              </div>
            </el-card>
            
            <el-card style="margin-top: 20px;">
              <template #header>
                <span>吧简介</span>
              </template>
              <div class="bar-about">
                <p v-if="bar.product_category">分类: {{ bar.product_category }}</p>
                <p v-if="bar.product_brand">品牌: {{ bar.product_brand }}</p>
                <p v-if="bar.product_description">{{ bar.product_description }}</p>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { View, ChatDotRound, Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const error = ref(false)
const loadingPosts = ref(false)
const joining = ref(false)
const leaving = ref(false)
const bar = ref(null)
const posts = ref([])
const activeColumn = ref('')

const postPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const defaultCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f2f5" width="200" height="200"/%3E%3Ctext fill="%23909399" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E产品吧%3C/text%3E%3C/svg%3E'

const statusText = computed(() => {
  const map = {
    draft: '草稿',
    pending: '审核中',
    active: '活跃',
    rejected: '已拒绝',
    closed: '已关闭'
  }
  return map[bar.value?.status] || '未知'
})

const statusTagType = computed(() => {
  const map = {
    draft: 'info',
    pending: 'warning',
    active: 'success',
    rejected: 'danger',
    closed: 'info'
  }
  return map[bar.value?.status] || ''
})

async function loadBar() {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/product-bars/${route.params.id}`)
    if (res.success) {
      bar.value = res.data
      if (res.data.columns && res.data.columns.length > 0) {
        activeColumn.value = String(res.data.columns[0].id)
        loadPosts()
      }
    }
  } catch (e) {
    console.error('加载产品吧失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

async function loadPosts() {
  if (!activeColumn.value) return
  
  loadingPosts.value = true
  try {
    const res = await api.get('/posts', {
      params: {
        bar_id: route.params.id,
        column_id: activeColumn.value,
        page: postPagination.page,
        pageSize: postPagination.pageSize
      }
    })
    if (res.success) {
      posts.value = res.data.list || []
      postPagination.total = res.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('加载帖子失败:', e)
  } finally {
    loadingPosts.value = false
  }
}

async function joinBar() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  joining.value = true
  try {
    const res = await api.post(`/product-bars/${route.params.id}/join`)
    if (res.success) {
      ElMessage.success('加入成功')
      bar.value.isMember = true
      bar.value.member_count = (bar.value.member_count || 0) + 1
    }
  } catch (e) {
    console.error('加入失败:', e)
  } finally {
    joining.value = false
  }
}

async function leaveBar() {
  try {
    await ElMessageBox.confirm('确定要退出这个产品吧吗？', '提示', {
      type: 'warning'
    })
    
    leaving.value = true
    const res = await api.post(`/product-bars/${route.params.id}/leave`)
    if (res.success) {
      ElMessage.success('已退出')
      bar.value.isMember = false
      bar.value.member_count = Math.max(0, (bar.value.member_count || 0) - 1)
    }
  } catch (e) {
    console.error('退出失败:', e)
  } finally {
    leaving.value = false
  }
}

function goCreatePost() {
  router.push(`/posts/create/${route.params.id}`)
}

function goToPost(postId) {
  router.push(`/posts/${postId}`)
}

function goToProduct(productId) {
  router.push(`/products/${productId}`)
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadBar()
})
</script>

<style scoped>
.bar-detail-page {
  min-height: 100%;
}

.bar-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 30px 0;
}

.bar-header-content {
  display: flex;
  gap: 30px;
}

.bar-cover {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f7fa;
}

.bar-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bar-info {
  flex: 1;
}

.bar-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.bar-title-row h1 {
  font-size: 28px;
  margin: 0;
  color: #303133;
}

.bar-desc {
  font-size: 15px;
  color: #606266;
  margin-bottom: 16px;
}

.bar-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.meta-stats {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.bar-actions {
  display: flex;
  gap: 12px;
}

.bar-content {
  display: flex;
  gap: 30px;
  padding: 30px 0;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.tabs-wrapper {
  background: #fff;
  padding: 0 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.post-list {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
}

.post-item {
  padding: 20px 0;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
}

.post-item:last-child {
  border-bottom: none;
}

.post-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 10px;
  font-weight: 500;
}

.post-excerpt {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.post-meta .author {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-meta .counts {
  display: flex;
  gap: 16px;
}

.post-meta .counts span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.main-product,
.related-product {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #f0f2f5;
}

.main-product:last-child,
.related-product:last-child {
  border-bottom: none;
}

.main-product img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.related-product img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.main-product .product-info {
  flex: 1;
}

.product-name {
  color: #303133;
  font-weight: 500;
}

.product-price {
  color: #f56c6c;
  font-weight: 600;
  margin-top: 4px;
}

.related-product span {
  flex: 1;
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-about {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: #fff;
  border-radius: 8px;
  margin-top: 20px;
}
</style>
