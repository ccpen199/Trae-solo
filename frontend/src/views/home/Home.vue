<template>
  <div class="home-page">
    <header class="site-header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <h1>淘宝产品吧</h1>
            <span class="subtitle">产品级资料分享社区</span>
          </div>
          <nav class="nav">
            <router-link to="/" class="active">首页</router-link>
            <template v-if="userStore.isLoggedIn">
              <router-link v-if="userStore.isAdmin" to="/admin" class="admin-link">管理后台</router-link>
              <el-button type="text" @click="handleLogout" class="logout-btn">退出登录</el-button>
              <span class="user-name">{{ userStore.username }}</span>
            </template>
            <template v-else>
              <router-link to="/login">登录</router-link>
              <router-link to="/register">注册</router-link>
            </template>
          </nav>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        <section class="hero-section">
          <div class="hero-content">
            <h2>整合淘宝资讯、论坛、博客和用户原创内容</h2>
            <p>让用户在购买前获得产品级资料、经验分享和买家秀</p>
            <div class="hero-buttons">
              <el-button type="primary" size="large" @click="scrollToBars">
                探索产品吧
              </el-button>
              <el-button size="large" @click="scrollToEntries">
                浏览词条
              </el-button>
            </div>
          </div>
        </section>

        <section class="categories-section" v-if="categories.length > 0">
          <div class="section-header">
            <h3>产品分类</h3>
          </div>
          <div class="categories-nav">
            <el-tag
              v-for="cat in categories"
              :key="cat.id"
              :type="selectedCategory === cat.id ? 'primary' : 'info'"
              size="large"
              class="category-tag"
              @click="selectCategory(cat.id)"
            >
              {{ cat.name }}
            </el-tag>
          </div>
        </section>

        <div class="content-grid">
          <section class="bars-section main-section">
            <div class="section-header">
              <h3>热门产品吧</h3>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索产品吧"
                style="width: 240px"
                clearable
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </div>

            <el-skeleton v-if="barsLoading" :count="4" animated />

            <template v-else-if="barsError">
              <div class="error-state">
                <el-icon class="error-icon"><WarningFilled /></el-icon>
                <p>加载失败：{{ barsError }}</p>
                <el-button type="primary" @click="fetchBars">重试</el-button>
              </div>
            </template>

            <template v-else-if="bars.length === 0">
              <div class="empty-state">
                <el-empty description="暂无产品吧" />
              </div>
            </template>

            <template v-else>
              <div class="bars-grid">
                <div
                  v-for="bar in bars"
                  :key="bar.id"
                  class="bar-card"
                  @click="goToBar(bar.id)"
                >
                  <div class="bar-cover">
                    <img v-if="bar.cover_image" :src="bar.cover_image" :alt="bar.name" />
                    <div v-else class="bar-cover-placeholder">
                      <el-icon><Collection /></el-icon>
                    </div>
                  </div>
                  <div class="bar-info">
                    <h4 class="bar-name text-ellipsis">{{ bar.name }}</h4>
                    <p class="bar-desc text-ellipsis">{{ bar.description || '暂无描述' }}</p>
                    <div class="bar-stats">
                      <span><el-icon><View /></el-icon> {{ bar.view_count || 0 }}</span>
                      <span><el-icon><Collection /></el-icon> {{ bar.entry_count || 0 }} 词条</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pagination-wrap" v-if="totalPages > 1">
                <el-pagination
                  v-model:current-page="page"
                  :page-size="pageSize"
                  :total="total"
                  layout="prev, pager, next"
                  @current-change="handlePageChange"
                />
              </div>
            </template>
          </section>

          <aside class="sidebar-section">
            <div class="sidebar-card">
              <h4 class="sidebar-title">热门词条</h4>
              <el-skeleton v-if="entriesLoading" :count="5" animated />
              <div v-else-if="hotEntries.length > 0" class="entry-list">
                <div
                  v-for="entry in hotEntries.slice(0, 5)"
                  :key="entry.id"
                  class="entry-item"
                  @click="goToEntry(entry.id)"
                >
                  <span class="entry-title text-ellipsis">{{ entry.title }}</span>
                  <span class="entry-bar text-ellipsis">{{ entry.bar_name }}</span>
                </div>
              </div>
              <div v-else class="sidebar-empty">
                <el-empty description="暂无词条" :image-size="80" />
              </div>
            </div>

            <div class="sidebar-card mt-20">
              <h4 class="sidebar-title">社区统计</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ stats.bars || 0 }}</div>
                  <div class="stat-label">产品吧</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ stats.entries || 0 }}</div>
                  <div class="stat-label">词条数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ stats.users || 0 }}</div>
                  <div class="stat-label">注册用户</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ stats.owners || 0 }}</div>
                  <div class="stat-label">吧主数</div>
                </div>
              </div>
            </div>

            <div class="sidebar-card mt-20">
              <h4 class="sidebar-title">快速导航</h4>
              <div class="quick-links">
                <router-link to="/" class="quick-link">
                  <el-icon><HomeFilled /></el-icon>
                  <span>首页</span>
                </router-link>
                <template v-if="userStore.isAdmin">
                  <router-link to="/admin" class="quick-link">
                    <el-icon><Setting /></el-icon>
                    <span>管理后台</span>
                  </router-link>
                  <router-link to="/admin/bars" class="quick-link">
                    <el-icon><Plus /></el-icon>
                    <span>创建产品吧</span>
                  </router-link>
                  <router-link to="/admin/entries" class="quick-link">
                    <el-icon><Document /></el-icon>
                    <span>管理词条</span>
                  </router-link>
                </template>
                <template v-else>
                  <a href="#" class="quick-link">
                    <el-icon><User /></el-icon>
                    <span>申请吧主</span>
                  </a>
                  <a href="#" class="quick-link">
                    <el-icon><HelpFilled /></el-icon>
                    <span>帮助中心</span>
                  </a>
                  <a href="#" class="quick-link">
                    <el-icon><ChatDotRound /></el-icon>
                    <span>意见反馈</span>
                  </a>
                </template>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>淘宝产品吧</h4>
            <p>产品级资料分享社区，让用户在购买前获得产品级资料、经验分享和买家秀。</p>
          </div>
          <div class="footer-section">
            <h4>快速链接</h4>
            <ul>
              <li><router-link to="/">首页</router-link></li>
              <li><a href="#">关于我们</a></li>
              <li><a href="#">帮助中心</a></li>
              <li><a href="#">社区规范</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>联系我们</h4>
            <ul>
              <li>邮箱：support@taobao.com</li>
              <li>地址：杭州市文三路</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2024 淘宝产品吧 - 产品级资料分享社区</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { barApi } from '@/api/bar'
