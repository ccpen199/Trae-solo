<template>
  <div class="search-page">
    <div class="container">
    <div class="page-header">
      <h1>搜索结果</h1>
      <p class="subtitle">为您找到相关结果</p>
    </div>

    <div class="search-form">
      <el-input
        v-model="keyword"
        placeholder="搜索资源、用户、小组..."
        prefix-icon="Search"
        size="large"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <el-tabs v-model="activeTab" class="search-tabs">
      <el-tab-pane label="资源" name="resources">
        <div class="results-list" v-loading="loading">
          <div
            v-for="item in resources"
            :key="item.id"
            class="result-item resource-item"
            @click="$router.push(`/resources/${item.id}`)"
          >
            <div class="item-cover" v-if="item.coverImage">
              <img :src="item.coverImage" alt="cover" />
            </div>
            <div class="item-info">
              <h3 class="item-title">{{ item.title }}</h3>
              <p class="item-desc">{{ item.description || '暂无描述' }}</p>
              <div class="item-meta">
                <span>{{ item.author?.nickname || item.author?.username }}</span>
                <span>{{ formatTime(item.createdAt) }}</span>
              </div>
            </div>
          </div>
          <el-empty v-if="!loading && resources.length === 0" description="暂无相关资源" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="用户" name="users">
        <div class="results-list" v-loading="loading">
          <div
            v-for="item in users"
            :key="item.id"
            class="result-item user-item"
            @click="$router.push(`/users/${item.id}`)"
          >
            <el-avatar :size="64">
              <img v-if="item.avatar" :src="item.avatar" />
              <el-icon v-else size="32"><User /></el-icon>
            </el-avatar>
            <div class="item-info">
              <h3 class="item-title">{{ item.nickname || item.username }}</h3>
              <p class="item-desc" v-if="item.bio">{{ item.bio }}</p>
              <p class="item-desc" v-else>@{{ item.username }}</p>
            </div>
          </div>
          <el-empty v-if="!loading && users.length === 0" description="暂无相关用户" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="小组" name="groups">
        <div class="results-list" v-loading="loading">
          <div
            v-for="item in groups"
            :key="item.id"
            class="result-item group-item"
            @click="$router.push(`/groups/${item.id}`)"
          >
            <el-avatar :size="64">
              <img v-if="item.avatar" :src="item.avatar" />
              <el-icon v-else size="32"><ChatDotRound /></el-icon>
            </el-avatar>
            <div class="item-info">
              <h3 class="item-title">{{ item.name }}</h3>
              <p class="item-desc">{{ item.description || '暂无描述' }}</p>
              <div class="item-meta">
                <span>{{ item.memberCount }} 成员</span>
                <span>{{ item.postCount }} 帖子</span>
              </div>
            </div>
          </div>
          <el-empty v-if="!loading && groups.length === 0" description="暂无相关小组" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getResources, searchUsers, getGroups } from '@/api'
import { User, ChatDotRound, Search } from '@element-plus/icons-vue'

const route = useRoute()

const keyword = ref('')
const activeTab = ref('resources')
const loading = ref(false)
const resources = ref([])
const users = ref([])
const groups = ref([])

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleDateString('zh-CN')
}

const handleSearch = async () => {
  if (!keyword.value.trim()) return
  
  loading.value = true
  try {
    const [resourcesRes, usersRes, groupsRes] = await Promise.all([
      getResources({ keyword: keyword.value, page: 1, limit: 20 }),
      searchUsers({ keyword: keyword.value, page: 1, limit: 20 }),
      getGroups({ keyword: keyword.value, page: 1, limit: 20 }),
    ])
    
    resources.value = resourcesRes.data?.resources || []
    users.value = usersRes.data?.users || []
    groups.value = groupsRes.data?.groups || []
  } catch (e) {
    console.error('Search error:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => route.query.keyword,
  (newKeyword) => {
    if (newKeyword) {
      keyword.value = newKeyword
      handleSearch()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (route.query.keyword) {
    keyword.value = route.query.keyword
  }
})
</script>

<style scoped>
.search-page {
  min-height: calc(100vh - 64px);
  padding: 40px 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-header .subtitle {
  color: #666;
  font-size: 15px;
}

.search-form {
  max-width: 600px;
  margin: 0 auto 40px;
}

.search-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 0 24px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 0;
}

.result-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e4e7ed;
}

.result-item:hover {
  background: #f9fafc;
}

.item-cover {
  width: 120px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}
</style>
