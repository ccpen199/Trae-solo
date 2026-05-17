<template>
  <div class="page-container">
    <van-nav-bar title="西窗烛">
      <template #right>
        <van-icon name="setting-o" size="20" @click="$router.push('/excerpt/settings')" />
      </template>
    </van-nav-bar>

    <div class="page-content excerpt-content" v-loading="loading && poems.length === 0">
      <div class="error-state" v-if="error && poems.length === 0">
        <p>加载失败</p>
        <van-button type="primary" size="small" class="retry-btn" @click="loadPoems">重试</van-button>
      </div>

      <div class="empty-state" v-else-if="!loading && poems.length === 0 && !error">
        <div class="empty-icon">📜</div>
        <p>暂无诗词</p>
      </div>

      <van-swipe
        v-else
        ref="swipeRef"
        class="poem-swipe"
        vertical
        :show-indicators="false"
        @change="onSwipeChange"
      >
        <van-swipe-item v-for="(poem, index) in poems" :key="poem.id" @click="goDetail(poem.id)">
          <div class="poem-card" :style="{ background: getCardBg(index) }">
            <div class="poem-excerpt">{{ poem.excerpt }}</div>
            <div class="poem-info">
              <span class="poem-title">{{ poem.title }}</span>
              <span class="poem-author">【{{ poem.dynasty }}】{{ poem.author }}</span>
            </div>
            <div class="poem-tags" v-if="poem.tags && poem.tags.length">
              <van-tag plain type="primary" size="small" v-for="tag in poem.tags" :key="tag">{{ tag }}</van-tag>
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>

    <div class="action-bar" v-if="poems.length > 0">
      <div class="action-item" @click="handleFavorite">
        <van-icon name="star-o" size="24" />
        <span>收藏</span>
      </div>
      <div class="action-item" @click="goShare">
        <van-icon name="share-o" size="24" />
        <span>分享</span>
      </div>
    </div>

    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item replace to="/excerpt" icon="bookmark-o">摘录</van-tabbar-item>
      <van-tabbar-item replace to="/community" icon="cluster-o">创作</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { poemsApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('/excerpt')
const swipeRef = ref(null)
const currentIndex = ref(0)
const loading = ref(false)
const error = ref(false)
const poems = ref([])

const bgColors = [
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  'linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
]

const getCardBg = (index) => bgColors[index % bgColors.length]

const loadPoems = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await poemsApi.getExcerpts({ limit: 20 })
    poems.value = res.data || []
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

const onSwipeChange = (index) => {
  currentIndex.value = index
  if (index >= poems.value.length - 3) {
    loadMorePoems()
  }
}

const loadMorePoems = async () => {
  try {
    const res = await poemsApi.getExcerpts({ limit: 10, offset: poems.value.length })
    poems.value = [...poems.value, ...(res.data || [])]
  } catch (e) {}
}

const goDetail = (id) => {
  router.push(`/poem/${id}`)
}

const goShare = () => {
  const poem = poems.value[currentIndex.value]
  if (poem) {
    router.push({ path: '/share', query: { poemId: poem.id } })
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn()) {
    router.push('/login')
    return
  }

  const poem = poems.value[currentIndex.value]
  if (!poem) return

  try {
    await poemsApi.toggleFavorite(poem.id)
    showToast('操作成功')
  } catch (e) {}
}

onMounted(() => {
  loadPoems()
})
</script>

<style lang="less" scoped>
.excerpt-content {
  padding-bottom: 120px;
}

.poem-swipe {
  height: calc(100vh - 150px);
}

.poem-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 24px;
  border-radius: 16px;
  margin: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.poem-excerpt {
  font-size: 22px;
  line-height: 1.8;
  text-align: center;
  color: #333;
  margin-bottom: 40px;
  font-weight: 500;
  letter-spacing: 2px;
}

.poem-info {
  text-align: center;

  .poem-title {
    display: block;
    font-size: 18px;
    color: #333;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .poem-author {
    font-size: 14px;
    color: #666;
  }
}

.poem-tags {
  margin-top: 20px;

  .van-tag {
    margin: 0 4px;
  }
}

.action-bar {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 10px 0;
  z-index: 100;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #666;
    font-size: 12px;
    gap: 4px;
    cursor: pointer;
  }
}
</style>