import { entryApi } from '@/api/entry'
import { categoryApi } from '@/api/category'
import { adminApi } from '@/api/admin'

const router = useRouter()
const userStore = useUserStore()

const barsLoading = ref(false)
const entriesLoading = ref(false)
const barsError = ref('')
const bars = ref([])
const categories = ref([])
const hotEntries = ref([])
const stats = ref({})
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const totalPages = ref(0)
const searchKeyword = ref('')
const selectedCategory = ref(null)

const fetchBars = async () => {
  barsLoading.value = true
  barsError.value = ''
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      status: 1
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    const res = await barApi.getList(params)
    const data = res?.data || {}
    bars.value = data.list || []
    total.value = data.total || 0
    totalPages.value = data.totalPages || 0
  } catch (err) {
    barsError.value = err.message || '加载失败'
  } finally {
    barsLoading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categories.value = res?.data || []
  } catch (err) {
    console.error('获取分类失败:', err)
  }
}

const fetchHotEntries = async () => {
  entriesLoading.value = true
  try {
    const res = await entryApi.getList({ page: 1, pageSize: 10, status: 1 })
    hotEntries.value = res?.data?.list || []
  } catch (err) {
    console.error('获取热门词条失败:', err)
  } finally {
    entriesLoading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await adminApi.getStats()
    stats.value = res?.data || {}
  } catch (err) {
    console.error('获取统计失败:', err)
  }
}

const selectCategory = (catId) => {
  selectedCategory.value = selectedCategory.value === catId ? null : catId
  page.value = 1
  fetchBars()
}

const handleSearch = () => {
  page.value = 1
  fetchBars()
}

const handlePageChange = (p) => {
  page.value = p
  fetchBars()
}

const goToBar = (id) => {
  router.push(`/bar/${id}`)
}

const goToEntry = (id) => {
  router.push(`/entry/${id}`)
}

const scrollToBars = () => {
  document.querySelector('.bars-section')?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToEntries = () => {
  document.querySelector('.sidebar-section')?.scrollIntoView({ behavior: 'smooth' })
}

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
}

onMounted(() => {
  fetchBars()
  fetchCategories()
  fetchHotEntries()
  fetchStats()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
}

.site-header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  padding: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
}

.logo h1 {
  color: #fff;
  margin: 0;
  font-size: 24px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin-left: 10px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav a {
  color: #fff;
  text-decoration: none;
  font-size: 14px;
}

.nav a:hover,
.nav a.active {
  text-decoration: underline;
}

.admin-link {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 4px;
}

.logout-btn {
  color: #fff !important;
}

.user-name {
  color: #fff;
  font-size: 14px;
}

.main-content {
  flex: 1;
  padding: 30px 0;
}

.hero-section {
  text-align: center;
  padding: 60px 40px;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.hero-section h2 {
  font-size: 32px;
  color: #333;
  margin: 0 0 15px 0;
}

.hero-section p {
  color: #666;
  font-size: 18px;
  margin: 0 0 30px 0;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.categories-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.categories-nav {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.category-tag {
  cursor: pointer;
  padding: 8px 16px;
  font-size: 14px;
  transition: all 0.2s;
}

.category-tag:hover {
  transform: translateY(-2px);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.bars-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.error-state,
.empty-state {
  text-align: center;
  padding: 60px 0;
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.bars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.bar-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.bar-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.bar-cover {
  height: 140px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.bar-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bar-cover-placeholder {
  font-size: 48px;
  color: #c0c4cc;
}

.bar-info {
  padding: 16px;
}

.bar-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.bar-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #909399;
  height: 36px;
  line-height: 18px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bar-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.bar-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.sidebar-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-item {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.entry-item:hover {
  background: #e6f7ff;
}

.entry-title {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.entry-bar {
  display: block;
  font-size: 12px;
  color: #909399;
}

.sidebar-empty {
  padding: 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  color: #606266;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
}

.quick-link:hover {
  background: #e6f7ff;
  color: #409eff;
}

.mt-20 {
  margin-top: 20px;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-footer {
  background: #303133;
  padding: 40px 0 20px;
  margin-top: 40px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 30px;
}

.footer-section h4 {
  color: #fff;
  margin: 0 0 16px 0;
  font-size: 16px;
}

.footer-section p {
  color: #909399;
  margin: 0;
  line-height: 1.8;
  font-size: 14px;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section ul li {
  margin-bottom: 10px;
}

.footer-section ul li a {
  color: #909399;
  text-decoration: none;
  font-size: 14px;
}

.footer-section ul li a:hover {
  color: #fff;
}

.footer-bottom {
  border-top: 1px solid #444;
  padding-top: 20px;
  text-align: center;
}

.footer-bottom p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}
</style>
