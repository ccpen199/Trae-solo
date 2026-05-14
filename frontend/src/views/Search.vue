<template>
  <div class="search-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <div class="search-input-wrapper">
        <input 
          type="text" 
          v-model="keyword" 
          class="search-input"
          placeholder="搜索商家或商品"
          autofocus
          @keyup.enter="handleSearch"
        />
        <span v-if="keyword" class="clear-btn" @click="keyword = ''">✕</span>
      </div>
      <button class="search-btn" @click="handleSearch">搜索</button>
    </div>

    <div class="search-history" v-if="historyList.length > 0">
      <div class="history-header">
        <span class="history-title">搜索历史</span>
        <span class="clear-history" @click="clearHistory">清空</span>
      </div>
      <div class="history-tags">
        <span 
          v-for="item in historyList" 
          :key="item" 
          class="history-tag"
          @click="searchKeyword(item)"
        >{{ item }}</span>
      </div>
    </div>

    <div class="hot-search">
      <div class="hot-header">
        <span class="hot-icon">🔥</span>
        <span class="hot-title">热门搜索</span>
      </div>
      <div class="hot-list">
        <div 
          v-for="(item, index) in hotList" 
          :key="item.id" 
          class="hot-item"
          @click="searchKeyword(item.keyword)"
        >
          <span class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
          <span class="hot-keyword">{{ item.keyword }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { homeAPI } from '@/api'

const router = useRouter()
const keyword = ref('')
const historyList = ref([])
const hotList = ref([])

onMounted(() => {
  loadHotSearch()
  loadHistory()
})

async function loadHotSearch() {
  try {
    const result = await homeAPI.getHotSearch()
    if (result.success) {
      hotList.value = result.data
    }
  } catch (err) {
    console.error('加载热门搜索失败:', err)
  }
}

function loadHistory() {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    historyList.value = JSON.parse(history)
  }
}

function saveHistory(keyword) {
  if (!historyList.value.includes(keyword)) {
    historyList.value.unshift(keyword)
    if (historyList.value.length > 10) {
      historyList.value = historyList.value.slice(0, 10)
    }
    localStorage.setItem('searchHistory', JSON.stringify(historyList.value))
  }
}

function clearHistory() {
  historyList.value = []
  localStorage.removeItem('searchHistory')
}

function searchKeyword(keywordStr) {
  keyword.value = keywordStr
  handleSearch()
}

function handleSearch() {
  const searchKeyword = keyword.value.trim()
  if (!searchKeyword) return
  
  saveHistory(searchKeyword)
  router.push({ path: '/search-result', query: { keyword: searchKeyword } })
}
</script>

<style scoped>
.search-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 20px;
  font-size: 14px;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #999;
  cursor: pointer;
}

.search-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
}

.search-history {
  background: #fff;
  margin: 12px;
  padding: 16px;
  border-radius: 12px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.clear-history {
  font-size: 12px;
  color: #999;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
}

.hot-search {
  background: #fff;
  margin: 0 12px;
  padding: 16px;
  border-radius: 12px;
}

.hot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.hot-icon {
  font-size: 16px;
}

.hot-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hot-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 12px;
  color: #999;
}

.hot-rank.top {
  background: #ff6b35;
  color: #fff;
}

.hot-keyword {
  font-size: 14px;
  color: #333;
}
</style>