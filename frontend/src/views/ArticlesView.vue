<template>
  <div class="container">
    <h2 class="section-title">{{ pageTitle }}</h2>
    
    <div class="grid grid-3" v-if="articles.length">
      <div v-for="article in articles" :key="article.id" class="article-card">
        <div class="article-cover">📄</div>
        <div class="article-content">
          <div class="article-meta">
            <span>{{ article.category_name }}</span>
            <span>{{ formatDate(article.published_at) }}</span>
            <span>👁 {{ article.view_count }}</span>
          </div>
          <router-link :to="`/articles/${article.id}`" class="article-title">
            {{ article.title }}
          </router-link>
          <p class="article-summary">{{ article.summary }}</p>
        </div>
      </div>
    </div>
    
    <p v-else class="card card-body">暂无文章</p>
    
    <div class="pagination" v-if="totalPages > 1">
      <button class="pagination-btn" :disabled="page === 1" @click="page--">上一页</button>
      <span style="padding: 0.5rem 1rem;">第 {{ page }} 页 / 共 {{ totalPages }} 页</span>
      <button class="pagination-btn" :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { articlesApi } from '@/api'

const route = useRoute()
const articles = ref([])
const page = ref(1)
const limit = ref(9)
const total = ref(0)

const pageTitle = computed(() => {
  return route.meta.category === 2 ? '📚 学习园地' : '📝 日志'
})

const categoryId = computed(() => route.meta.category || null)

const totalPages = computed(() => Math.ceil(total.value / limit.value))

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

async function loadArticles() {
  try {
    const params = { page: page.value, limit: limit.value }
    if (categoryId.value) {
      params.category_id = categoryId.value
    }
    
    const res = await articlesApi.getList(params)
    if (res.data.success) {
      articles.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (error) {
    console.error('加载文章列表失败:', error)
  }
}

watch(page, () => {
  loadArticles()
})

onMounted(() => {
  loadArticles()
})
</script>
