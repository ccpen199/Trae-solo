<template>
  <div class="search-page">
    <van-nav-bar left-arrow @click-left="router.back()">
      <template #title>
        <van-search
          v-model="keyword"
          placeholder="搜索课程、动作"
          show-action
          autofocus
          @search="handleSearch"
          @cancel="handleCancel"
        />
      </template>
    </van-nav-bar>
    
    <van-tabs v-model:active="activeCategory" class="search-tabs">
      <van-tab title="全部" name="all" />
      <van-tab title="课程" name="course" />
      <van-tab title="动作" name="action" />
      <van-tab title="攻略" name="guide" />
      <van-tab title="用户" name="user" />
      <van-tab title="话题" name="topic" />
      <van-tab title="商品" name="product" />
      <van-tab title="饮食" name="diet" />
    </van-tabs>
    
    <div class="search-content">
      <LoadingState v-if="loading" />
      
      <div v-else-if="!keyword && !loading" class="history-section">
        <div v-if="searchHistory.length > 0" class="history-list">
          <div class="section-header">
            <h3>搜索历史</h3>
            <van-button type="default" size="small" @click="clearHistory">清空</van-button>
          </div>
          <div class="tags">
            <van-tag
              v-for="(item, index) in searchHistory"
              :key="index"
              type="default"
              size="large"
              @click="searchByKeyword(item.keyword)"
            >
              {{ item.keyword }}
            </van-tag>
          </div>
        </div>
        
        <div class="hot-section">
          <div class="section-header">
            <h3>🔥 热门搜索</h3>
          </div>
          <div class="tags">
            <van-tag
              v-for="(item, index) in hotKeywords"
              :key="index"
              type="primary"
              size="large"
              plain
              @click="searchByKeyword(item)"
            >
              {{ item }}
            </van-tag>
          </div>
        </div>
      </div>
      
      <div v-else-if="keyword && searchResults.length === 0 && !loading" class="empty-result">
        <div class="empty-icon">🔍</div>
        <p>没有找到相关结果</p>
        <p class="hint">试试其他关键词吧</p>
      </div>
      
      <div v-else class="results-list">
        <div
          v-for="item in searchResults"
          :key="item.id"
          class="result-item"
          @click="goToDetail(item)"
        >
          <div class="result-icon">{{ item.cover || item.icon || '📚' }}</div>
          <div class="result-info">
            <h4>{{ item.title || item.name }}</h4>
            <p v-if="item.description" class="result-desc">{{ item.description }}</p>
            <div v-if="item.duration" class="result-meta">
              <span>⏱ {{ item.duration }}分钟</span>
              <span v-if="item.calories">🔥 {{ item.calories }}千卡</span>
            </div>
          </div>
          <van-icon name="arrow" class="result-arrow" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { searchApi } from '../api'
import LoadingState from '../components/LoadingState.vue'

const router = useRouter()

const keyword = ref('')
const activeCategory = ref('all')
const loading = ref(false)
const searchResults = ref([])
const searchHistory = ref([])
const hotKeywords = ref(['HIIT', '腹肌', '减脂', '瑜伽', '跑步', '深蹲', '平板支撑', '马甲线', '瘦腿', '翘臀'])

async function handleSearch() {
  if (!keyword.value.trim()) return
  
  loading.value = true
  try {
    const data = await searchApi.search({
      keyword: keyword.value,
      category: activeCategory.value
    })
    searchResults.value = data?.results || []
  } catch (err) {
    console.error('搜索失败:', err)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  keyword.value = ''
  searchResults.value = []
}

function searchByKeyword(word) {
  keyword.value = word
  handleSearch()
}

async function loadHistory() {
  try {
    const data = await searchApi.getHistory()
    searchHistory.value = data?.history || []
  } catch (err) {
    console.error('加载历史失败:', err)
  }
}

async function clearHistory() {
  try {
    await searchApi.clearHistory()
    searchHistory.value = []
  } catch (err) {
    console.error('清空历史失败:', err)
  }
}

function goToDetail(item) {
  if (item.type === 'course' || item.category) {
    router.push(`/course/${item.id}`)
  } else if (item.course_id) {
    router.push(`/course/${item.course_id}`)
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style lang="less" scoped>
.search-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-tabs {
  background: white;
}

.search-content {
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.history-list,
.hot-section {
  margin-bottom: 24px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.van-tag) {
  padding: 8px 16px;
  font-size: 14px;
}

.empty-result {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.empty-result p {
  color: #999;
  font-size: 14px;
  margin-bottom: 4px;
}

.empty-result .hint {
  font-size: 12px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
}

.result-icon {
  font-size: 36px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
  border-radius: 10px;
}

.result-info {
  flex: 1;
}

.result-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.result-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.result-arrow {
  color: #ccc;
}
</style>
