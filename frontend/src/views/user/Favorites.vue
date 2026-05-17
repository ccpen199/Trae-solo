<template>
  <div class="page-container">
    <van-nav-bar title="我的收藏" left-arrow @click-left="$router.back()" />

    <div class="page-content favorites-content" v-loading="loading">
      <div class="error-state" v-if="error">
        <p>加载失败</p>
        <van-button type="primary" size="small" class="retry-btn" @click="loadFavorites">重试</van-button>
      </div>

      <div class="empty-state" v-else-if="!loading && poems.length === 0">
        <div class="empty-icon">📚</div>
        <p>暂无收藏</p>
      </div>

      <div v-else class="poems-list">
        <div
          class="poem-item"
          v-for="poem in poems"
          :key="poem.id"
          @click="$router.push(`/poem/${poem.id}`)"
        >
          <div class="poem-excerpt">{{ poem.excerpt }}</div>
          <div class="poem-info">
            <span class="poem-title">{{ poem.title }}</span>
            <span class="poem-author">【{{ poem.dynasty }}】{{ poem.author }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { poemsApi } from '@/api'

const loading = ref(false)
const error = ref(false)
const poems = ref([])

const loadFavorites = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await poemsApi.getFavorites({})
    poems.value = res.data || []
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFavorites()
})
</script>

<style lang="less" scoped>
.favorites-content {
  padding: 12px;
}

.poems-list {
  .poem-item {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 12px;

    .poem-excerpt {
      font-size: 16px;
      color: #333;
      line-height: 1.8;
      margin-bottom: 16px;
      font-weight: 500;
    }

    .poem-info {
      .poem-title {
        display: block;
        font-size: 14px;
        color: #333;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .poem-author {
        font-size: 12px;
        color: #666;
      }
    }
  }
}
</style>
