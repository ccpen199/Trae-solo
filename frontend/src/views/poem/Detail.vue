<template>
  <div class="page-container">
    <van-nav-bar title="诗词详情" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="share-o" size="20" @click="goShare" />
      </template>
    </van-nav-bar>

    <div class="page-content detail-content" v-loading="loading">
      <div class="error-state" v-if="error">
        <p>加载失败</p>
        <van-button type="primary" size="small" class="retry-btn" @click="loadDetail">重试</van-button>
      </div>

      <div v-if="poem" class="poem-detail">
        <div class="poem-header">
          <h1 class="poem-title">{{ poem.title }}</h1>
          <p class="poem-author">【{{ poem.dynasty }}】{{ poem.author }}</p>
        </div>

        <div class="poem-content">
          <p v-for="(line, index) in contentLines" :key="index">{{ line }}</p>
        </div>

        <div class="poem-tags" v-if="poem.tags && poem.tags.length">
          <van-tag plain type="primary" size="small" v-for="tag in poem.tags" :key="tag">{{ tag }}</van-tag>
        </div>
      </div>
    </div>

    <div class="footer-action" v-if="poem">
      <van-button type="primary" block @click="handleFavorite">
        {{ isFavorited ? '取消收藏' : '收藏' }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { poemsApi } from '@/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const error = ref(false)
const poem = ref(null)
const isFavorited = ref(false)

const contentLines = computed(() => {
  if (!poem.value?.content) return []
  return poem.value.content.split('\n').filter(line => line.trim())
})

const loadDetail = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await poemsApi.getPoem(route.params.id)
    poem.value = res.data
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

const goShare = () => {
  router.push({ path: '/share', query: { poemId: route.params.id } })
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn()) {
    router.push('/login')
    return
  }

  try {
    await poemsApi.toggleFavorite(route.params.id)
    isFavorited.value = !isFavorited.value
    showToast(isFavorited.value ? '收藏成功' : '取消收藏')
  } catch (e) {}
}

onMounted(() => {
  loadDetail()
})
</script>

<style lang="less" scoped>
.detail-content {
  padding-bottom: 80px;
}

.poem-detail {
  padding: 24px 16px;
}

.poem-header {
  text-align: center;
  margin-bottom: 40px;

  .poem-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
  }

  .poem-author {
    font-size: 14px;
    color: #666;
  }
}

.poem-content {
  text-align: center;
  line-height: 2.2;
  font-size: 18px;
  color: #333;
  margin-bottom: 30px;

  p {
    margin-bottom: 8px;
    letter-spacing: 2px;
  }
}

.poem-tags {
  text-align: center;

  .van-tag {
    margin: 0 4px;
  }
}

.footer-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
}
</style>
