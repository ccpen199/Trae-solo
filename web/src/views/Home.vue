<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1>发现分享，连接社区</h1>
          <p class="subtitle">在这里分享知识、交流想法、结识志同道合的朋友</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="$router.push('/resources')">
              浏览资源
            </el-button>
            <el-button size="large" @click="$router.push('/groups')">
              发现小组
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="container">
        <div class="content-grid">
          <div class="main-column">
            <div class="section-header">
              <h2>最新资源</h2>
              <el-link type="primary" @click="$router.push('/resources')">查看更多 →</el-link>
            </div>
            
            <div class="resource-list" v-loading="loading">
              <div 
                v-for="resource in resources" 
                :key="resource.id" 
                class="resource-card"
                @click="$router.push(`/resources/${resource.id}`)"
              >
                <div class="resource-cover" v-if="resource.coverImage">
                  <img :src="resource.coverImage" alt="cover" />
                </div>
                <div class="resource-cover placeholder" v-else>
                  <el-icon size="48"><Document /></el-icon>
                </div>
                <div class="resource-info">
                  <h3 class="resource-title">{{ resource.title }}</h3>
                  <p class="resource-desc">{{ resource.description || '暂无描述' }}</p>
                  <div class="resource-meta">
                    <el-avatar :size="24">
                      <img v-if="resource.author?.avatar" :src="resource.author.avatar" />
                      <el-icon v-else><User /></el-icon>
                    </el-avatar>
                    <span class="author-name">{{ resource.author?.nickname || resource.author?.username }}</span>
                    <span class="divider">·</span>
                    <span class="category">{{ resource.category?.name }}</span>
                    <span class="divider">·</span>
                    <span class="views">
                      <el-icon><View /></el-icon>
                      {{ resource.viewCount }}
                    </span>
                  </div>
                </div>
              </div>
              
              <el-empty v-if="!loading && resources.length === 0" description="暂无资源" />
            </div>
          </div>

          <div class="side-column">
            <div class="side-card categories-card">
              <h3 class="side-title">资源分类</h3>
              <div class="category-list">
                <div 
                  v-for="cat in categories" 
                  :key="cat.id"
                  class="category-item"
                  @click="$router.push({ path: '/resources', query: { categoryId: cat.id } })"
                >
                  <span class="category-name">{{ cat.name }}</span>
                </div>
              </div>
            </div>

            <div class="side-card">
              <h3 class="side-title">热门小组</h3>
              <div class="group-list" v-loading="groupsLoading">
                <div 
                  v-for="group in hotGroups" 
                  :key="group.id"
                  class="group-item"
                  @click="$router.push(`/groups/${group.id}`)"
                >
                  <el-avatar :size="40">
                    <img v-if="group.avatar" :src="group.avatar" />
                    <el-icon v-else><ChatDotRound /></el-icon>
                  </el-avatar>
                  <div class="group-info">
                    <h4 class="group-name">{{ group.name }}</h4>
                    <p class="group-stats">
                      <span>{{ group.memberCount }} 成员</span>
                      <span>{{ group.postCount }} 帖子</span>
                    </p>
                  </div>
                </div>
                <el-empty v-if="!groupsLoading && hotGroups.length === 0" :image-size="60" description="暂无小组" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  getResources, 
  getCategories, 
  getGroups 
} from '@/api'
import {
  Document,
  User,
  View,
  ChatDotRound
} from '@element-plus/icons-vue'

const loading = ref(false)
const groupsLoading = ref(false)
const resources = ref([])
const categories = ref([])
const hotGroups = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const [resourcesRes, categoriesRes] = await Promise.all([
      getResources({ page: 1, limit: 8 }),
      getCategories()
    ])
    resources.value = resourcesRes.data?.resources || []
    categories.value = categoriesRes.data?.categories || []
  } catch (e) {
    console.error('Fetch data error:', e)
  } finally {
    loading.value = false
  }
}

const fetchGroups = async () => {
  groupsLoading.value = true
  try {
    const res = await getGroups({ page: 1, limit: 5 })
    hotGroups.value = res.data?.groups || []
  } catch (e) {
    console.error('Fetch groups error:', e)
  } finally {
    groupsLoading.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchGroups()
})
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 64px);
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.hero-content {
  text-align: center;
  color: #fff;
}

.hero-content h1 {
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 16px;
}

.hero-content .subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.main-content {
  padding: 40px 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
}

.main-column {
  min-width: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-card {
  display: flex;
  gap: 20px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.resource-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.resource-cover {
  width: 160px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.resource-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resource-cover.placeholder {
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

.author-name {
  color: #606266;
}

.divider {
  color: #dcdfe6;
}

.category {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.views {
  display: flex;
  align-items: center;
  gap: 4px;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.side-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e4e7ed;
}

.side-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-item {
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.group-item:hover {
  background: #f5f7fa;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-stats {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .side-column {
    order: -1;
  }
  
  .hero-content h1 {
    font-size: 32px;
  }
}

@media (max-width: 768px) {
  .resource-card {
    flex-direction: column;
  }
  
  .resource-cover {
    width: 100%;
    height: 180px;
  }
}
</style>
