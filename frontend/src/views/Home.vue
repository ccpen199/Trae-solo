<template>
  <div class="home-container">
    <el-header class="header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/home')">
          <el-icon :size="28"><ChatDotRound /></el-icon>
          <span>BBS论坛</span>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          class="nav-menu"
          mode="horizontal"
          background-color="transparent"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/home" @click="$router.push('/home')">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="categories">
            <template #title>
              <el-icon><Menu /></el-icon>
              <span>分类浏览</span>
            </template>
            <el-menu-item 
              v-for="category in categories" 
              :key="category.id"
              :index="String(category.id)"
              @click="goToCategory(category)"
            >
              {{ category.categoryName }}
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
        
        <div class="header-right">
          <template v-if="userStore.isLoggedIn">
            <el-button type="primary" @click="$router.push('/create')">
              <el-icon><Edit /></el-icon>
              发帖
            </el-button>
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" class="avatar">
                  {{ userStore.userInfo?.nickname?.charAt(0) || userStore.userInfo?.username?.charAt(0) }}
                </el-avatar>
                <span>{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="userStore.isAdmin" command="admin">
                    <el-icon><Setting /></el-icon>
                    后台管理
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>
    
    <el-main class="main">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-card class="section-card">
            <template #header>
              <div class="section-title">
                <el-icon><TrendCharts /></el-icon>
                <span>最新帖子</span>
              </div>
            </template>
            
            <div class="article-list" v-loading="loading">
              <div 
                v-for="article in articles" 
                :key="article.id" 
                class="article-item"
                @click="goToArticle(article.id)"
              >
                <div class="article-left">
                  <el-avatar :size="45" class="author-avatar">
                    {{ article.authorNickname?.charAt(0) || article.authorName?.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="article-right">
                  <div class="article-title">
                    <el-tag v-if="article.isTop" type="danger" effect="light" size="small">置顶</el-tag>
                    <el-tag v-if="article.isLocked" type="warning" effect="light" size="small">锁定</el-tag>
                    <span>{{ article.title }}</span>
                  </div>
                  <div class="article-meta">
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ article.authorNickname || article.authorName }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Collection /></el-icon>
                      {{ article.categoryName }}
                    </span>
                    <span class="meta-item" v-if="article.subCategoryName">
                      <el-icon><Folder /></el-icon>
                      {{ article.subCategoryName }}
                    </span>
                    <span class="meta-item">
                      <el-icon><View /></el-icon>
                      {{ article.viewCount }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      {{ formatTime(article.createdAt) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <el-empty v-if="articles.length === 0" description="暂无帖子" />
            </div>
            
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50]"
                :total="total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadArticles"
                @current-change="loadArticles"
              />
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="section-card">
            <template #header>
              <div class="section-title">
                <el-icon><DataAnalysis /></el-icon>
                <span>论坛统计</span>
              </div>
            </template>
            <div class="stat-item">
              <span class="stat-label">帖子总数</span>
              <span class="stat-value">{{ statistics.totalArticles || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总访问量</span>
              <span class="stat-value">{{ statistics.totalViews || 0 }}</span>
            </div>
          </el-card>
          
          <el-card class="section-card" style="margin-top: 20px;">
            <template #header>
              <div class="section-title">
                <el-icon><Menu /></el-icon>
                <span>分类导航</span>
              </div>
            </template>
            <div class="category-list">
              <div 
                v-for="category in categories" 
                :key="category.id"
                class="category-item"
                @click="goToCategory(category)"
              >
                <span class="category-name">{{ category.categoryName }}</span>
                <el-tag v-if="category.subCategories?.length" type="info" size="small">
                  {{ category.subCategories.length }} 个子类
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>
    
    <el-footer class="footer">
      <p>BBS论坛 © 2024 - JavaWeb课程项目</p>
    </el-footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getPublicArticles, getStatistics } from '@/api/article'
import { getPublicCategories } from '@/api/category'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const articles = ref([])
const categories = ref([])
const statistics = ref({})
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const activeMenu = computed(() => route.path)

const loadArticles = async () => {
  loading.value = true
  try {
    const res = await getPublicArticles({
      current: currentPage.value,
      size: pageSize.value
    })
    articles.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await getPublicCategories()
    categories.value = res.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadStatistics = async () => {
  try {
    const res = await getStatistics()
    statistics.value = res.data
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const goToArticle = (id) => {
  router.push(`/articles/${id}`)
}

const goToCategory = (category) => {
  router.push({
    path: '/articles',
    query: { categoryId: category.id }
  })
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const handleCommand = (command) => {
  if (command === 'admin') {
    router.push('/admin/dashboard')
  } else if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/home')
  }
}

onMounted(() => {
  loadArticles()
  loadCategories()
  loadStatistics()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  height: 60px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.nav-menu {
  border-bottom: none;
  background: transparent;
}

.nav-menu .el-menu-item,
.nav-menu .el-sub-menu__title {
  color: rgba(255, 255, 255, 0.9) !important;
  border-bottom: none;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-sub-menu__title:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
}

.avatar {
  background: linear-gradient(135deg, #ffd04b, #ff9a56);
}

.main {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
  flex: 1;
}

.section-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.article-list {
  min-height: 300px;
}

.article-item {
  display: flex;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.article-item:hover {
  background-color: #f9f9f9;
}

.article-item:last-child {
  border-bottom: none;
}

.author-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.article-right {
  flex: 1;
}

.article-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.stat-value {
  color: #409eff;
  font-size: 20px;
  font-weight: bold;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: color 0.2s;
}

.category-item:hover {
  color: #409eff;
}

.category-item:last-child {
  border-bottom: none;
}

.category-name {
  font-size: 14px;
  color: #303133;
}

.footer {
  background: #f5f7fa;
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}
</style>
