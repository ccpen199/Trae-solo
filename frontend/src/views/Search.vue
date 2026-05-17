<template>
  <div class="search-page">
    <div class="search-header">
      <el-input
        v-model="keyword"
        placeholder="搜索笔记、商品、用户"
        size="large"
        @keyup.enter="doSearch"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button type="primary" @click="doSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <div v-if="!hasSearched" class="search-suggestions">
      <div class="section">
        <h3 class="section-title">🔥 热门搜索</h3>
        <div class="tag-list">
          <el-tag
            v-for="tag in hotTags"
            :key="tag"
            size="large"
            class="hot-tag"
            @click="searchTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <div v-if="searchHistory.length > 0" class="section">
        <div class="section-header">
          <h3 class="section-title">🕐 搜索历史</h3>
          <el-button type="text" size="small" @click="clearHistory">清空</el-button>
        </div>
        <div class="tag-list">
          <el-tag
            v-for="tag in searchHistory"
            :key="tag"
            size="large"
            closable
            @close="removeHistory(tag)"
            @click="searchTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>

    <div v-else class="search-results">
      <el-tabs v-model="resultType">
        <el-tab-pane label="笔记" name="notes" />
        <el-tab-pane label="商品" name="products" />
        <el-tab-pane label="用户" name="users" />
      </el-tabs>

      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="isEmpty" class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">没有找到相关内容</div>
      </div>

      <div v-else>
        <div v-if="resultType === 'notes'" class="masonry-grid">
          <div v-for="note in searchResults.notes" :key="note.id" class="masonry-item">
            <NoteCard :note="note" />
          </div>
        </div>

        <div v-if="resultType === 'products'" class="products-grid">
          <ProductCard
            v-for="product in searchResults.products"
            :key="product.id"
            :product="product"
          />
        </div>

        <div v-if="resultType === 'users'" class="users-list">
          <div
            v-for="user in searchResults.users"
            :key="user.id"
            class="user-item card"
            @click="goToUser(user.id)"
          >
            <el-avatar :size="64" :src="user.avatar" />
            <div class="user-info">
              <h4 class="username">{{ user.nickname }}</h4>
              <p class="user-bio">{{ user.bio || '暂无简介' }}</p>
            </div>
            <el-button type="primary" size="small">关注</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import request from '@/utils/request'
import NoteCard from '@/components/NoteCard.vue'
import ProductCard from '@/components/ProductCard.vue'

const router = useRouter()
const route = useRoute()

const keyword = ref('')
const resultType = ref('notes')
const loading = ref(false)
const hasSearched = ref(false)
const searchHistory = ref([])
const searchResults = ref({
  notes: [],
  products: [],
  users: []
})

const hotTags = [
  '穿搭分享', '美食探店', '旅行日记', '护肤心得',
  '健身打卡', '家居好物', '数码评测', '职场经验'
]

const isEmpty = computed(() => {
  const result = searchResults.value[resultType.value]
  return !result || result.length === 0
})

const fetchHotSearch = async () => {
  try {
    const res = await request.get('/search/hot')
    if (res.data && res.data.length > 0) {
      hotTags.splice(0, hotTags.length, ...res.data)
    }
  } catch (error) {
    console.error('获取热门搜索失败:', error)
  }
}

const fetchHistory = async () => {
  try {
    const res = await request.get('/search/history')
    searchHistory.value = res.data || []
  } catch (error) {
    console.error('获取搜索历史失败:', error)
  }
}

const doSearch = async () => {
  if (!keyword.value.trim()) return

  loading.value = true
  hasSearched.value = true

  try {
    const res = await request.get('/search', {
      params: { keyword: keyword.value }
    })
    searchResults.value = res.data || {}
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const searchTag = (tag) => {
  keyword.value = tag
  doSearch()
}

const clearHistory = async () => {
  try {
    await request.delete('/search/history')
    searchHistory.value = []
  } catch (error) {
    console.error('清空历史失败:', error)
  }
}

const removeHistory = (tag) => {
  searchHistory.value = searchHistory.value.filter(t => t !== tag)
}

const goToUser = (userId) => {
  router.push(`/user/${userId}`)
}

onMounted(() => {
  fetchHotSearch()
  fetchHistory()

  if (route.query.keyword) {
    keyword.value = route.query.keyword
    doSearch()
  }
})
</script>

<style lang="scss" scoped>
.search-page {
  .search-header {
    margin-bottom: 24px;

    :deep(.el-input__wrapper) {
      border-radius: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  .search-suggestions {
    .section {
      margin-bottom: 32px;

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        .hot-tag {
          cursor: pointer;
          background: linear-gradient(135deg, #fff5f6 0%, #ffe8eb 100%);
          border-color: #ffccd5;
          color: #ff2442;

          &:hover {
            background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
            color: #fff;
          }
        }
      }
    }
  }

  .search-results {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .user-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      .user-info {
        flex: 1;

        .username {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .user-bio {
          font-size: 13px;
          color: #999;
          margin: 0;
        }
      }
    }
  }
}
</style>
