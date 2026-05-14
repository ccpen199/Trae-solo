<template>
  <div class="my-posts-page">
    <div class="container">
      <h1 class="page-title">我的帖子</h1>
      
      <el-tabs v-model="statusFilter" @tab-change="loadPosts">
        <el-tab-pane label="全部" value="" />
        <el-tab-pane label="待审核" value="pending" />
        <el-tab-pane label="已发布" value="published" />
        <el-tab-pane label="已拒绝" value="rejected" />
      </el-tabs>
      
      <div v-if="loading" class="page-loading">
        <el-skeleton :rows="4" animated />
      </div>
      
      <div v-else-if="posts.length === 0" class="page-empty">
        <el-empty description="暂无帖子" />
      </div>
      
      <div v-else class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item"
          @click="goToPost(post.id)"
        >
          <div class="post-header">
            <h3 class="post-title">{{ post.title }}</h3>
            <el-tag :type="statusTagType(post.status)" size="small">{{ statusText(post.status) }}</el-tag>
          </div>
          <p class="post-excerpt">{{ post.content?.slice(0, 100) }}...</p>
          <div class="post-meta">
            <span>{{ post.bar_name }}</span>
            <span>{{ post.column_name }}</span>
            <span>{{ formatTime(post.created_at) }}</span>
            <span>浏览: {{ post.view_count || 0 }}</span>
            <span>评论: {{ post.comment_count || 0 }}</span>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(true)
const statusFilter = ref('')
const posts = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

function statusText(status) {
  const map = {
    draft: '草稿',
    pending: '待审核',
    published: '已发布',
    rejected: '已拒绝',
    removed: '已删除'
  }
  return map[status] || '未知'
}

function statusTagType(status) {
  const map = {
    draft: 'info',
    pending: 'warning',
    published: 'success',
    rejected: 'danger',
    removed: 'info'
  }
  return map[status] || ''
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function loadPosts() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    const res = await api.get('/posts/my', { params })
    if (res.success) {
      posts.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('加载我的帖子失败:', e)
  } finally {
    loading.value = false
  }
}

function goToPost(id) {
  router.push(`/posts/${id}`)
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.my-posts-page {
  padding: 30px 0;
}

.page-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 20px;
}

.post-list {
  background: #fff;
  border-radius: 8px;
}

.post-item {
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
}

.post-item:last-child {
  border-bottom: none;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.post-title {
  font-size: 18px;
  color: #303133;
  margin: 0;
  flex: 1;
  margin-right: 12px;
}

.post-excerpt {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.post-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #606266;
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
