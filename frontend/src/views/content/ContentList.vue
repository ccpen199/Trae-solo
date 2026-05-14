<template>
  <div class="content-list-page">
    <div class="container">
      <div class="page-header">
        <h1>{{ pageTitle }}</h1>
        <p class="subtitle">{{ pageSubtitle }}</p>
      </div>
      
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          :placeholder="`搜索${typeLabels[contentType]}内容`"
          style="width: 300px;"
          clearable
          @keyup.enter="loadPosts"
        >
          <template #append>
            <el-button :icon="Search" @click="loadPosts" />
          </template>
        </el-input>
        
        <el-select v-model="sort" placeholder="排序" @change="loadPosts" style="width: 150px;">
          <el-option label="最新发布" value="newest" />
          <el-option label="最热门" value="hot" />
          <el-option label="精华" value="recommend" />
        </el-select>
      </div>
      
      <div v-if="loading" class="page-loading">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="posts.length === 0" class="page-empty">
        <el-empty :description="`暂无${typeLabels[contentType]}内容`" />
      </div>
      
      <div v-else class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item"
          @click="goToPost(post.id)"
        >
          <div class="post-main">
            <h3 class="post-title">
              <el-tag v-if="post.is_top" type="danger" size="small" style="margin-right: 8px;">置顶</el-tag>
              <el-tag v-if="post.is_recommended" type="warning" size="small" style="margin-right: 8px;">精华</el-tag>
              {{ post.title }}
            </h3>
            <p class="post-excerpt">{{ post.content?.slice(0, 150) }}...</p>
            <div class="post-meta">
              <span class="bar-tag" v-if="post.bar_name">
                <el-icon><Collection /></el-icon>
                {{ post.bar_name }}
              </span>
              <span class="author">
                <el-avatar :size="18" :src="post.author_avatar">
                  {{ (post.author_nickname || 'U').charAt(0) }}
                </el-avatar>
                {{ post.author_nickname }}
              </span>
              <span class="time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>
          <div class="post-stats">
            <span><el-icon><View /></el-icon> {{ post.view_count || 0 }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count || 0 }}</span>
            <span><el-icon><Star /></el-icon> {{ post.like_count || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="loadPosts"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, View, ChatDotRound, Star, Collection } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const typeLabels = {
  news: '资讯',
  forum: '论坛',
  blog: '博客',
  qa: '问答'
}

const typeTitles = {
  news: '资讯频道',
  forum: '论坛社区',
  blog: '博客专栏',
  qa: '问答专区'
}

const typeSubtitles = {
  news: '最新产品资讯、行业动态、评测文章',
  forum: '用户交流讨论、经验分享',
  blog: '深度使用心得、专业评测',
  qa: '产品使用问题解答、选购指南'
}

const contentType = computed(() => route.meta.contentType || 'forum')
const pageTitle = computed(() => typeTitles[contentType.value] || '内容列表')
const pageSubtitle = computed(() => typeSubtitles[contentType.value] || '')

const loading = ref(false)
const keyword = ref('')
const sort = ref('newest')
const posts = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 15,
  total: 0
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function loadPosts() {
  loading.value = true
  try {
    const params = {
      content_type: contentType.value,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: sort.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    
    const res = await api.get('/posts', { params })
    if (res.success) {
      posts.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('加载内容失败:', e)
  } finally {
    loading.value = false
  }
}

function goToPost(postId) {
  router.push(`/posts/${postId}`)
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.content-list-page {
  padding: 30px 0;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.post-list {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
}

.post-item:last-child {
  border-bottom: none;
}

.post-main {
  flex: 1;
  min-width: 0;
}

.post-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 10px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.post-meta .bar-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
}

.post-meta .author {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #909399;
  margin-left: 30px;
}

.post-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
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
