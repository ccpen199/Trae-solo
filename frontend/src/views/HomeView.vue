<template>
  <div class="home-view">
    <section class="hero" v-if="homeData.profile">
      <div class="container">
        <h1>欢迎来到 {{ homeData.profile.name }} 的个人网站</h1>
        <p>{{ homeData.profile.bio }}</p>
        <div class="hero-actions">
          <router-link to="/articles" class="btn btn-primary">
            📝 阅读日志
          </router-link>
          <router-link to="/profile" class="btn btn-secondary">
            👤 了解更多
          </router-link>
        </div>
      </div>
    </section>

    <div class="container">
      <section class="section">
        <h2 class="section-title">🚀 栏目导航</h2>
        <div class="grid grid-4">
          <router-link 
            v-for="cat in homeData.categories" 
            :key="cat.id" 
            :to="getCategoryLink(cat.slug)"
            class="category-card"
          >
            <div class="category-icon">{{ cat.icon }}</div>
            <div class="category-name">{{ cat.name }}</div>
            <div class="category-desc">{{ cat.description }}</div>
          </router-link>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">📝 最新日志</h2>
        <div class="grid grid-3" v-if="homeData.latestArticles?.length">
          <div v-for="article in homeData.latestArticles" :key="article.id" class="article-card">
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
        <p v-else class="card card-body">暂无日志</p>
      </section>

      <section class="section">
        <h2 class="section-title">⭐ 推荐文章</h2>
        <div class="grid grid-3" v-if="homeData.recommendedArticles?.length">
          <div v-for="article in homeData.recommendedArticles" :key="article.id" class="article-card">
            <div class="article-cover" style="background: linear-gradient(135deg, #f093fb, #f5576c);">⭐</div>
            <div class="article-content">
              <div class="article-meta">
                <span>{{ article.category_name }}</span>
                <span>{{ formatDate(article.published_at) }}</span>
              </div>
              <router-link :to="`/articles/${article.id}`" class="article-title">
                {{ article.title }}
              </router-link>
              <p class="article-summary">{{ article.summary }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">📷 推荐相册</h2>
        <div class="grid grid-3" v-if="homeData.recommendedAlbums?.length">
          <router-link 
            v-for="album in homeData.recommendedAlbums" 
            :key="album.id" 
            :to="`/albums/${album.id}`"
            class="album-card"
          >
            <div class="album-cover">
              📷
              <span class="album-photo-count">{{ album.photo_count || 0 }} 张</span>
            </div>
            <div class="album-info">
              <div class="album-name">{{ album.name }}</div>
              <div class="album-desc">{{ album.description }}</div>
            </div>
          </router-link>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">🎵 推荐音乐影视</h2>
        <div class="grid grid-2" v-if="homeData.recommendedMedia?.length">
          <div v-for="media in homeData.recommendedMedia" :key="media.id" class="media-card">
            <div class="media-icon">{{ media.type === 'music' ? '🎵' : '🎬' }}</div>
            <div class="media-info">
              <div class="media-title">{{ media.title }}</div>
              <div class="media-meta">
                {{ media.artist }} · {{ media.year }} · 
                <span class="media-rating">{{ '★'.repeat(media.rating) }}{{ '☆'.repeat(5 - media.rating) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="card card-body" style="text-align: center; padding: 3rem;">
          <h3 style="margin-bottom: 1rem;">📧 联系我</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
            有任何问题或想法？欢迎在留言板给我留言！
          </p>
          <router-link to="/guestbook" class="btn btn-outline">
            💬 前往留言板
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { homeApi } from '@/api'

const homeData = ref({
  profile: null,
  categories: [],
  latestArticles: [],
  recommendedArticles: [],
  recommendedAlbums: [],
  recommendedMedia: []
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

function getCategoryLink(slug) {
  switch(slug) {
    case 'blog': return '/articles'
    case 'learning': return '/learning'
    case 'gallery': return '/albums'
    case 'media': return '/media'
    case 'guestbook': return '/guestbook'
    default: return '/'
  }
}

async function loadHomeData() {
  try {
    const res = await homeApi.getHomeData()
    if (res.data.success) {
      homeData.value = res.data.data
    }
  } catch (error) {
    console.error('加载首页数据失败:', error)
  }
}

onMounted(() => {
  loadHomeData()
})
</script>
