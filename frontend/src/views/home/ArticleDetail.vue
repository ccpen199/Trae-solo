<template>
  <div class="article-detail-page">
    <div class="page-header">
      <van-icon name="arrow-left" size="20" @click="goBack" />
      <div class="header-title">文章详情</div>
      <van-icon name="share-o" size="20" @click="handleShare" />
    </div>

    <div class="article-content" v-if="article">
      <div class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span class="author">{{ article.author }}</span>
          <span class="time">{{ article.created_at || '2024-01-15' }}</span>
          <span class="views">{{ article.view_count || 0 }}阅读</span>
        </div>
      </div>

      <div class="article-cover" v-if="article.cover_image">
        <img :src="article.cover_image" class="cover-image" />
      </div>

      <div class="article-body" v-html="article.content"></div>

      <div class="article-tags" v-if="article.tags">
        <van-tag v-for="(tag, idx) in articleTags" :key="idx" size="medium" plain type="primary">
          {{ tag }}
        </van-tag>
      </div>
    </div>

    <div class="related-section" v-if="relatedArticles.length > 0">
      <div class="section-title">相关推荐</div>
      <div class="related-list">
        <div
          class="related-item"
          v-for="item in relatedArticles"
          :key="item.id"
          @click="goArticleDetail(item.id)"
        >
          <div class="related-info">
            <div class="related-title">{{ item.title }}</div>
            <div class="related-meta">
              <span>{{ item.author }}</span>
              <span>{{ item.view_count }}阅读</span>
            </div>
          </div>
          <img :src="item.cover_image" class="related-image" v-if="item.cover_image" />
        </div>
      </div>
    </div>

    <div class="action-bar">
      <div class="action-left">
        <div class="action-item" @click="toggleLike">
          <van-icon :name="isLiked ? 'good-job' : 'good-job-o'" size="22" :color="isLiked ? '#ee0a24' : '#646566'" />
          <span class="action-text">{{ likeCount }}</span>
        </div>
        <div class="action-item" @click="toggleFavorite">
          <van-icon :name="isFavorited ? 'star' : 'star-o'" size="22" :color="isFavorited ? '#ffc107' : '#646566'" />
          <span class="action-text">收藏</span>
        </div>
        <div class="action-item" @click="handleComment">
          <van-icon name="comment-o" size="22" color="#646566" />
          <span class="action-text">评论</span>
        </div>
      </div>
      <van-button type="primary" size="small" @click="handleShare" class="share-btn">
        <van-icon name="share-o" size="16" />
        <span>分享</span>
      </van-button>
    </div>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const isLiked = ref(false)
const isFavorited = ref(false)
const likeCount = ref(128)

const article = ref({
  id: 1,
  title: '油价调整最新消息：92号汽油价格下调0.12元/升',
  summary: '今日起，国内成品油价格再次调整，92号汽油每升下调0.12元...',
  content: `<p>今日起，国内成品油价格再次调整。根据国家发改委通知，92号汽油每升下调0.12元，95号汽油每升下调0.13元，0号柴油每升下调0.12元。</p>
  <p>此次调价后，车主加满一箱50升的92号汽油，可节省约6元。建议车主合理安排加油时间。</p>
  <h3>调价详情</h3>
  <p>本次油价调整是今年以来的第12次调整。具体调整情况如下：</p>
  <ul>
    <li>92号汽油：下调0.12元/升，现价7.59元/升</li>
    <li>95号汽油：下调0.13元/升，现价8.19元/升</li>
    <li>98号汽油：下调0.14元/升，现价9.19元/升</li>
    <li>0号柴油：下调0.12元/升，现价7.29元/升</li>
  </ul>
  <h3>后市展望</h3>
  <p>受国际油价波动影响，短期内国内油价可能继续保持震荡态势。建议车主关注易捷加油APP，及时获取最新油价信息和优惠活动。</p>
  <p>使用易捷加油APP加油，可享受会员优惠，充值还能获得更多返利！</p>`,
  cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oil%20price%20adjustment%20news%20banner%20gas%20station%20background&image_size=landscape_4_3',
  author: '易捷头条',
  view_count: 12580,
  category: 'oil_price',
  tags: '["油价调整","汽车资讯","易捷加油"]',
  created_at: '2024-01-15 10:30'
})

const relatedArticles = ref([
  {
    id: 2,
    title: '冬季汽车保养指南：这5点一定要注意',
    cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=car%20maintenance%20winter%20guide%20illustration%20automotive&image_size=landscape_4_3',
    author: '汽车养护专栏',
    view_count: 8960
  }
])

const articleTags = computed(() => {
  try {
    return JSON.parse(article.value.tags || '[]')
  } catch {
    return []
  }
})

const goBack = () => {
  router.back()
}

const goArticleDetail = (id) => {
  router.push(`/article/${id}`)
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  if (isLiked.value) {
    likeCount.value++
    showToast('点赞成功')
  } else {
    likeCount.value--
  }
}

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
  showToast(isFavorited.value ? '收藏成功' : '已取消收藏')
}

const handleComment = () => {
  showToast('评论功能开发中')
}

const handleShare = () => {
  showToast('分享功能开发中')
}

const fetchArticleDetail = async () => {
  loading.value = true
  try {
    const articleId = route.params.id
    console.log('获取文章详情:', articleId)
  } catch (error) {
    console.error('获取文章详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchArticleDetail()
})
</script>

<style lang="less" scoped>
.article-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;

  .header-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #323233;
  }
}

.article-content {
  background: #fff;
  margin-bottom: 12px;

  .article-header {
    padding: 20px 16px;

    .article-title {
      font-size: 20px;
      font-weight: 600;
      color: #323233;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .article-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #969799;
    }
  }

  .article-cover {
    padding: 0 16px;
    margin-bottom: 16px;

    .cover-image {
      width: 100%;
      border-radius: 8px;
    }
  }

  .article-body {
    padding: 0 16px 20px;
    font-size: 15px;
    line-height: 1.8;
    color: #323233;

    :deep(p) {
      margin-bottom: 16px;
      text-indent: 2em;
    }

    :deep(h3) {
      font-size: 17px;
      font-weight: 600;
      color: #323233;
      margin: 24px 0 12px;
    }

    :deep(ul) {
      padding-left: 2em;
      margin-bottom: 16px;
    }

    :deep(li) {
      margin-bottom: 8px;
    }
  }

  .article-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 16px 20px;
  }
}

.related-section {
  background: #fff;
  padding: 16px;

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 16px;
  }

  .related-list {
    .related-item {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #f7f8fa;
      cursor: pointer;

      &:last-child {
        border-bottom: none;
      }

      .related-info {
        flex: 1;
        margin-right: 12px;

        .related-title {
          font-size: 14px;
          color: #323233;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .related-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #969799;
        }
      }

      .related-image {
        width: 100px;
        height: 72px;
        border-radius: 6px;
        object-fit: cover;
        flex-shrink: 0;
      }
    }
  }
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);

  .action-left {
    display: flex;
    gap: 24px;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;

      .action-text {
        margin-top: 4px;
        font-size: 11px;
        color: #646566;
      }
    }
  }

  .share-btn {
    border-radius: 16px;
    padding: 8px 20px;
    display: flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #1989fa, #409eff);
    border: none;
  }
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
