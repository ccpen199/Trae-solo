<template>
  <div class="container detail-page">
    <div v-if="article">
      <div class="detail-header">
        <h1 class="detail-title">{{ article.title }}</h1>
        <div class="detail-meta">
          <span>📂 {{ article.category_name }}</span>
          <span>✍️ {{ article.author }}</span>
          <span>📅 {{ formatDate(article.published_at) }}</span>
          <span>👁 {{ article.view_count }} 次阅读</span>
        </div>
      </div>
      <div class="detail-content">
        <div v-html="formatContent(article.content)"></div>
      </div>
      <div style="margin-top: 2rem;">
        <router-link to="/articles" class="btn btn-outline">
          ← 返回列表
        </router-link>
      </div>
    </div>
    <div v-else class="card card-body" style="text-align: center;">
      文章不存在或加载中...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { articlesApi } from '@/api'

const route = useRoute()
const article = ref(null)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

function formatContent(content) {
  if (!content) return ''
  return content
    .replace(/\n/g, '<br>')
    .replace(/#{1,6}\s(.+)/g, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

async function loadArticle() {
  try {
    const res = await articlesApi.getDetail(route.params.id)
    if (res.data.success) {
      article.value = res.data.data
    }
  } catch (error) {
    console.error('加载文章详情失败:', error)
  }
}

onMounted(() => {
  loadArticle()
})
</script>
