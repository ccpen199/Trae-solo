<template>
  <div class="search-container">
    <el-header class="search-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
        <div class="search-input-wrap">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索星球或主题"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
      </div>
    </el-header>

    <el-main class="search-main">
      <div class="search-toolbar">
        <el-tabs v-model="searchType" class="search-tabs">
          <el-tab-pane label="搜索星球" name="planet" />
          <el-tab-pane label="搜索主题" name="topic" />
        </el-tabs>
        <span v-if="searchKeyword" class="result-count">
          共找到 {{ total }} 条结果
        </span>
      </div>

      <div v-if="loading" class="loading-wrap">
        <el-skeleton :rows="4" animated />
      </div>

      <div v-else-if="results.length === 0 && searchKeyword" class="empty-wrap">
        <el-icon :size="48" color="#909399"><Search /></el-icon>
        <p class="empty-text">没有找到相关结果</p>
        <p class="empty-tip">换个关键词试试吧</p>
      </div>

      <div v-else-if="!searchKeyword" class="empty-wrap">
        <el-icon :size="48" color="#909399"><Search /></el-icon>
        <p class="empty-text">输入关键词开始搜索</p>
      </div>

      <template v-else-if="searchType === 'planet'">
        <div class="planet-grid">
          <el-card
            v-for="planet in results"
            :key="planet.id"
            class="planet-card"
            @click="goPlanetDetail(planet.id)"
          >
            <div class="planet-cover">
              <span class="planet-initial">{{ planet.name.charAt(0) }}</span>
            </div>
            <h3 class="planet-name">{{ planet.name }}</h3>
            <p class="planet-desc">{{ planet.description || '暂无描述' }}</p>
            <div class="planet-footer">
              <span class="stat-item">
                <el-icon><User /></el-icon>
                {{ planet.member_count || 0 }} 成员
              </span>
              <el-tag
                v-if="planet.user_role"
                :type="planet.user_role === 'owner' ? 'danger' : 'success'"
                size="small"
              >
                {{ planet.user_role === 'owner' ? '创建者' : '已加入' }}
              </el-tag>
            </div>
          </el-card>
        </div>
      </template>

      <template v-else>
        <div class="topic-list">
          <el-card
            v-for="topic in results"
            :key="topic.id"
            class="topic-card"
            @click="goTopicDetail(topic.id)"
          >
            <div class="topic-content">
              <el-avatar :size="40">
                {{ topic.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <div class="topic-body">
                <div class="topic-meta">
                  <span class="topic-author">{{ topic.nickname }}</span>
                  <span class="topic-planet">{{ topic.planet_name }}</span>
                  <el-tag v-if="topic.is_question" type="warning" size="small">提问</el-tag>
                </div>
                <h3 class="topic-title">{{ topic.title }}</h3>
                <p class="topic-text">{{ topic.content }}</p>
                <div class="topic-stats">
                  <span class="stat-item">
                    <el-icon><View /></el-icon>
                    {{ topic.view_count || 0 }}
                  </span>
                  <span class="stat-item">
                    <el-icon><ChatDotRound /></el-icon>
                    {{ topic.comment_count || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </template>

      <div v-if="results.length > 0" class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handleSearch"
        />
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchPlanets } from '@/api/planet'
import { searchTopics } from '@/api/topic'
import { ArrowLeft, User, Search, View, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const searchKeyword = ref('')
const searchType = ref('planet')
const results = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    return
  }

  loading.value = true

  try {
    const params = {
      keyword: searchKeyword.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      planet_id: route.query.planet_id
    }

    let res
    if (searchType.value === 'planet') {
      res = await searchPlanets(params)
    } else {
      res = await searchTopics(params)
    }

    results.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const goPlanetDetail = (id) => {
  router.push(`/planet/${id}`)
}

const goTopicDetail = (id) => {
  router.push(`/topic/${id}`)
}

onMounted(() => {
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword
    handleSearch()
  }
})
</script>

<style scoped>
.search-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.search-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0 24px;
  height: 64px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.search-input-wrap {
  flex: 1;
  max-width: 600px;
  margin-left: 16px;
}

.search-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.search-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-tabs {
  margin-bottom: 0;
}

.result-count {
  color: #909399;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-text {
  color: #606266;
  margin-top: 16px;
  margin-bottom: 4px;
}

.empty-tip {
  color: #909399;
  font-size: 13px;
}

.planet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .planet-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .planet-grid {
    grid-template-columns: 1fr;
  }
}

.planet-card {
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.planet-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.planet-cover {
  height: 96px;
  background: linear-gradient(90deg, #66b1ff, #b37feb);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.planet-initial {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.planet-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.planet-desc {
  color: #909399;
  font-size: 14px;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  min-height: 42px;
}

.planet-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topic-card {
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.topic-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.topic-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.topic-body {
  flex: 1;
  min-width: 0;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.topic-author {
  font-weight: 500;
  color: #303133;
}

.topic-planet {
  color: #909399;
  font-size: 13px;
}

.topic-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.topic-text {
  color: #606266;
  font-size: 14px;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.topic-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
