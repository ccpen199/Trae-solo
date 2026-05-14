<template>
  <div class="search-container">
    <van-nav-bar>
      <template #left>
        <van-icon name="arrow-left" @click="goBack" />
      </template>
      <template #title>
        <van-search 
          v-model="keyword" 
          placeholder="搜索商品"
          @search="handleSearch"
          show-action
        />
      </template>
    </van-nav-bar>

    <div class="search-content">
      <div class="hot-section">
        <h3 class="section-title">热门搜索</h3>
        <div class="hot-list">
          <span 
            v-for="keyword in hotKeywords" 
            :key="keyword" 
            class="hot-tag"
            @click="keyword = keyword; handleSearch()"
          >
            {{ keyword }}
          </span>
        </div>
      </div>

      <div class="history-section">
        <div class="section-header">
          <h3 class="section-title">搜索历史</h3>
          <van-icon name="trash" class="clear-icon" @click="clearHistory" />
        </div>
        <div class="history-list">
          <span 
            v-for="(item, index) in searchHistory" 
            :key="index" 
            class="history-tag"
            @click="keyword = item; handleSearch()"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const keyword = ref('')
const hotKeywords = ['西红柿', '苹果', '五花肉', '牛奶', '鸡蛋', '香蕉']
const searchHistory = ref(['西红柿', '苹果', '牛奶'])

const goBack = () => {
  router.back()
}

const handleSearch = () => {
  if (keyword.value && !searchHistory.value.includes(keyword.value)) {
    searchHistory.value.unshift(keyword.value)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
  }
  showToast(`搜索: ${keyword.value}`)
}

const clearHistory = () => {
  searchHistory.value = []
}
</script>

<style scoped>
.search-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.search-content {
  padding: 16px;
}

.section-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.clear-icon {
  color: #999;
  font-size: 16px;
}

.hot-list, .history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  display: inline-block;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe5d9 100%);
  color: #ff6b35;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
}

.history-tag {
  display: inline-block;
  background: #fff;
  color: #666;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  border: 1px solid #eee;
}
</style>
